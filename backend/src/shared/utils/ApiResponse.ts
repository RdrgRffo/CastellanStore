import { Response } from 'express';

/**
 * Estructura normalizada de respuesta HTTP para toda la API.
 * El frontend siempre recibirá:
 * {
 *   success: true/false,
 *   data: ... (opcional),
 *   message: "...",
 *   error: "...", (solo si success=false)
 *   statusCode: 200
 * }
 */

interface ApiResponseOptions {
  data?: unknown;
  message?: string;
  error?: string;
  statusCode?: number;
}

export function sendSuccess(res: Response, options: ApiResponseOptions = {}) {
  const { data = null, message = 'Operación exitosa', statusCode = 200 } = options;
  return res.status(statusCode).json({
    success: true,
    data,
    message,
    statusCode,
  });
}

export function sendCreated(res: Response, options: ApiResponseOptions = {}) {
  const { data = null, message = 'Recurso creado correctamente' } = options;
  return sendSuccess(res, { data, message, statusCode: 201 });
}

export function sendError(res: Response, options: ApiResponseOptions = {}) {
  const { error = 'Error interno del servidor', message = 'Ha ocurrido un error', statusCode = 500 } = options;
  return res.status(statusCode).json({
    success: false,
    data: null,
    message,
    error,
    statusCode,
  });
}

export function sendBadRequest(res: Response, message = 'Datos inválidos') {
  return sendError(res, { error: message, message, statusCode: 400 });
}

export function sendUnauthorized(res: Response, message = 'No autorizado') {
  return sendError(res, { error: message, message, statusCode: 401 });
}

export function sendNotFound(res: Response, message = 'Recurso no encontrado') {
  return sendError(res, { error: message, message, statusCode: 404 });
}
