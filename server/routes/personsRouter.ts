import { Router } from 'express';
import validator from '../middleware/validationMiddleware';

import {
	deletePersonHandler,
	getManagersHandler,
	getPersonsHandler,
	getReportHandler,
	postMoveHandler,
	postPersonHandler,
	updateMoveHandler,
	updateRolesHandler,
	updateStatusHandler,
	deleteMoveHandler,
	getPersonByIdHandler,
} from '../handlers/persons';
import authorize from '../middleware/authorization';
import {
	idSchema,
	postMoveSchema,
	postPersonSchema,
	rolesSchema,
	updateMoveSchema,
	updateStatusSchema,
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
router.get('/report', authorize(['hrManager', 'admin']), getReportHandler);
router.get('/:id', validator({ params: idSchema }), getPersonByIdHandler);
router.put(
	'/:id/roles',
	authorize(['siteManager', 'personnelManager', 'hrManager', 'admin']),
	validator({ params: idSchema, body: rolesSchema }),
	updateRolesHandler
);
router.put(
	'/:id/status',
	validator({ params: idSchema, body: updateStatusSchema }),
	updateStatusHandler
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

export default router;
