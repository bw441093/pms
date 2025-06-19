import { createLogger, format, transports } from 'winston';

const { combine, timestamp, printf, colorize, errors } = format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
	return `[${timestamp}] ${level}: ${stack || message}`;
});

export const logger = createLogger({
	level: 'debug', // Change this for production to 'info' or 'warn'
	format: combine(
		colorize(),
		timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
		errors({ stack: true }), // show stack traces for errors
		logFormat
	),
	transports: [new transports.Console()],
});
