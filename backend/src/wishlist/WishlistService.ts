import Wishlist from './Wishlist.js';
import { notFound } from '../shared/utils/AppError.js';

export async function getWishlist(userId: string) {
  let wishlist = await Wishlist.findOne({ userId }).populate('items.watchId');
  if (!wishlist) {
    wishlist = await Wishlist.create({ userId, items: [] });
  }
  return wishlist;
}

export async function addToWishlist(userId: string, watchId: string) {
  let wishlist = await Wishlist.findOne({ userId });
  if (!wishlist) {
    wishlist = await Wishlist.create({ userId, items: [{ watchId: watchId as any, addedAt: new Date() }] });
    return wishlist;
  }

  // Verificar si ya existe
  const exists = wishlist.items.some(item => item.watchId.toString() === watchId);
  if (!exists) {
    wishlist.items.push({ watchId: watchId as any, addedAt: new Date() });
    await wishlist.save();
  }

  return wishlist.populate('items.watchId');
}

export async function removeFromWishlist(userId: string, watchId: string) {
  const wishlist = await Wishlist.findOne({ userId });
  if (!wishlist) throw notFound('Lista de deseos no encontrada');

  wishlist.items = wishlist.items.filter(item => item.watchId.toString() !== watchId);
  await wishlist.save();

  return wishlist.populate('items.watchId');
}

export async function isInWishlist(userId: string, watchId: string): Promise<boolean> {
  const wishlist = await Wishlist.findOne({ userId });
  if (!wishlist) return false;
  return wishlist.items.some(item => item.watchId.toString() === watchId);
}
