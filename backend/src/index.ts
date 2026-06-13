import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import Watch from './catalog/Watch.js';
import Order from './orders/Order.js';
import Coupon from './coupons/Coupon.js';
import User from './auth/User.js';
import authRoutes from './auth/auth.routes.js';
import watchRoutes from './catalog/watch.routes.js';
import cartRoutes from './cart/cart.routes.js';
import orderRoutes from './orders/order.routes.js';
import couponRoutes from './coupons/coupon.routes.js';
import contactRoutes from './contact/contact.routes.js';
import invoiceRoutes from './invoicing/invoice.routes.js';
import adminRoutes from './admin/admin.routes.js';
import imageRoutes from './images/images.routes.js';
import addressRoutes from './address/address.routes.js';
import reviewRoutes from './reviews/review.routes.js';
import wishlistRoutes from './wishlist/wishlist.routes.js';
import paymentRoutes from './payments/payment.routes.js';

import { eventBus } from './shared/events/EventBus.js';
import { USER_REGISTERED_EVENT } from './shared/events/UserRegisteredEvent.js';
import { handleUserRegistered } from './loyalty/LoyaltyListener.js';
import { ORDER_CONFIRMED_EVENT } from './shared/events/OrderConfirmedEvent.js';
import { handleOrderConfirmed } from './invoicing/InvoiceListener.js';
import { startBirthdayCouponJob } from './loyalty/birthdayCouponJob.js';
import { registerNotificationListeners } from './notifications/NotificationListener.js';
import { globalHandlerException } from './shared/utils/GlobalHandlerException.js';
import { ensureBucket, uploadImage } from './shared/utils/ImageService.js';
import { authLimiter, apiLimiter } from './shared/middleware/rateLimiter.js';
import bcrypt from 'bcryptjs';
import Wishlist from './wishlist/Wishlist.js';
import Review from './reviews/Review.js';
import Cart from './cart/Cart.js';
import Address from './address/Address.js';
import ActivityLog from './activityLog/ActivityLog.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware globales
const CORS_ORIGINS = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:9099', 'http://localhost:5173'];
app.use(cors({
  origin: CORS_ORIGINS,
  credentials: true,
}));
app.use(express.json());

// ============================================
// STRIPE WEBHOOK — Debe ir ANTES de express.json()
// para recibir el body raw (firma requerida)
// ============================================
app.use('/api/v1/payments/webhook', express.raw({ type: 'application/json' }));

// ============================================
// RATE LIMITING
// ============================================
if (process.env.NODE_ENV === 'production') {
  app.use('/api/v1/auth', authLimiter);
  app.use('/api/v1/contacts', authLimiter);
}

