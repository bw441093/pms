import type { Express } from 'express';
import express from 'express';
import cors from 'cors';
import path from 'path';

import router from './routes';
import { connectDB } from './db/db';

const app: Express = express();

export const loadApp = async () => {
	await connectDB();
	app.use(express.json());
	app.use(cors());

	// API routes
	app.use('/api', router);

	// For development, just return a simple message for non-API routes
	app.get('*', (req, res) => {
		res.json({ message: 'API server is running. Use /api endpoints.' });
	});

	return app;
};
