import LoyaltyProfile from './LoyaltyProfile.js';
import UserCoupon from './UserCoupon.js';
import { UserRegisteredPayload } from '../shared/events/UserRegisteredEvent.js';
import { notifyUserRegistered } from '../notifications/NotificationService.js';

export async function handleUserRegistered(payload: UserRegisteredPayload): Promise<void> {
  // 1. Crear perfil de fidelización
  await LoyaltyProfile.create({
    userId: payload.userId,
    points: 0,
  });
  console.log(`[Loyalty] Perfil creado para usuario ${payload.email}`);

  // 2. Generar cupón de bienvenida (válido 30 días)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await UserCoupon.create({
    userId: payload.userId,
    code: 'BIENVENIDA10',
    discountPercent: 10,
    isUsed: false,
    expiresAt,
  });
  console.log(`[Loyalty] Cupón BIENVENIDA10 generado para ${payload.email}`);

  // 3. Enviar email de bienvenida con el cupón
  try {
    await notifyUserRegistered(payload.email, payload.name || 'Cliente', 'BIENVENIDA10');
    console.log(`[Loyalty] Email de bienvenida enviado a ${payload.email}`);
  } catch (err) {
    console.error(`[Loyalty] Error al enviar email de bienvenida a ${payload.email}:`, err);
  }
}
