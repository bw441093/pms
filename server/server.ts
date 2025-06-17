import express, { Express } from 'express';
import cors from 'cors';

import router from './routes';

const app: Express = express();

export const loadApp = async () => {
	app.use(express.json());
	app.use(cors());
	app.use(router);
	return app;
};
