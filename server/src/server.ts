import compression from 'compression';
import cors from 'cors';
import express from 'express';
import * as path from 'path';
import { createConnection, ConnectionOptions } from 'typeorm';
import { Problem } from './entities/Problem';
import { Wall } from './entities/Wall';
import { seedDb } from './seedDb';
import * as PostgressConnectionStringParser from 'pg-connection-string';

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
				synchronize: true,
				extra: {
					ssl: true
				}
			} as ConnectionOptions;
		}
	})()!);

	await seedDb();
	const wallRepository = connection.getRepository(Wall);
	const problemRepository = connection.getRepository(Problem);

	const app = express();
	app.use(compression());
	app.use(cors());
	app.options('*', cors());
	app.use(express.static(path.join(__dirname, '../../client/build')));
	app.use(express.json());

	app.get('/api/walls', async (req, res) => {
		const walls = await wallRepository.find();

		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify(walls, null, 2));
	});

	app.post('/api/walls', async (req, res) => {

	});

	app.get('/api/wall/:wallId(\\d+)', async (req, res) => {
		const { wallId }: { wallId: string } = req.params;

		const wall = await wallRepository.findOneOrFail(wallId, { relations: ['holds'] });

		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify(wall, null, 2));
	});

	app.get('/api/wall/:wallId(\\d+)/problems', async (req, res) => {
		const { wallId }: { wallId: string } = req.params;

		const wall = await wallRepository
			.createQueryBuilder('wall')
			.where('wall.id = :wallId', { wallId })
			.innerJoinAndSelect('wall.problems', 'problems')
			.orderBy('problems', 'DESC')
			.getOne();

		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify(wall!.problems, null, 2));
	});

	app.post('/api/wall/:wallId(\\d+)/problems', async (req, res) => {
		const { wallId }: { wallId: string } = req.params;

		const data: {
			problemName: string,
			difficulty: string,
			holdIds: number[],
		} = req.body;
		console.log(`req.body: ${JSON.stringify(data)}`);
		if (!data.problemName) {
			return res.status(400).end(`All problems must have a name`);
		}
		if (data.holdIds.length < 2) {
			return res.status(400).end(`All problems must have at least 2 holds`);
		}

		const wall = await wallRepository.findOneOrFail(wallId, { relations: ['holds'] });
		// TODO: Save the linked holds without first looking them up in db?
		const problem = new Problem(data.problemName);
		problem.difficulty = data.difficulty || undefined;
		problem.holds = wall!.holds!.filter(hold => data.holdIds.includes(hold.id!));
		problem.wall = wall;
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

	app.get('/api', (req, res) => res.status(404).end('404 Not Found'));
	app.get('/api/*', (req, res) => res.status(404).end('404 Not Found'));

	// Serve frontend
	app.get('*', (req, res) => {
		res.sendFile(path.resolve(__dirname, '../../client/build/index.html'));
	});

	app.listen(process.env.PORT || 9000);

})();
