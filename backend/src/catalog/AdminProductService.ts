import Watch from './Watch.js';
import { notFound, badRequest } from '../shared/utils/AppError.js';
import { uploadImage, deleteImage } from '../shared/utils/ImageService.js';

interface SearchProductsParams {
  search?: string;
  page: number;
  size: number;
}

export async function searchProducts(params: SearchProductsParams) {
  const { search, page, size } = params;

  const filter: any = {};

  if (search) {
    const regex = new RegExp(search, 'i');
    filter.$or = [
      { name: regex },
      { brand: regex },
      { mpn: regex },
      { sku: regex },
      { category: regex },
    ];
  }

  const skip = page * size;

  const [items, totalItems] = await Promise.all([
    Watch.find(filter).sort({ createdAt: -1 }).skip(skip).limit(size),
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

export async function updateStock(id: string, stock: number) {
  if (stock < 0) {
    throw badRequest('El stock no puede ser negativo');
  }

  const watch = await Watch.findById(id);
  if (!watch) {
    throw notFound('Producto no encontrado');
  }

  watch.stock = stock;
  watch.status = stock < 1 ? 'OUT_OF_STOCK' : 'IN_STOCK';
  await watch.save();

  return watch;
}

export async function createProduct(data: any) {
  const { name, price, category, description, stock, image, ...rest } = data;

  if (!name || !price || !category) {
    throw badRequest('Faltan campos requeridos: name, price, category');
  }

  const watch = await Watch.create({
    name,
    brand: data.brand || 'Castellan',
    price,
    oldPrice: data.oldPrice || null,
    discount: data.discount || 0,
    currency: data.currency || 'EUR',
    category,
    strapColor: data.strapColor || '',
    strapMaterial: data.strapMaterial || '',
    dialColor: data.dialColor || '',
    caseMaterial: data.caseMaterial || '',
    movement: data.movement || '',
    description: description || '',
    stock: stock || 0,
    mpn: data.mpn || `MPN-${Date.now()}`,
    sku: data.sku || `SKU-${Date.now()}`,
    status: (stock || 0) > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
    tag: data.tag || null,
    image: image || '',
    gallery: data.gallery || [],
  });

  // Si hay imagen, subir a MinIO (guarda solo el filename)
  if (image && !image.startsWith('http')) {
    try {
      const key = await uploadImage(watch._id.toString(), image);
      watch.image = key;
    } catch (e) {
      console.log('No se pudo subir imagen a MinIO');
    }
  }

  // Subir imágenes de galería a MinIO
  if (watch.gallery && watch.gallery.length > 0) {
    for (let gIdx = 0; gIdx < watch.gallery.length; gIdx++) {
      const gFile = watch.gallery[gIdx];
      if (gFile && !gFile.startsWith('http')) {
        try {
          const gKey = await uploadImage(`${watch._id.toString()}_gallery_${gIdx}`, gFile);
          watch.gallery[gIdx] = gKey;
        } catch (e) {
          console.log(`No se pudo subir imagen de galería ${gIdx} a MinIO`);
        }
      }
    }
  }

  await watch.save();
  return watch;
}

export async function getProduct(id: string) {
  const watch = await Watch.findById(id);
  if (!watch) throw notFound('Producto no encontrado');
  return watch;
}

export async function updateProduct(id: string, data: any) {
  const watch = await Watch.findById(id);
  if (!watch) throw notFound('Producto no encontrado');

  // Si la imagen cambió y es local, subir a MinIO (guarda solo el filename)
  if (data.image && data.image !== watch.image && !data.image.startsWith('http')) {
    try {
      const key = await uploadImage(id, data.image);
      data.image = key;
    } catch (e) {
      console.log('No se pudo subir imagen a MinIO');
    }
  }

  // Subir imágenes de galería nuevas a MinIO
  if (data.gallery && Array.isArray(data.gallery)) {
    for (let gIdx = 0; gIdx < data.gallery.length; gIdx++) {
      const gFile = data.gallery[gIdx];
      if (gFile && !gFile.startsWith('http')) {
        try {
          const gKey = await uploadImage(`${id}_gallery_${gIdx}`, gFile);
          data.gallery[gIdx] = gKey;
        } catch (e) {
          console.log(`No se pudo subir imagen de galería ${gIdx} a MinIO`);
        }
      }
    }
  }

  // Actualizar status según stock
  if (data.stock !== undefined) {
    data.status = data.stock > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK';
  }

  Object.assign(watch, data);
  await watch.save();
  return watch;
}


export async function deleteProduct(id: string) {
  const watch = await Watch.findById(id);
  if (!watch) throw notFound('Producto no encontrado');

  // Eliminar imagen de MinIO
  if (watch.image) {
    await deleteImage(watch.image);
  }

  await Watch.findByIdAndDelete(id);
  return { message: 'Producto eliminado' };
}
