import express, { Express } from 'express';
import cors from 'cors';

import router from './routes';
import { connectDB } from './db/db';

const app: Express = express();

export const loadApp = async () => {
	await connectDB();
	app.use(express.json());
	app.use(cors());
	app.use(router);
	return app;
};
