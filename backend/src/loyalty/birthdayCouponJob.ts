import cron from 'node-cron';
import User from '../auth/User.js';
import UserCoupon from './UserCoupon.js';

export function startBirthdayCouponJob(): void {
  // Ejecutar cada día a las 00:00
  cron.schedule('0 0 * * *', async () => {
    console.log('[Cron] Buscando cumpleaños del día...');

    const today = new Date();
    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();

    try {
      // Buscar usuarios cuyo mes y día de birthDate coincidan con hoy
      const users = await User.find({
        birthDate: { $ne: null },
        $expr: {
          $and: [
            { $eq: [{ $month: '$birthDate' }, todayMonth] },
            { $eq: [{ $dayOfMonth: '$birthDate' }, todayDay] },
          ],
        },
      });

      if (users.length === 0) {
        console.log('[Cron] No hay cumpleaños hoy.');
        return;
      }

      for (const user of users) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        const couponCode = `CUMPLE-${user._id.toString().slice(-6).toUpperCase()}`;

        await UserCoupon.create({
          userId: user._id,
          code: couponCode,
          discountPercent: 20,
          isUsed: false,
          expiresAt,
        });

        console.log(`[Cron] Cupón de cumpleaños ${couponCode} (20%) generado para ${user.email}`);
        console.log(`[Email] Enviando felicitación a ${user.email}`);
        console.log(`[Email] Asunto: ¡Feliz cumpleaños de parte de Castellan Store!`);
        console.log(`[Email] Cuerpo: Disfruta de un 20% de descuento con el código: ${couponCode}`);
      }
    } catch (error) {
      console.error('[Cron] Error procesando cumpleaños:', error);
    }
  });

  console.log('[Cron] Job de cumpleaños programado (00:00 cada día)');
}
