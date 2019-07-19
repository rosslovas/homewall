import compression from 'compression';
import express from 'express';
import helmet from 'helmet';
import sizeOf from 'image-size';
import * as path from 'path';
import * as PostgressConnectionStringParser from 'pg-connection-string';
import { ConnectionOptions, createConnection } from 'typeorm';
import { Hold } from './entities/Hold';
import { Image } from './entities/Image';
import { Problem } from './entities/Problem';
import { Wall } from './entities/Wall';
import RateLimit from 'express-rate-limit';
import enforceHTTPS from 'express-enforces-ssl';
import * as argon2 from 'argon2';
import { User } from './entities/User';

(async () => {

	const connection = await createConnection((() => {
		const databaseUrl: string | undefined = process.env.DATABASE_URL;
		if (databaseUrl) {
			const connectionOptions = PostgressConnectionStringParser.parse(databaseUrl);
			return {
				type: 'postgres',
				host: connectionOptions.host,
				port: connectionOptions.port,
				username: connectionOptions.user,
				password: connectionOptions.password,
				database: connectionOptions.database,
				entities: [__dirname + '/entities/*.js'],
				migrations: [__dirname + '/migrations/*.js'],
				synchronize: true,
				extra: {
					ssl: true
				}
			} as ConnectionOptions;
		}
	})()!);

	const wallRepository = connection.getRepository(Wall);
	const problemRepository = connection.getRepository(Problem);

	const app = express();
	
	app.enable('trust proxy');
	app.use(enforceHTTPS());
	app.use(compression());
	app.use(helmet());

	app.get('*', new RateLimit({
		windowMs: 10 * 60 * 1000,
		max: 500
	}));
	const postOrPutOrDeleteLimit = new RateLimit({
		windowMs: 10 * 60 * 1000,
		max: 30
	});
	app.post('*', postOrPutOrDeleteLimit);
	app.put('*', postOrPutOrDeleteLimit);
	app.delete('*', postOrPutOrDeleteLimit);

	app.use(express.static(path.join(__dirname, '../../client/build'), { maxAge: '1y' }));
	app.use(express.json({ limit: 2000000 }));

	app.get('/api/walls', async (req, res) => {
		const walls = await wallRepository.find({ order: { createdOn: 'DESC' } });

		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify(walls, null, 2));
	});

	app.post('/api/walls', async (req, res) => {
		const { username, password, name, image, holdData }: {
			username: string,
			password: string,
			name: string,
			image: string,
			holdData: { x: number, y: number }[][]
		} = req.body;

		if (!name || !image || !holdData) {
			res.status(400);
			res.end('Missing data');
			return;
		}

		if (holdData.length < 3) {
			res.status(400);
			res.end('Too few holds (< 3) is invalid');
			return;
		}

		if (holdData.length > 1000) {
			res.status(400);
			res.end('Too many holds (> 1000) is invalid');
			return;
		}

		if (holdData.some(h => h.length > 10000)) {
			res.status(400);
			res.end('A hold with too much data (> 10000 points) is invalid');
			return;
		}

		const imageBuffer = Buffer.from(image, 'base64');
		if (imageBuffer.length < 107 || imageBuffer.length > 1000000) {
			res.status(400);
			res.end('toosmall/large');
			return;
		}

		const imageInfo = sizeOf(imageBuffer);
		if (imageInfo.type !== 'jpg' ||
			imageInfo.width <= 1 || imageInfo.height <= 1 ||
			imageInfo.width > 2000 || imageInfo.height > 2000
		) {
			res.status(400);
			res.end('badsize');
			return;
		}

		const user = await connection.getRepository(User).findOne({ where: { username } });
		if (!user || !(await argon2.verify(user.passwordHash, password))) {
			res.status(401);
			res.end('Bad username and/or password');
			return;
		}

		const newWall = new Wall(name, new Image(imageBuffer));
		newWall.holds = holdData.map((points, i) => {
			const hold = new Hold(`Hold ${i}`);
			hold.data = JSON.stringify(points.map(p => {
				if (typeof p.x !== 'number' || typeof p.y !== 'number') {
					throw new Error('Invalid data');
				}

				return { x: p.x, y: p.y };
			}));
			return hold;
		});
		await connection.getRepository(Wall).save(newWall);

		console.log(`New wall has id ${newWall.id}`);

		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify(newWall.id));
	});

	app.get('/api/wall/:wallId(\\d+)', async (req, res) => {
		const { wallId }: { wallId: string } = req.params;

		const wall = await wallRepository.findOneOrFail(wallId, { relations: ['holds'] });

		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify(wall, null, 2));
	});
	
	app.get('/api/wall/:wallId(\\d+)/image', async (req, res) => {
		const { wallId }: { wallId: string } = req.params;

		const wall = await wallRepository.findOne(wallId, { relations: ['image'] });
		if (!wall || !wall.image || !wall.image.data) {
			res.status(400);
			res.end(`Failed to load image for wall ${wallId}`);
			return;
		}

		const ifModifiedSince = req.headers['if-modified-since'];
		if (ifModifiedSince && new Date(wall.image.createdOn!.toUTCString())! <= new Date(ifModifiedSince)) {
			res.status(304);
			res.end();
			return;
		}

		res.contentType('image/jpeg');
		res.set('Cache-Control', 'public, max-age=31557600');
		res.set('Last-Modified', wall.image.createdOn!.toUTCString());
		res.end(wall.image.data);
	});

	app.get('/api/problems', async (req, res) => {
		const walls = await wallRepository
			.createQueryBuilder('wall')
			.innerJoinAndSelect('wall.problems', 'problem')
			.where('problem.deletedOn is null')
			.orderBy('wall.createdOn', 'DESC')
			.addOrderBy('problem.createdOn', 'DESC')
			.getMany();

		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify(walls, null, 2));
	});

	app.get('/api/problems/trash', async (req, res) => {
		const walls = await wallRepository
			.createQueryBuilder('wall')
			.innerJoinAndSelect('wall.problems', 'problem')
			.where('problem.deletedOn is not null')
			.orderBy('wall.createdOn', 'DESC')
			.addOrderBy('problem.createdOn', 'DESC')
			.getMany();

		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify(walls, null, 2));
	});

	app.get('/api/wall/:wallId(\\d+)/problems', async (req, res) => {
		const { wallId }: { wallId: string } = req.params;

		const wall = await wallRepository
			.createQueryBuilder('wall')
			.leftJoinAndSelect('wall.problems', 'problem')
			.where('wall.id = :wallId', { wallId })
			.andWhere('problem.deletedOn is null')
			.orderBy('problem.createdOn', 'DESC')
			.getOne();

		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify(wall ? wall.problems : [], null, 2));
	});

	app.get('/api/wall/:wallId(\\d+)/problems/trash', async (req, res) => {
		const { wallId }: { wallId: string } = req.params;

		const wall = await wallRepository
			.createQueryBuilder('wall')
			.leftJoinAndSelect('wall.problems', 'problem')
			.where('wall.id = :wallId', { wallId })
			.andWhere('problem.deletedOn is not null')
			.orderBy('problem.createdOn', 'DESC')
			.getOne();

		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify(wall ? wall.problems : [], null, 2));
	});

	app.post('/api/wall/:wallId(\\d+)/problems', async (req, res) => {
		const { wallId }: { wallId: string } = req.params;

		const data: {
			problemName: string,
			difficulty: string,
			holdIds: number[],
		} = req.body;

		if (!data.problemName) {
			return res.status(400).end(`All problems must have a name`);
		}
		if (data.holdIds.length < 2) {
			return res.status(400).end(`All problems must have at least 2 holds`);
		}

		const wall = await wallRepository.findOneOrFail(wallId, { relations: ['holds'] });
		// TODO: Save the linked holds without first looking them up in db?
		const problem = new Problem({
			name: data.problemName,
			difficulty: data.difficulty || undefined,
			holds: wall!.holds!.filter(hold => data.holdIds.includes(hold.id!)),
			wall
		});
		await problemRepository.save(problem);
		console.log(`New problem has id ${problem.id}`);

		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify(problem.id));
	});

	app.get('/api/wall/:wallId(\\d+)/problem/:problemId(\\d+)', async (req, res) => {
		const { wallId, problemId }: { wallId: string, problemId: string } = req.params;

		const problem = await problemRepository
			.findOne(problemId, { relations: ['wall', 'holds'] });

		if (!problem || !problem.wall || problem.wall.id !== parseInt(wallId)) {
			return res.status(404).end('404 Not Found');
		}

		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify(problem, null, 2));
	});

	app.delete('/api/wall/:wallId(\\d+)/problem/:problemId(\\d+)', async (req, res) => {
		const { wallId, problemId }: { wallId: string, problemId: string } = req.params;
		
		await problemRepository.update(problemId, { deletedOn: new Date() });

		res.end();
	});

	app.post('/api/wall/:wallId(\\d+)/problem/:problemId(\\d+)/restore', async (req, res) => {
		const { wallId, problemId }: { wallId: string, problemId: string } = req.params;
		
		await problemRepository.update(problemId, { deletedOn: undefined });

		res.end();
	});

	app.get('/api', (req, res) => res.status(404).end('404 Not Found'));
	app.get('/api/*', (req, res) => res.status(404).end('404 Not Found'));

	// Serve frontend
	app.get('*', (req, res) => {
		res.sendFile(path.resolve(__dirname, '../../client/build/index.html'));
	});

	app.listen(process.env.PORT || 9000);

})();
