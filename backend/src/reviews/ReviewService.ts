import Review from './Review.js';
import Order from '../orders/Order.js';
import { notFound, badRequest } from '../shared/utils/AppError.js';

interface CreateReviewParams {
  watchId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
}

export async function getByWatch(watchId: string, page: number = 0, size: number = 10) {
  const skip = page * size;

  const [items, totalItems] = await Promise.all([
    Review.find({ watchId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(size)
      .populate('userId', 'name'),
    Review.countDocuments({ watchId }),
  ]);

  // Calcular promedio
  const stats = await Review.aggregate([
    { $match: { watchId: watchId as any } },
    { $group: { _id: null, averageRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } },
  ]);

  const averageRating = stats.length > 0 ? Math.round(stats[0].averageRating * 10) / 10 : 0;
  const totalReviews = stats.length > 0 ? stats[0].totalReviews : 0;

  return {
    data: items,
    page,
    size,
    totalItems,
    totalPages: Math.ceil(totalItems / size),
    averageRating,
    totalReviews,
  };
}

export async function create(params: CreateReviewParams) {
  const { watchId, userId, userName, rating, title, comment } = params;

  // Validar que el usuario haya comprado este producto (pedido entregado)
  const hasPurchased = await Order.findOne({
    userId,
    'items.watchId': watchId,
    status: 'delivered',
  });

  const verified = !!hasPurchased;

  const review = await Review.create({
    watchId,
    userId,
    userName,
    rating,
    title,
    comment,
    verified,
  });

  return review;
}

export async function update(id: string, userId: string, params: Partial<CreateReviewParams>) {
  const review = await Review.findOne({ _id: id, userId });
  if (!review) throw notFound('Review no encontrada');

  if (params.rating !== undefined) review.rating = params.rating;
  if (params.title !== undefined) review.title = params.title;
  if (params.comment !== undefined) review.comment = params.comment;

  await review.save();
  return review;
}

export async function remove(id: string, userId: string) {
  const review = await Review.findOneAndDelete({ _id: id, userId });
  if (!review) throw notFound('Review no encontrada');
  return review;
}

export async function getByUser(userId: string) {
  return Review.find({ userId }).sort({ createdAt: -1 }).populate('watchId', 'name image');
}
