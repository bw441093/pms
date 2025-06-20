import type { WebSocket, WebSocketServer } from 'ws';
import { logger } from './logger';

let wss: WebSocketServer;

export const setWss = (ws: WebSocketServer) => {
	wss = ws;
	wss.on('connection', handleConnection);
};

export const broadcast = (event: string, data: unknown) => {
	if (!wss) {
		logger.error('WSS not initialized');
		return;
	}
	const message = JSON.stringify({ event, data });
	wss.clients.forEach((client) => {
		if (client.readyState === client.OPEN) {
			client.send(message);
		}
	});
};

export const handleConnection = (ws: WebSocket) => {
	logger.info('Client connected');

	ws.on('message', (message) => {
		logger.info(`Received message: ${message}`);
	});

	ws.on('close', () => {
		logger.info('Client disconnected');
	});

	ws.on('error', (error) => {
		logger.error(`WebSocket error: ${error.message}`);
	});
};
