import Contact from './Contact.js';
import { badRequest } from '../shared/utils/AppError.js';

export async function create(data: { name: string; email: string; subject: string; message: string }) {
  if (!data.name || !data.email || !data.subject || !data.message) {
    throw badRequest('Todos los campos son obligatorios');
  }

  return Contact.create(data);
}
