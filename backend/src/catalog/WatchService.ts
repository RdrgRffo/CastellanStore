import Watch from './Watch.js';
import { notFound } from '../shared/utils/AppError.js';

interface GetAllParams {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  tag?: string;
  sortBy?: string;
  page?: number;
  size?: number;
}

export async function getAll(params: GetAllParams = {}) {
  const {
    search,
    category,
    minPrice,
    maxPrice,
    tag,
    sortBy = 'newest',
    page = 0,
    size = 12,
  } = params;

  // Construir filtro dinámico
  const filter: any = {};

  if (category) {
    filter.category = category;
  }

  if (tag) {
    filter.tag = tag;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }

  if (search) {
    // Buscar por palabra completa o coincidencia parcial en nombre, marca, MPN y SKU
    // Usamos escape para caracteres especiales de regex
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    filter.$or = [
      { name: regex },
      { brand: regex },
      { mpn: regex },
      { sku: regex },
    ];
  }

  // Ordenación
  let sort: any = { createdAt: -1 };
  switch (sortBy) {
    case 'price-asc':
      sort = { price: 1 };
      break;
    case 'price-desc':
      sort = { price: -1 };
      break;
    case 'name':
      sort = { name: 1 };
      break;
    case 'newest':
    default:
      sort = { createdAt: -1 };
      break;
  }

  const skip = page * size;

  const [items, totalItems] = await Promise.all([
    Watch.find(filter).sort(sort).skip(skip).limit(size),
    Watch.countDocuments(filter),
  ]);

  return {
    data: items,
    page,
    size,
    totalItems,
    totalPages: Math.ceil(totalItems / size),
  };
}

export async function getById(id: string) {
  const watch = await Watch.findById(id);
  if (!watch) throw notFound('Reloj no encontrado');
  return watch;
}

export async function getFeatured() {
  return Watch.find({ tag: { $in: ['Bestseller', 'Premium', 'Limited'] } }).limit(8);
}

export async function getRelated(productId: string, limit: number = 4) {
  const watch = await Watch.findById(productId).select('category price');
  if (!watch) return [];

  // Buscar productos de la misma categoría, excluyendo el actual
  const related = await Watch.find({
    _id: { $ne: productId },
    category: watch.category,
    status: 'IN_STOCK',
  })
    .limit(limit)
    .sort({ createdAt: -1 });

  // Si no hay suficientes, completar con productos de precio similar
  if (related.length < limit) {
    const remaining = limit - related.length;
    const excludeIds = [productId, ...related.map(r => r._id.toString())];
    const priceRange = 0.3; // 30% arriba/abajo
    const extra = await Watch.find({
      _id: { $nin: excludeIds },
      status: 'IN_STOCK',
      price: {
        $gte: watch.price * (1 - priceRange),
        $lte: watch.price * (1 + priceRange),
      },
    })
      .limit(remaining)
      .sort({ createdAt: -1 });

    related.push(...extra);
  }

  return related;
}