// ============================================
// RUTAS API
// ============================================
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/watches', watchRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/coupons', couponRoutes);
app.use('/api/v1/contacts', contactRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/images', imageRoutes);
app.use('/api/v1/addresses', addressRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);
app.use('/api/v1/payments', paymentRoutes);

// Health check

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// MIDDLEWARE GLOBAL DE ERRORES (último)
// ============================================
app.use(globalHandlerException);

// ============================================
// AUTO-SEED
// ============================================
async function autoSeed(): Promise<void> {
  // Asegurar que el bucket de MinIO existe
  await ensureBucket();

  // Seed de relojes
  const watchCount = await Watch.countDocuments();
  if (watchCount > 0) {
    console.log(`${watchCount} relojes ya en la BD`);

    // Verificar si las imágenes están subidas a MinIO (re-seed de imágenes si faltan)
    const watches = await Watch.find({});
    let needsImageSeed = false;
    for (const w of watches) {
      if (!w.image || w.image.startsWith('/') || w.image.startsWith('http')) {
        needsImageSeed = true;
        break;
      }
    }

    if (needsImageSeed) {
      console.log('Algunos relojes no tienen imágenes en MinIO. Repoblando imágenes...');
      // Buscar db.json en múltiples rutas (local y Docker)
      const possibleDbPaths = [
        join(__dirname, '..', '..', 'public', 'db.json'),
        join('/public', 'db.json'),
        join('/app', 'public', 'db.json'),
        join(process.cwd(), 'public', 'db.json'),
      ];
      let dbPath = '';
      for (const p of possibleDbPaths) {
        try {
          readFileSync(p, 'utf8');
          dbPath = p;
          break;
        } catch { continue; }
      }
      if (!dbPath) {
        console.error('No se encontró db.json en ninguna ruta');
        return;
      }
      const data = JSON.parse(readFileSync(dbPath, 'utf8'));

      for (let i = 0; i < watches.length; i++) {
        const watch = watches[i];
        const originalWatch = data.watches[i];
        if (!originalWatch) continue;

        // Subir imagen principal
        const imageFile = originalWatch.image || '';
        if (imageFile && (!watch.image || watch.image.startsWith('/') || watch.image.startsWith('http'))) {
          const key = await uploadImage(watch._id.toString(), imageFile);
          await Watch.findByIdAndUpdate(watch._id, { image: key });
        }

        // Subir imágenes de galería
        const gallery = originalWatch.gallery || [];
        for (let gIdx = 0; gIdx < gallery.length; gIdx++) {
          const galleryFile = gallery[gIdx];
          if (galleryFile) {
            const galleryKey = await uploadImage(`${watch._id.toString()}_gallery_${gIdx}`, galleryFile);
            if (!watch.gallery) watch.gallery = [];
            watch.gallery[gIdx] = galleryKey;
          }
        }
        await Watch.findByIdAndUpdate(watch._id, { gallery: watch.gallery });
      }
      console.log('Imágenes y galerías repobladas en MinIO');
    }
  } else {
    console.log('BD vacia - ejecutando seed automatico...');

    // Buscar db.json en múltiples rutas (local y Docker)
    const possibleDbPaths = [
      join(__dirname, '..', '..', 'public', 'db.json'),
      join('/public', 'db.json'),
      join('/app', 'public', 'db.json'),
      join(process.cwd(), 'public', 'db.json'),
    ];
    let dbPath = '';
    for (const p of possibleDbPaths) {
      try {
        readFileSync(p, 'utf8');
        dbPath = p;
        break;
      } catch { continue; }
    }
    if (!dbPath) {
      console.error('No se encontró db.json en ninguna ruta');
      return;
    }
    const data = JSON.parse(readFileSync(dbPath, 'utf8'));

    // Añadir MPN y SKU a cada reloj
    const watchesWithMeta = data.watches.map((watch: any, index: number) => ({
      ...watch,
      mpn: `MPN-${String(index + 1).padStart(4, '0')}`,
      sku: `SKU-${String(index + 1).padStart(4, '0')}`,
      status: watch.stock > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
    }));

    const inserted = await Watch.insertMany(watchesWithMeta);
    console.log(`${inserted.length} relojes insertados desde db.json`);

    // Subir imágenes a MinIO (guarda solo el filename, ej: "abc123.webp")
    for (let i = 0; i < inserted.length; i++) {
      const watch = inserted[i];
      const originalWatch = watchesWithMeta[i];
      const imageFile = originalWatch.image || '';
      if (imageFile) {
        const key = await uploadImage(watch._id.toString(), imageFile);
        await Watch.findByIdAndUpdate(watch._id, { image: key });
      }

      // Subir imágenes de galería a MinIO con keys: "{watchId}_gallery_0.webp"
      const gallery = originalWatch.gallery || [];
      for (let gIdx = 0; gIdx < gallery.length; gIdx++) {
        const galleryFile = gallery[gIdx];
        if (galleryFile) {
          const galleryKey = await uploadImage(`${watch._id.toString()}_gallery_${gIdx}`, galleryFile);
          // Almacenar solo el key de MinIO en el array gallery
          if (!watch.gallery) watch.gallery = [];
          watch.gallery[gIdx] = galleryKey;
        }
      }
      await Watch.findByIdAndUpdate(watch._id, { gallery: watch.gallery });
    }
    console.log('Imágenes y galerías subidas a MinIO');
  }

  // Seed de cupones
  const couponCount = await Coupon.countDocuments();
  if (couponCount === 0) {
    await Coupon.insertMany([
      { code: 'DESC10', type: 'percentage', discount: 10, minAmount: 0, active: true },
      { code: 'DESC25', type: 'percentage', discount: 25, minAmount: 200, active: true },
    ]);
    console.log('Cupones DESC10 y DESC25 insertados');
  }

  // Seed de usuario manager por defecto
  const managerEmail = 'admin@castellan.com';
  const existingManager = await User.findOne({ email: managerEmail });
  if (!existingManager) {
    const passwordHash = await bcrypt.hash('Admin123!', 12);
    await User.create({
      email: managerEmail,
      name: 'Admin Castellan',
      passwordHash,
      provider: 'LOCAL',
      role: 'ROLE_MANAGER',
      birthDate: null,
    });
    console.log('Usuario manager creado: admin@castellan.com / Admin123!');
  } else {
    console.log('Usuario manager ya existe');
  }

  // Seed de 25 pedidos simulados (solo si no hay pedidos)
  const orderCount = await Order.countDocuments();
  if (orderCount === 0) {
    console.log('Generando 25 pedidos simulados...');
    const watches = await Watch.find({ stock: { $gt: 0 } }).lean();
    if (watches.length > 0) {
      const NAMES = ['Carlos López', 'María García', 'Juan Martínez', 'Ana Rodríguez', 'Pedro Sánchez', 'Laura Fernández', 'Miguel Ángel', 'Sofia Pérez', 'David Gómez', 'Elena Ruiz'];
      const CITIES = ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao', 'Málaga', 'Zaragoza', 'Murcia', 'Palma', 'Granada'];
      const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered'];

      function randomItem(arr: any[]) { return arr[Math.floor(Math.random() * arr.length)]; }
      function randomBetween(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
      function randomDate(daysAgo: number) {
        const d = new Date();
        d.setDate(d.getDate() - randomBetween(0, daysAgo));
        d.setHours(randomBetween(9, 20), randomBetween(0, 59), 0, 0);
        return d;
      }

      const orders = [];
      for (let i = 0; i < 25; i++) {
        const numItems = randomBetween(1, 3);
        const items = [];
        let subtotal = 0;

        for (let j = 0; j < numItems; j++) {
          const watch = randomItem(watches);
          const qty = randomBetween(1, 2);
          const price = watch.price;
          items.push({
            watchId: watch._id,
            name: watch.name,
            price,
            quantity: qty,
            image: watch.image || '',
          });
          subtotal += price * qty;
        }

        const shipping = 4.99;
        const total = Math.round((subtotal + shipping) * 100) / 100;
        const person = randomItem(NAMES);
        const city = randomItem(CITIES);
        const status = randomItem(STATUSES);
        const createdAt = randomDate(30);

        orders.push({
          orderNumber: `CAST-${String(i + 1).padStart(6, '0').slice(0, 8)}`,
          items,
          subtotal: Math.round(subtotal * 100) / 100,
          discount: 0,
          shipping,
          total,
          shippingInfo: {
            name: person,
            email: `${person.toLowerCase().replace(' ', '.')}@email.com`,
            phone: `+34${randomBetween(600000000, 699999999)}`,
            address: `Calle ${randomItem(['Mayor', 'Real', 'Gran Vía', 'Serrano', 'Alcalá'])} ${randomBetween(1, 100)}`,
            city,
            state: city === 'Madrid' || city === 'Barcelona' ? city : randomItem(['Madrid', 'Barcelona', 'Andalucía', 'Valencia', 'País Vasco']),
            zip: String(randomBetween(28001, 28999)),
            country: 'España',
          },
          paymentInfo: {
            cardNumber: '****-****-****-' + String(randomBetween(1000, 9999)),
            cardName: person,
          },
          status,
          createdAt,
          updatedAt: createdAt,
        });
      }

      await Order.insertMany(orders);

      // Actualizar stock de los productos afectados
      for (const order of orders) {
        for (const item of order.items) {
          await Watch.findByIdAndUpdate(item.watchId, {
            $inc: { stock: -item.quantity },
          });
        }
      }
      console.log('25 pedidos simulados creados correctamente');
    }
  } else {
    console.log(`${orderCount} pedidos ya existen en la BD`);
  }

  // ============================================
  // SEED DE USUARIOS SIMULADOS
  // ============================================
  const simulatedUsersCount = await User.countDocuments({ role: 'ROLE_USER' });
  if (simulatedUsersCount === 0) {
    console.log('Creando 10 usuarios simulados...');

    const SIMULATED_USERS = [
      { name: 'Carlos López', email: 'carlos.lopez@email.com', birthDate: new Date('1985-03-15') },
      { name: 'María García', email: 'maria.garcia@email.com', birthDate: new Date('1990-07-22') },
      { name: 'Juan Martínez', email: 'juan.martinez@email.com', birthDate: new Date('1988-11-08') },
      { name: 'Ana Rodríguez', email: 'ana.rodriguez@email.com', birthDate: new Date('1995-01-30') },
      { name: 'Pedro Sánchez', email: 'pedro.sanchez@email.com', birthDate: new Date('1982-09-12') },
      { name: 'Laura Fernández', email: 'laura.fernandez@email.com', birthDate: new Date('1993-05-18') },
      { name: 'Miguel Ángel', email: 'miguel.angel@email.com', birthDate: new Date('1987-12-25') },
      { name: 'Sofía Pérez', email: 'sofia.perez@email.com', birthDate: new Date('1998-04-03') },
      { name: 'David Gómez', email: 'david.gomez@email.com', birthDate: new Date('1991-08-14') },
      { name: 'Elena Ruiz', email: 'elena.ruiz@email.com', birthDate: new Date('1986-06-28') },
    ];

    const passwordHash = await bcrypt.hash('User1234!', 12);
    const createdUsers = await User.insertMany(
      SIMULATED_USERS.map(u => ({
        ...u,
        passwordHash,
        provider: 'LOCAL' as const,
        role: 'ROLE_USER' as const,
        blocked: false,
      }))
    );
    console.log(`${createdUsers.length} usuarios simulados creados (password: User1234!)`);

    // ============================================
    // SEED DE WISHLISTS
    // ============================================
    console.log('Creando wishlists para usuarios simulados...');
    const watches = await Watch.find({}).lean();
    let wishlistCount = 0;
    for (const user of createdUsers) {
      // Cada usuario tiene entre 2 y 5 relojes en wishlist
      const numItems = Math.floor(Math.random() * 4) + 2;
      const shuffled = [...watches].sort(() => Math.random() - 0.5).slice(0, numItems);
      await Wishlist.create({
        userId: user._id,
        items: shuffled.map(w => ({
          watchId: w._id,
          addedAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)),
        })),
      });
      wishlistCount++;
    }
    console.log(`${wishlistCount} wishlists creadas`);

    // ============================================
    // SEED DE REVIEWS
    // ============================================
    console.log('Creando reseñas de productos...');
    const REVIEW_TITLES = [
      'Excelente reloj', 'Muy buena calidad', 'Buena relación calidad-precio',
      'Me encanta', 'Recomendado', 'Elegante y funcional', 'Perfecto para diario',
      'Gran compra', 'Cumple expectativas', 'Diseño espectacular',
    ];
    const REVIEW_COMMENTS = [
      'Lo compré para mi colección y estoy muy satisfecho. El acabado es impecable.',
      'La correa es cómoda y la esfera se ve muy bien. Llegó antes de lo esperado.',
      'Por el precio, es una opción fantástica. Funciona perfectamente.',
      'El diseño es moderno y elegante. Recibí muchos cumplidos.',
      'Tiene un mecanismo preciso y la construcción se siente sólida.',
      'La resistencia al agua es buena, lo he usado en la piscina sin problemas.',
      'Viene en una caja muy bonita, ideal para regalo.',
      'La visibilidad nocturna es excelente, se lee perfectamente en la oscuridad.',
      'El movimiento automático es suave y silencioso. Muy contento con la compra.',
      'Tiene un peso ideal, ni muy pesado ni muy ligero. Muy cómodo.',
    ];
    let reviewCount = 0;
    for (const user of createdUsers) {
      // Cada usuario deja entre 1 y 4 reseñas
      const numReviews = Math.floor(Math.random() * 4) + 1;
      const shuffledWatches = [...watches].sort(() => Math.random() - 0.5).slice(0, numReviews);
      for (const watch of shuffledWatches) {
        const idx = Math.floor(Math.random() * REVIEW_TITLES.length);
        await Review.create({
          watchId: watch._id,
          userId: user._id,
          userName: user.name,
          rating: Math.floor(Math.random() * 3) + 3, // 3-5 estrellas
          title: REVIEW_TITLES[idx],
          comment: REVIEW_COMMENTS[idx],
          verified: Math.random() > 0.3, // 70% verificadas
        });
        reviewCount++;
      }
    }
    console.log(`${reviewCount} reseñas creadas`);

    // ============================================
    // SEED DE CARRITOS
    // ============================================
    console.log('Creando carritos para usuarios simulados...');
    let cartCount = 0;
    for (const user of createdUsers) {
      // 50% de los usuarios tienen items en el carrito
      if (Math.random() > 0.5) {
        const numItems = Math.floor(Math.random() * 3) + 1;
        const shuffledWatches = [...watches].sort(() => Math.random() - 0.5).slice(0, numItems);
        await Cart.create({
          userId: user._id,
          items: shuffledWatches.map(w => ({
            watchId: w._id,
            name: w.name,
            price: w.price,
            quantity: Math.floor(Math.random() * 2) + 1,
            image: w.image || '',
          })),
        });
        cartCount++;
      }
    }
    console.log(`${cartCount} carritos con items creados`);

    // ============================================
    // SEED DE DIRECCIONES
    // ============================================
    console.log('Creando direcciones para usuarios simulados...');
    const STREETS = ['Mayor', 'Real', 'Gran Vía', 'Serrano', 'Alcalá', 'Diagonal', 'Velázquez', 'Goya', 'Castellana', 'Princesa'];
    const CITIES = ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao', 'Málaga', 'Zaragoza', 'Murcia', 'Palma', 'Granada'];
    let addressCount = 0;
    for (const user of createdUsers) {
      // Cada usuario tiene 1-2 direcciones
      const numAddresses = Math.floor(Math.random() * 2) + 1;
      for (let a = 0; a < numAddresses; a++) {
        const city = CITIES[Math.floor(Math.random() * CITIES.length)];
        await Address.create({
          userId: user._id,
          name: `${user.name}${a === 0 ? '' : ' (Trabajo)'}`,
          address: `Calle ${STREETS[Math.floor(Math.random() * STREETS.length)]} ${Math.floor(Math.random() * 100) + 1}`,
          city,
          state: city === 'Madrid' || city === 'Barcelona' ? city : 'Madrid',
          zip: String(Math.floor(Math.random() * 1000) + 28000),
          country: 'España',
          phone: `+34${Math.floor(Math.random() * 100000000) + 600000000}`,
          isDefault: a === 0,
        });
        addressCount++;
      }
    }
    console.log(`${addressCount} direcciones creadas`);

    // ============================================
    // ASOCIAR PEDIDOS EXISTENTES A USUARIOS
    // ============================================
    console.log('Asociando pedidos a usuarios simulados...');
    const ordersWithoutUser = await Order.find({ userId: { $exists: false } });
    let assignedOrders = 0;
    for (const order of ordersWithoutUser) {
      // Buscar un usuario cuyo nombre coincida con el shippingInfo.name
      const matchingUser = createdUsers.find(u =>
        u.name.toLowerCase() === order.shippingInfo.name.toLowerCase()
      );
      if (matchingUser) {
        await Order.findByIdAndUpdate(order._id, {
          userId: matchingUser._id,
          statusHistory: [
            { status: 'pending', changedBy: 'system', changedAt: order.createdAt },
            { status: order.status, changedBy: 'system', changedAt: order.createdAt },
          ],
        });
        assignedOrders++;
      }
    }
    console.log(`${assignedOrders} pedidos asociados a usuarios`);

  } else {
    console.log(`${simulatedUsersCount} usuarios simulados ya existen`);
  }

  // ============================================
  // SEED DE LOGS DE ACTIVIDAD (siempre se ejecuta si no hay logs)
  // ============================================
  const activityLogCount = await ActivityLog.countDocuments();
  if (activityLogCount === 0) {
    console.log('Creando logs de actividad simulados...');
    const adminUser = await User.findOne({ email: managerEmail });
    const adminId = adminUser?._id?.toString() || 'system';

    // Acciones con previousState simulado (revertibles)
    const REVERTIBLE_ACTIONS = [
      { action: 'UPDATE_STATUS', entity: 'ORDER', details: 'Estado del pedido actualizado', previousState: { oldStatus: 'pending' } },
      { action: 'UPDATE_PRODUCT', entity: 'PRODUCT', details: 'Producto actualizado', previousState: { name: 'Producto anterior', price: 99.99, stock: 5 } },
      { action: 'UPDATE_STOCK', entity: 'PRODUCT', details: 'Stock de producto actualizado', previousState: { oldStock: 10 } },
      { action: 'UPDATE_COUPON', entity: 'COUPON', details: 'Cupón de descuento actualizado', previousState: { discount: 15, active: true } },
      { action: 'DELETE_COUPON', entity: 'COUPON', details: 'Cupón de descuento eliminado', previousState: { code: 'DESC10', discount: 10, type: 'percentage', active: true } },
      { action: 'UPDATE_USER_ROLE', entity: 'USER', details: 'Rol de usuario modificado', previousState: { oldRole: 'ROLE_USER' } },
      { action: 'BLOCK_USER', entity: 'USER', details: 'Usuario bloqueado', previousState: { wasBlocked: false } },
      { action: 'UNBLOCK_USER', entity: 'USER', details: 'Usuario desbloqueado', previousState: { wasBlocked: true } },
    ];

    const activityLogs = [];
    for (let i = 0; i < 50; i++) {
      const action = REVERTIBLE_ACTIONS[Math.floor(Math.random() * REVERTIBLE_ACTIONS.length)];
      const daysAgo = Math.floor(Math.random() * 30);
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      createdAt.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60), 0, 0);

      const logEntry: any = {
        action: action.action,
        entity: action.entity,
        entityId: Math.random() > 0.3 ? String(Math.floor(Math.random() * 1000)) : undefined,
        userId: adminId,
        userName: 'Admin Castellan',
        details: action.details,
        createdAt,
      };

      if ((action as any).previousState) {
        logEntry.previousState = (action as any).previousState;
      }

      activityLogs.push(logEntry);
    }
    await ActivityLog.insertMany(activityLogs);
    console.log(`${activityLogs.length} logs de actividad creados (${activityLogs.filter((l: any) => l.previousState).length} revertibles)`);
  } else {
    console.log(`${activityLogCount} logs de actividad ya existen`);
  }
}

