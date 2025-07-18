import { Router } from 'express';
import validator from '../middleware/validationMiddleware';

import {
	deletePersonHandler,
	getManagersHandler,
	getPersonsHandler,
	createTransactionHandler,
	postPersonHandler,
	confirmTransactionHandler,
	updatePersonStatusHandler,
	updatePersonAlertHandler,
	getPersonByIdHandler,
	updateGlobalAlertHandler,
	updatePersonDetailsHandler,
	getSitePersonsHandler,
	getDirectReportsHandler,
} from '../handlers/persons';
import authorize from '../middleware/authorization';
import {
	idSchema,
	postTransactionSchema,
	postPersonSchema,
	systemRolesSchema,
	patchTransactionSchema,
	putPersonStatusSchema,
	updatePersonDetailsSchema,
	userIdSchema,
} from '../validations/person';

const router = Router();

router.post(
	'/',
	authorize(['hrManager', 'admin']), // Only higher roles can create users
	validator({ body: postPersonSchema }),
	postPersonHandler
);
router.delete(
	'/:id',
	authorize(['hrManager', 'admin']), // Only higher roles can delete users
	validator({ params: idSchema }),
	deletePersonHandler
);
router.get('/', getPersonsHandler);
router.get('/managers', getManagersHandler);
router.post(
	'/alert-all',
	authorize(['hrManager', 'admin']),
	updateGlobalAlertHandler
);
router.get('/:id', validator({ params: idSchema }), getPersonByIdHandler);
router.put(
	'/:id/status',
	validator({ params: idSchema, body: putPersonStatusSchema }),
	updatePersonStatusHandler
);
router.post(
	'/:id/alert',
	validator({ params: idSchema }),
	updatePersonAlertHandler
);
router.post(
	'/:id/move',
	validator({ params: idSchema, body: postTransactionSchema }),
	createTransactionHandler
);
router.patch(
	'/:id/move',
	validator({ params: idSchema, body: patchTransactionSchema }),
	confirmTransactionHandler
);
router.put(
	'/:id/details',
	authorize([]), // Allow any authenticated user - handlers do proper authorization
	validator({ params: idSchema, body: updatePersonDetailsSchema }),
	updatePersonDetailsHandler
);
router.get('/site/:userId', validator({ params: userIdSchema }), getSitePersonsHandler);
router.get('/:userId/direct-reports', validator({ params: userIdSchema }), getDirectReportsHandler);

export default router;
