import { Router } from 'express';
import { exportExcel } from '../handlers/excelExport';

const router = Router();
router.get('/', exportExcel);

export default router;
