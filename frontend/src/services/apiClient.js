/**
 * Cliente HTTP normalizado para consumir la API.
 * Todas las respuestas del backend siguen la estructura:
 * { success: boolean, data: any, message: string, statusCode: number }
 *
 * Este helper desempaqueta automáticamente la respuesta y lanza
 * errores cuando success es false.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:9100/api/v1';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  // Si hay token en localStorage, lo añade automáticamente
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  const res = await fetch(url, config);
  const json = await res.json();

  // Si la respuesta está normalizada (success, data, message)
  if (json.success !== undefined) {
    if (!json.success) {
      // Si el usuario no existe, limpiar sesión (token inválido/usuario eliminado)
      if (json.message === 'Usuario no encontrado') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('user-updated'));
      }
      const error = new Error(json.message || 'Error en la solicitud');
      error.statusCode = json.statusCode || 500;
      error.data = json;
      throw error;
    }
    return json.data !== undefined ? json.data : json;
  }

  // Si la respuesta NO está normalizada (ej: respuestas viejas)
  if (!res.ok) {
    const error = new Error(json.message || 'Error en la solicitud');
    error.statusCode = res.status;
    error.data = json;
    throw error;
  }

  return json;
}

// Métodos HTTP helpers
export function get(endpoint) {
  return request(endpoint, { method: 'GET' });
}

export function post(endpoint, body) {
  return request(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function put(endpoint, body) {
  return request(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export function patch(endpoint, body) {
  return request(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function del(endpoint) {
  return request(endpoint, { method: 'DELETE' });
}

/**
 * Construye la URL completa para una imagen.
 * - Si es URL completa (http...), la devuelve tal cual.
 * - Si es solo un filename (key de MinIO), construye la ruta del proxy.
 * - NO se soportan rutas locales /images/ — todo debe servirse desde MinIO.
 */
export function getImageUrl(image) {
  if (!image) return '';
  if (image.startsWith('http')) return image;
  return `${API_BASE}/images/${image}`;
}

export default { get, post, put, patch, del };
