import type { Express } from 'express';
import express from 'express';
import cors from 'cors';

import router from './routes';

const app: Express = express();

export const loadApp = async () => {
	app.use(express.json());
	app.use(cors());
	app.use(router);
	return app;
};
