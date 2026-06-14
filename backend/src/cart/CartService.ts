import Cart from './Cart.js';
import Watch from '../catalog/Watch.js';
import { notFound, badRequest } from '../shared/utils/AppError.js';

export async function getCart(userId: string) {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({ userId, items: [] });
  }
  return cart;
}

export async function addItem(userId: string, watchId: string, quantity: number = 1) {
  const watch = await Watch.findById(watchId);
  if (!watch) throw notFound('Reloj no encontrado');

  if (watch.stock < quantity) {
    throw badRequest(`Stock insuficiente. Disponible: ${watch.stock}`);
  }

  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({ userId, items: [] });
  }

  const existingItem = cart.items.find(
    (item) => item.watchId.toString() === watchId
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.items.push({
      watchId: watch._id,
      name: watch.name,
      price: watch.price,
      quantity,
      image: watch.image || (watch.gallery && watch.gallery[0]) || '',
    });
  }

  await cart.save();
  return cart;
}

export async function updateItemQuantity(userId: string, watchId: string, quantity: number) {
  if (quantity < 1) {
    return removeItem(userId, watchId);
  }

  const cart = await Cart.findOne({ userId });
  if (!cart) throw notFound('Carrito no encontrado');

  const item = cart.items.find((i) => i.watchId.toString() === watchId);
  if (!item) throw notFound('Producto no encontrado en el carrito');

  item.quantity = quantity;
  await cart.save();
  return cart;
}

export async function removeItem(userId: string, watchId: string) {
  const cart = await Cart.findOne({ userId });
  if (!cart) throw notFound('Carrito no encontrado');

  cart.items = cart.items.filter((i) => i.watchId.toString() !== watchId);
  await cart.save();
  return cart;
}

export async function clearCart(userId: string) {
  const cart = await Cart.findOne({ userId });
  if (!cart) throw notFound('Carrito no encontrado');

  cart.items = [];
  await cart.save();
  return cart;
}

export async function syncCart(userId: string, items: Array<{ watchId: string; quantity: number }>) {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({ userId, items: [] });
  }

  for (const incoming of items) {
    const watch = await Watch.findById(incoming.watchId);
    if (!watch) continue;

    const existing = cart.items.find(
      (item) => item.watchId.toString() === incoming.watchId
    );

    if (existing) {
      // Si ya existe, tomar la mayor cantidad
      existing.quantity = Math.max(existing.quantity, incoming.quantity);
    } else {
      cart.items.push({
        watchId: watch._id,
        name: watch.name,
        price: watch.price,
        quantity: incoming.quantity,
        image: watch.image || (watch.gallery && watch.gallery[0]) || '',
      });
    }
  }

  await cart.save();
  return cart;
}
