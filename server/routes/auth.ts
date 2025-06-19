import { Router } from 'express';
import validator from '../middleware/validationMiddleware';
import authenticate from '../middleware/authentication';
import { identifyHandler } from '../handlers/auth';

const router = Router();

router.post('/identify', authenticate(), identifyHandler);

export default router;
