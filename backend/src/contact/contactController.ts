import { Request, Response, NextFunction } from 'express';
import * as ContactService from './ContactService.js';
import { sendCreated } from '../shared/utils/ApiResponse.js';

export async function createContact(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const contact = await ContactService.create(req.body);
    sendCreated(res, { data: contact, message: 'Mensaje recibido correctamente' });
  } catch (err) {
    next(err);
  }
}
