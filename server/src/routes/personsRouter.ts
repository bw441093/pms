import { Router } from 'express';
import validator from '../middleware/validationMiddleware';

import {
	deletePersonHandler,
	getManagersHandler,
	getPersonsHandler,
	postMoveHandler,
	postPersonHandler,
	updateMoveHandler,
	updateStatusHandler,
	updateAlertHandler,
	deleteMoveHandler,
	getPersonByIdHandler,
	alertAllUsersHandler,
	updatePersonDetailsHandler,
	getSitePersonsHandler,
	getDirectReportsHandler,
} from '../handlers/persons';
import authorize from '../middleware/authorization';
import {
	idSchema,
	postMoveSchema,
	postPersonSchema,
	systemRolesSchema,
	updateMoveSchema,
	updateStatusSchema,
	updateAlertSchema,
	updatePersonDetailsSchema,
	userIdSchema,
} from '../validations/person';

const router = Router();

router.post(
	'/',
	authorize(['siteManager', 'personnelManager', 'hrManager', 'admin']),
	validator({ body: postPersonSchema }),
	postPersonHandler
);
router.delete(
	'/:id',
	authorize(['siteManager', 'personnelManager', 'hrManager', 'admin']),
	validator({ params: idSchema }),
	deletePersonHandler
);
router.get('/', getPersonsHandler);
router.get('/managers', getManagersHandler);
router.post(
	'/alert-all',
	authorize(['hrManager', 'admin']),
	alertAllUsersHandler
);
router.get('/:id', validator({ params: idSchema }), getPersonByIdHandler);
router.put(
	'/:id/status',
	validator({ params: idSchema, body: updateStatusSchema }),
	updateStatusHandler
);
router.post(
	'/:id/alert',
	validator({ params: idSchema, body: updateAlertSchema }),
	updateAlertHandler
);
router.post(
	'/:id/move',
	validator({ params: idSchema, body: postMoveSchema }),
	postMoveHandler
);
router.patch(
	'/:id/move',
	validator({ params: idSchema, body: updateMoveSchema }),
	updateMoveHandler
);
router.delete('/:id/move', validator({ params: idSchema }), deleteMoveHandler);
router.put(
	'/:id/details',
	authorize(['siteManager', 'personnelManager', 'hrManager', 'admin']),
	validator({ params: idSchema, body: updatePersonDetailsSchema }),
	updatePersonDetailsHandler
);
router.get('/site/:userId', validator({ params: userIdSchema }), getSitePersonsHandler);
router.get('/:userId/direct-reports', validator({ params: userIdSchema }), getDirectReportsHandler);

export default router;
