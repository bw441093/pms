import type { Request, Response } from 'express';
import ExcelJS from 'exceljs';

import { logger } from '../logger';
import { find } from '../db/persons';

export const exportExcel = async (_: Request, res: Response) => {
	logger.info('Trying to export excel..');
	try {
		const persons = await find();
		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet('Persons Sheet');

		worksheet.columns = [
			{ header: 'Name', key: 'name', width: 20 },
			{ header: 'Site', key: 'site', width: 20 },
			{ header: 'Manager', key: 'manager', width: 20 },
			{ header: 'Location', key: 'location', width: 20 },
			{ header: 'Report Status', key: 'reportStatus', width: 20 },
		];

		persons.forEach((person) => {
			worksheet.addRow({
				name: person.name,
				site: person.site,
				manager: person.manager?.name || 'No Manager',
				location: person.location,
				reportStatus: person.reportStatus,
			});
		});

		res.setHeader(
			'Content-Type',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
		);
		res.setHeader('Content-Disposition', 'attachment; filename=persons.xlsx');

		await workbook.xlsx.write(res);
		res.end();
		logger.info('Export excel successfully');
	} catch (error: unknown) {
		const err = error instanceof Error ? error : new Error(String(error));
		logger.error(`Failed to export excel, error: ${err.message}`);
		res.status(500).send('Failed to export data');
	}
};
