import multer from 'multer';
import sharp from 'sharp';
import { Request, Response, NextFunction } from 'express';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getS3Client, BUCKET } from '../utils/S3Client.js';

const s3 = getS3Client();

// Multer config: aceptar solo imágenes, máx 5MB
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato no permitido. Usa JPG, PNG, WebP o GIF'));
    }
  },
});

// Middleware que convierte la imagen a WebP y la sube a MinIO
// Espera: req.file (de multer) y req.body.watchId
// Devuelve: req.imageKey con el filename en MinIO
export async function processAndUploadImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      next();
      return;
    }

    const watchId = req.body.watchId || `temp-${Date.now()}`;
    const key = `${watchId}.webp`;

    // Convertir a WebP con sharp (800px de ancho máximo)
    const webpBuffer = await sharp(req.file.buffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    // Subir a MinIO
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: webpBuffer,
      ContentType: 'image/webp',
    }));

    req.imageKey = key;
    console.log(`Imagen subida y convertida: ${key}`);
    next();
  } catch (err) {
    next(err);
  }
}

// Middleware que convierte múltiples imágenes de galería a WebP y las sube a MinIO
// Espera: req.files (array de multer) y req.body.watchId
// Devuelve: req.galleryKeys con array de filenames en MinIO
export async function processAndUploadGalleryImages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      next();
      return;
    }

    const watchId = req.body.watchId || `temp-${Date.now()}`;
    const keys: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const key = `${watchId}_gallery_${i}.webp`;

      const webpBuffer = await sharp(files[i].buffer)
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: webpBuffer,
        ContentType: 'image/webp',
      }));

      keys.push(key);
      console.log(`Imagen de galería subida y convertida: ${key}`);
    }

    req.galleryKeys = keys;
    next();
  } catch (err) {
    next(err);
  }
}

// Extender Request para incluir imageKey y galleryKeys
declare global {
  namespace Express {
    interface Request {
      imageKey?: string;
      galleryKeys?: string[];
    }
  }
}
