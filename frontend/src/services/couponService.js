import { validateCoupon as apiValidateCoupon } from './api';
import { formatPrice } from '../utils/formatPrice';

export async function applyCoupon(code, subtotal, items = []) {
  try {
    // Mapear items del carrito al formato que espera el backend
    const cartItems = items.map(item => ({
      watchId: item.id || item.watchId,
      price: item.price,
      quantity: item.quantity,
    }));

    const result = await apiValidateCoupon(code, subtotal, cartItems);

    if (!result.valid) {
      return { valid: false, discount: 0, message: result.message };
    }

    return {
      valid: true,
      discount: result.discount,
      code: result.code,
      message: `¡Cupón aplicado! Descuento: ${formatPrice(result.discount)}`,
    };
  } catch {
    return { valid: false, discount: 0, message: 'Error al validar el cupón' };
  }
}
