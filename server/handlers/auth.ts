import type { Request, Response } from 'express';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import jwt from 'jsonwebtoken';
import { totp } from 'otplib';

import { findUserById, findUserByUsername } from '../db/users';

dayjs.extend(utc);
// totp.options = { window: 1 };

export const loginHandler = async (req: Request, res: Response) => {
	try {
		const { username, password } = req.body;
		const user = await findUserByUsername(username);
		if (!user) {
			res.sendStatus(404);
			return;
		}

		if (!user?.password === password) {
			res.sendStatus(404);
			return;
		}

		const tokenPayload = {
			userId: user.id,
			status: 'loginFulfilled',
		};

		const token = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'secret', {
			algorithm: 'HS256',
			expiresIn: 60 * 10, // 10 minute expiration
		});

		res.send(token);
	} catch (err) {
		res.status(500);
		res.send(err);
		console.log(`Error fetching tasks, error: ${err}`);
	}
};

export const twoFactorHandler = async (req: Request, res: Response) => {
	try {
		const userId = req.user;
		const { otp } = req.body;
		console.log(otp);
		const user = await findUserById(userId);
		if (!user) {
			res.sendStatus(404);
			return;
		}

		if (!totp.check(`${otp}`, user.twoFactorSecret)) {
			res.status(401).send('Wrong code!');
			return;
		}

		const tokenPayload = {
			userId: user.id,
			status: '2faFulfilled',
		};

		const token = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'secret', {
			algorithm: 'HS256',
			expiresIn: 60 * 60, // 60 minute expiration
		});

		res.send(token);
	} catch (err) {
		res.status(500);
		res.send(err);
		console.log(`Error fetching tasks, error: ${err}`);
	}
};
