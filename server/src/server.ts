import * as argon2 from 'argon2';
import compression from 'compression';
import express, { Request, Response } from 'express';
import enforceHTTPS from 'express-enforces-ssl';
import RateLimit from 'express-rate-limit';
import helmet from 'helmet';
import sizeOf from 'image-size';
import onHeaders from 'on-headers';
import * as path from 'path';
import * as PostgressConnectionStringParser from 'pg-connection-string';
import { ConnectionOptions, createConnection } from 'typeorm';
import { Hold } from './entities/Hold';
import { Image } from './entities/Image';
import { Problem } from './entities/Problem';
import { User } from './entities/User';
import { Wall } from './entities/Wall';

class BadRequestError extends Error {
	name = 'BadRequestError';
}

class UnauthorisedError extends Error {
	name = 'UnauthorisedError';
}

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
	const userRepository = connection.getRepository(User);

	const app = express();

	function get(path: string, handler: (req: Request, res: Response) => Promise<any>) {
		return app.get(path, (req, res, next) => handler(req, res).catch(next));
	}

	function post(path: string, handler: (req: Request, res: Response) => Promise<any>) {
		return app.post(path, (req, res, next) => handler(req, res).catch(next));
	}

	function put(path: string, handler: (req: Request, res: Response) => Promise<any>) {
		return app.put(path, (req, res, next) => handler(req, res).catch(next));
	}

	function del(path: string, handler: (req: Request, res: Response) => Promise<any>) {
		return app.delete(path, (req, res, next) => handler(req, res).catch(next));
	}
	
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

	app.use(express.static(path.join(__dirname, '../../client/build'), { maxAge: '1y', index: false }));
	app.use(express.json({ limit: 2000000 }));

	get('/api/walls', async (req, res) => {
		const walls = await wallRepository.find({ order: { createdOn: 'DESC' } });

		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify(walls, null, 2));
	});

	post('/api/walls', async (req, res) => {
		const { username, password, name, image, holdData }: {
			username: string,
			password: string,
			name: string,
			image: string,
			holdData: { x: number, y: number }[][]
		} = req.body;

		if (!name || !image || !holdData) {
			throw new BadRequestError('Missing data');
		}

		if (holdData.length < 3) {
			throw new BadRequestError('Too few holds (< 3) is invalid');
		}

		if (holdData.length > 1000) {
			throw new BadRequestError('Too many holds (> 1000) is invalid');
		}

		if (holdData.some(h => h.length > 10000)) {
			throw new BadRequestError('A hold with too much data (> 10000 points) is invalid');
		}

		const imageBuffer = Buffer.from(image, 'base64');
		if (imageBuffer.length < 107 || imageBuffer.length > 1000000) {
			throw new BadRequestError('Image file is too invalid or too large');
		}

		const imageInfo = sizeOf(imageBuffer);
		if (imageInfo.type !== 'jpg' ||
			imageInfo.width <= 1 || imageInfo.height <= 1 ||
			imageInfo.width > 2000 || imageInfo.height > 2000
		) {
			throw new BadRequestError('Image must be between 1x1 and 2000x2000 pixels');
		}

		const user = await userRepository.findOne({ where: { username } });
		if (!user || !(await argon2.verify(user.passwordHash, password))) {
			throw new UnauthorisedError('Bad username and/or password');
		}

		const newWall = new Wall(name, new Image(imageBuffer));
		newWall.holds = holdData.map((points, i) => {
			const hold = new Hold();
			hold.data = JSON.stringify(points.map(p => {
				if (typeof p.x !== 'number' || typeof p.y !== 'number') {
					throw new BadRequestError('Invalid data');
				}

				return { x: p.x, y: p.y };
			}));
			return hold;
		});
		await wallRepository.save(newWall);

		console.log(`New wall has id ${newWall.id}`);

		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify(newWall.id));
	});

	get('/api/wall/:wallId(\\d+)', async (req, res) => {
		const { wallId }: { wallId: string } = req.params;

		const wall = await wallRepository.findOneOrFail(wallId, { relations: ['holds'] });

		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify(wall, null, 2));
	});
	
	get('/api/wall/:wallId(\\d+)/image', async (req, res) => {
		const { wallId }: { wallId: string } = req.params;

		const wall = await wallRepository.findOne(wallId, { relations: ['image'] });
		if (!wall || !wall.image || !wall.image.data) {
			throw new BadRequestError(`Failed to load image for wall ${wallId}`);
		}

		const ifModifiedSince = req.headers['if-modified-since'];
		if (ifModifiedSince && new Date(wall.image.createdOn!.toUTCString())! <= new Date(ifModifiedSince)) {
			return res.status(304).end();
		}

		res.contentType('image/jpeg');
		res.set('Cache-Control', 'public, max-age=31557600');
		res.set('Last-Modified', wall.image.createdOn!.toUTCString());
		res.end(wall.image.data);
	});

	get('/api/problems', async (req, res) => {
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

	get('/api/problems/trash', async (req, res) => {
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

	get('/api/wall/:wallId(\\d+)/problems', async (req, res) => {
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

	get('/api/wall/:wallId(\\d+)/problems/trash', async (req, res) => {
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

	post('/api/wall/:wallId(\\d+)/problems', async (req, res) => {
		const { wallId }: { wallId: string } = req.params;

		const data: {
			problemName: string,
			difficulty: string,
			startHold1Id: number,
			startHold2Id?: number,
			endHold1Id: number,
			endHold2Id?: number,
			holdIds: number[]
		} = req.body;

		if (!data.problemName) {
			throw new BadRequestError('All problems must have a name');
		}
		if (data.startHold1Id == null) {
			throw new BadRequestError('All problems must have at least 1 start hold');
		}
		if (data.endHold1Id == null) {
			throw new BadRequestError('All problems must have at least 1 end hold');
		}

		const wall = await wallRepository.findOneOrFail(wallId, { relations: ['holds'] });
		const holdsById = wall.holds!.reduce((map, hold) => {
			map.set(hold.id!, hold);
			return map;
		}, new Map<number, Hold>());

		if (data.holdIds
			.some(holdId =>
				holdId === data.startHold1Id ||
				holdId === data.startHold2Id ||
				holdId === data.endHold1Id ||
				holdId === data.endHold2Id ||
				typeof holdId !== 'number' ||
				!holdsById.has(holdId)
			) ||
			!holdsById.has(data.startHold1Id) ||
			(data.startHold2Id != null && !holdsById.has(data.startHold2Id)) ||
			!holdsById.has(data.endHold1Id) ||
			(data.endHold2Id != null && !holdsById.has(data.endHold2Id))
		) {
			throw new BadRequestError('Invalid hold data');
		}

		// TODO: Save the linked holds without first looking them up in db?
		const problem = new Problem({
			name: data.problemName,
			difficulty: data.difficulty || undefined,
			wall,
			startHold1: holdsById.get(data.startHold1Id)!,
			startHold2: data.startHold2Id != null ? holdsById.get(data.startHold2Id)! : undefined,
			endHold1: holdsById.get(data.endHold1Id)!,
			endHold2: data.endHold2Id != null ? holdsById.get(data.endHold2Id)! : undefined,
			holds: data.holdIds.map(holdId => holdsById.get(holdId)!)
		});
		await problemRepository.save(problem);

		console.log(`New problem has id ${problem.id}`);

		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify(problem.id));
	});

	get('/api/wall/:wallId(\\d+)/problem/:problemId(\\d+)', async (req, res) => {
		const { wallId, problemId }: { wallId: string, problemId: string } = req.params;

		const problem = await problemRepository
			.findOne(problemId, { relations: ['wall', 'holds', 'startHold1', 'startHold2', 'endHold1', 'endHold2'] });

		if (!problem || !problem.wall || problem.wall.id !== parseInt(wallId)) {
			return res.status(404).end('404 Not Found');
		}

		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify(problem, null, 2));
	});

	del('/api/wall/:wallId(\\d+)/problem/:problemId(\\d+)', async (req, res) => {
		const { wallId, problemId }: { wallId: string, problemId: string } = req.params;
		
		await problemRepository.update(problemId, { deletedOn: new Date() });

		res.end();
	});

	post('/api/wall/:wallId(\\d+)/problem/:problemId(\\d+)/restore', async (req, res) => {
		const { wallId, problemId }: { wallId: string, problemId: string } = req.params;
		
		await problemRepository.update(problemId, { deletedOn: undefined });

		res.end();
	});

	get('/api', async (req, res) => res.status(404).end('404 Not Found'));
	get('/api/*', async (req, res) => res.status(404).end('404 Not Found'));

	// Serve frontend
	app.get('*', (req, res) => {
		// Scrub the ETag header to ensure no caching
		onHeaders(res, function () { this.removeHeader('ETag') });
		res.sendFile(path.resolve(__dirname, '../../client/build/index.html'), {
			headers: {
				'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
				'Expires': '0'
			}
		});
	});

	// Exception handler
	app.use(((error: Error, req: Request, res: Response, next: unknown) => {
		if (error.constructor === BadRequestError) {
			return res.status(400).end(error.message);
		} else if (error.constructor === UnauthorisedError) {
			return res.status(401).end(error.message);
		} else {
			return res.status(500).end(error.message);
		}
	}) as any);

	app.listen(process.env.PORT || 9000);

})();
