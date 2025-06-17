import { Router, Request, Response } from 'express';

import authRouter from './auth';
import userRouter from './personsRouter';
import authenticate from '../middleware/authentication';

const router = Router();

router.use('/health', (req: Request, res: Response) => {
	res.send('good');
});
router.use('/auth', authRouter);
router.use('/users', authenticate(), userRouter);

export default router;
