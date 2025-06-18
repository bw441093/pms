import type { Express } from 'express';
import express from 'express';
import cors from 'cors';
import path from 'path';

import router from './routes';

const app: Express = express();

export const loadApp = async () => {
	app.use(express.json());
	app.use(cors());

	// API routes should come before static file serving
	app.use('/api', router);

	// Serve static files from the build directory
	app.use(express.static(path.join(process.cwd(), 'build')));

	// Catch-all route to serve index.html for client-side routing
	app.get('/', (req, res) => {
		res.sendFile(path.join(process.cwd(), 'build', 'index.html'));
	});

	return app;
};
