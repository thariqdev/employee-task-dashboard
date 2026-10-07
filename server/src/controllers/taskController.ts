import type { RequestHandler } from 'express';
import * as taskService from '../services/taskService.js';

export const list: RequestHandler = async (_req, res) => {
  const { tasks, meta } = await taskService.listTasks(res.locals.query);
  res.json({ data: tasks, meta });
};

export const create: RequestHandler = async (req, res) => {
  const task = await taskService.createTask(req.body);
  res.status(201).json({ data: task });
};

export const update: RequestHandler = async (req, res) => {
  const task = await taskService.updateTask(res.locals.params.id, req.body);
  res.json({ data: task });
};

export const remove: RequestHandler = async (_req, res) => {
  const result = await taskService.deleteTask(res.locals.params.id);
  res.json({ data: result });
};
