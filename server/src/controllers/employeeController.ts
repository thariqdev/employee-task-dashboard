import type { RequestHandler } from 'express';
import * as employeeService from '../services/employeeService.js';

export const list: RequestHandler = async (_req, res) => {
  const { employees, meta } = await employeeService.listEmployees(res.locals.query);
  res.json({ data: employees, meta });
};

export const create: RequestHandler = async (req, res) => {
  const employee = await employeeService.createEmployee(req.body);
  res.status(201).json({ data: employee });
};

export const update: RequestHandler = async (req, res) => {
  const employee = await employeeService.updateEmployee(res.locals.params.id, req.body);
  res.json({ data: employee });
};

export const remove: RequestHandler = async (_req, res) => {
  const result = await employeeService.deleteEmployee(res.locals.params.id);
  res.json({ data: result });
};
