import express from 'express';
import { createConnection } from 'typeorm';
import { Hold } from './entities/Hold';
import { Wall } from './entities/Wall';

(async () => {

	const connection = await createConnection({
		type: 'sqlite',
		database: './db.sqlite',
		entities: [
			__dirname + '/entities/*.js'
		],
		synchronize: true,
		logging: true
	});

	const testWall = new Wall('test wall');
	testWall.holds = [
		new Hold('hold A'),
		new Hold('hold B'),
	];

	await connection.manager.save(testWall);


	const app = express();

	app.get('/api/create', (req, res) => {

	});

	app.get('/api/wall/:id', async (req, res) => {
		const wall = await connection.manager.findOne(Wall, req.params.id, { relations: ['holds'] });

		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify(wall, null, 2));
	});

	app.listen(9000);

})();