// ============================================
// LISTENERS DE EVENTOS
// ============================================
eventBus.on(USER_REGISTERED_EVENT, handleUserRegistered);
eventBus.on(ORDER_CONFIRMED_EVENT, handleOrderConfirmed);

// Registrar listeners de notificaciones
registerNotificationListeners();

// ============================================
// INICIAR SERVIDOR
// ============================================
async function start(): Promise<void> {
  await connectDB();
  await autoSeed();
  startBirthdayCouponJob();

  app.listen(PORT, () => {
    console.log(`\n Castellan Store API corriendo en http://localhost:${PORT}`);
    console.log(`\n Endpoints:`);
    console.log(`   Auth:     POST /api/v1/auth/register | /login | /google`);
    console.log(`   Auth:     PUT  /api/v1/auth/profile (protegido)`);
    console.log(`   Tienda:   GET  /api/v1/watches?search=&category=&page=&size=`);
    console.log(`   Tienda:   GET  /api/v1/watches/featured`);
    console.log(`   Tienda:   GET  /api/v1/watches/:id`);
    console.log(`   Tienda:   POST /api/v1/orders`);
    console.log(`   Tienda:   POST /api/v1/coupons/validate`);
    console.log(`   Tienda:   POST /api/v1/contacts`);
    console.log(`   Admin:    GET  /api/v1/admin/dashboard`);
    console.log(`   Admin:    GET  /api/v1/admin/products?search=&page=&size=`);
    console.log(`   Admin:    PATCH /api/v1/admin/products/:id/stock`);
    console.log(`   Admin:    GET  /api/v1/admin/orders?status=&page=&size=`);
    console.log(`   Admin:    PATCH /api/v1/admin/orders/:id/status`);
    console.log(`   Admin:    GET  /api/v1/admin/coupons?search=&page=&size=`);
    console.log(`   Admin:    POST /api/v1/admin/coupons`);
    console.log(`   Admin:    PATCH /api/v1/admin/coupons/:id`);
    console.log(`   Admin:    DELETE /api/v1/admin/coupons/:id`);
    console.log(`   Admin:    GET  /api/v1/admin/users?search=&page=&size=`);
    console.log(`   Admin:    PATCH /api/v1/admin/users/:id/role`);
    console.log(`   Admin:    PATCH /api/v1/admin/users/:id/block`);
    console.log(`   Admin:    GET  /api/v1/admin/activity-logs?page=&size=`);
    console.log(`   Health:   GET  /api/health\n`);
  });
}

start();
