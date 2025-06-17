import { Router } from 'express';
import validator from '../middleware/validationMiddleware';
import authenticate from '../middleware/authentication';
import { loginHandler, twoFactorHandler } from '../handlers/auth';
import { loginSchema, otpVerifySchema } from '../validations/person';

const router = Router();

// router.post('/login', validator({ body: loginSchema }), loginHandler);
router.post('/login', validator({ body: loginSchema }), loginHandler);
router.post(
	'/2fa',
	authenticate('loginFulfilled'),
	validator({ body: otpVerifySchema }),
	twoFactorHandler
);

export default router;
