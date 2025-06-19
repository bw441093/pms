import { Router } from 'express';
import type { Request, Response } from 'express';

import authRouter from './auth';
import userRouter from './personsRouter';
import authenticate from '../middleware/authentication';
import authorize from '../middleware/authorization';
import exportExcelRouter from './excelExport';

const router = Router();

router.get('/health', (req: Request, res: Response) => {
	res.send('good');
});
router.use('/auth', authRouter);
router.use('/users', authenticate(), userRouter);
router.use(
	'/export',
	authenticate(),
	authorize(['hrManager', 'admin']),
	exportExcelRouter
);

export default router;
