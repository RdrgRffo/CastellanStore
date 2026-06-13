/**
 * Error personalizado de aplicación que incluye código HTTP.
 * Los servicios lanzan AppError, y el GlobalHandlerException lo captura
 * para devolver una respuesta normalizada.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Helpers para crear errores comunes
export function badRequest(message: string): AppError {
  return new AppError(message, 400);
}

export function unauthorized(message: string = 'No autorizado'): AppError {
  return new AppError(message, 401);
}

export function notFound(message: string = 'Recurso no encontrado'): AppError {
  return new AppError(message, 404);
}

export function conflict(message: string): AppError {
  return new AppError(message, 409);
}

export function internalError(message: string = 'Error interno del servidor'): AppError {
  return new AppError(message, 500, false);
}
