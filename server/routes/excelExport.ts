import { Router } from 'express';
import { exportExcal } from '../handlers/excelExport'

const router = Router()
router.get('/', exportExcal)

export default router;
