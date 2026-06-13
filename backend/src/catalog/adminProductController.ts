import { Response, NextFunction } from 'express';
import { AuthRequest } from '../shared/middleware/authMiddleware.js';
import * as AdminProductService from './AdminProductService.js';
import { sendSuccess, sendCreated } from '../shared/utils/ApiResponse.js';
import { upload, processAndUploadImage } from '../shared/middleware/uploadMiddleware.js';
import { logActivity } from '../activityLog/ActivityLogService.js';

export async function searchProducts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { search, page = '0', size = '20' } = req.query;
    const result = await AdminProductService.searchProducts({
      search: search as string | undefined,
      page: Number(page),
      size: Number(size),
    });
    sendSuccess(res, { data: result });
  } catch (err) {
    next(err);
  }
}

export async function getProduct(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const product = await AdminProductService.getProduct(id);
    sendSuccess(res, { data: product });
  } catch (err) {
    next(err);
  }
}

export async function createProduct(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const product = await AdminProductService.createProduct(req.body);

    await logActivity({
      action: 'PRODUCT_CREATE',
      entity: 'product',
      entityId: product._id.toString(),
      userId: req.userId,
      userName: req.userName,
      details: `Producto creado: ${product.name} (sku: ${product.sku})`,
    });

    sendCreated(res, { data: product, message: 'Producto creado correctamente' });
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;

    // Obtener estado anterior para el rollback
    const oldProduct = await AdminProductService.getProduct(id);
    const previousState = oldProduct ? {
      name: oldProduct.name,
      brand: oldProduct.brand,
      description: oldProduct.description,
      price: oldProduct.price,
      oldPrice: oldProduct.oldPrice,
      category: oldProduct.category,
      stock: oldProduct.stock,
      status: oldProduct.status,
      image: oldProduct.image,
      gallery: oldProduct.gallery,
      mpn: oldProduct.mpn,
      sku: oldProduct.sku,
      tag: oldProduct.tag,
      strapColor: oldProduct.strapColor,
      strapMaterial: oldProduct.strapMaterial,
      dialColor: oldProduct.dialColor,
      caseMaterial: oldProduct.caseMaterial,
      movement: oldProduct.movement,
    } : undefined;

    const product = await AdminProductService.updateProduct(id, req.body);

    await logActivity({
      action: 'PRODUCT_UPDATE',
      entity: 'product',
      entityId: id,
      userId: req.userId,
      userName: req.userName,
      details: `Producto actualizado: ${product.name}`,
      previousState,
    });

    sendSuccess(res, { data: product, message: 'Producto actualizado correctamente' });
  } catch (err) {
    next(err);
  }
}

export async function deleteProduct(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;

    // Guardar estado anterior para posible rollback
    const oldProduct = await AdminProductService.getProduct(id);
    const previousState = oldProduct ? {
      _id: oldProduct._id,
      name: oldProduct.name,
      brand: oldProduct.brand,
      description: oldProduct.description,
      price: oldProduct.price,
      oldPrice: oldProduct.oldPrice,
      category: oldProduct.category,
      stock: oldProduct.stock,
      status: oldProduct.status,
      image: oldProduct.image,
      gallery: oldProduct.gallery,
      mpn: oldProduct.mpn,
      sku: oldProduct.sku,
      tag: oldProduct.tag,
      strapColor: oldProduct.strapColor,
      strapMaterial: oldProduct.strapMaterial,
      dialColor: oldProduct.dialColor,
      caseMaterial: oldProduct.caseMaterial,
      movement: oldProduct.movement,
    } : undefined;

    const result = await AdminProductService.deleteProduct(id);

    await logActivity({
      action: 'PRODUCT_DELETE',
      entity: 'product',
      entityId: id,
      userId: req.userId,
      userName: req.userName,
      details: `Producto eliminado: ${oldProduct?.name || id}`,
      previousState,
    });

    sendSuccess(res, { data: result });
  } catch (err) {
    next(err);
  }
}

export async function uploadProductImage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.imageKey) {
      res.status(400).json({ success: false, message: 'No se proporcionó imagen' });
      return;
    }
    sendSuccess(res, { data: { image: req.imageKey }, message: 'Imagen subida correctamente' });
  } catch (err) {
    next(err);
  }
}

export async function uploadGalleryImages(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.galleryKeys || req.galleryKeys.length === 0) {
      res.status(400).json({ success: false, message: 'No se proporcionaron imágenes de galería' });
      return;
    }
    sendSuccess(res, { data: { gallery: req.galleryKeys }, message: 'Imágenes de galería subidas correctamente' });
  } catch (err) {
    next(err);
  }
}

export async function updateStock(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const { stock } = req.body;

    // Obtener stock anterior para rollback
    const oldProduct = await AdminProductService.getProduct(id);
    const previousState = oldProduct ? { oldStock: oldProduct.stock } : undefined;

    const product = await AdminProductService.updateStock(id, Number(stock));

    await logActivity({
      action: 'STOCK_UPDATE',
      entity: 'product',
      entityId: id,
      userId: req.userId,
      userName: req.userName,
      details: `Stock actualizado: ${product.name} -> ${stock} unidades`,
      previousState,
    });

    sendSuccess(res, { data: product, message: 'Stock actualizado correctamente' });
  } catch (err) {
    next(err);
  }
}
