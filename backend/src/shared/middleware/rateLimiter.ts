import rateLimit from 'express-rate-limit';

/**
 * Rate limiter para rutas sensibles (login, registro, contacto).
 * Limita a 10 solicitudes por ventana de 15 minutos por IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiadas solicitudes. Inténtalo de nuevo en 15 minutos.',
    statusCode: 429,
  },
});

/**
 * Rate limiter general para rutas API.
 * Limita a 100 solicitudes por ventana de 15 minutos por IP.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiadas solicitudes. Inténtalo de nuevo más tarde.',
    statusCode: 429,
  },
});
