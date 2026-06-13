import { PutObjectCommand, CreateBucketCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Response } from 'express';
import { getS3Client, BUCKET } from './S3Client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const s3 = getS3Client();

export async function ensureBucket(): Promise<void> {
  try {
    await s3.send(new CreateBucketCommand({ Bucket: BUCKET }));
    console.log(`Bucket ${BUCKET} creado en MinIO`);
  } catch (e: any) {
    if (e.name === 'BucketAlreadyExists' || e.name === 'BucketAlreadyOwnedByYou') {
      console.log(`Bucket ${BUCKET} ya existe`);
    } else {
      console.log(`Bucket ${BUCKET} listo (puede que ya exista)`);
    }
  }
}

/**
 * Sube una imagen a MinIO y devuelve solo el nombre del archivo (key).
 * Ej: "abc123.webp"
 */
export async function uploadImage(
  watchId: string,
  imagePath: string
): Promise<string> {
  const ext = imagePath.split('.').pop() || 'webp';
  const key = `${watchId}.${ext}`;

  // Buscar la imagen en varias rutas posibles
  const filename = imagePath.split('/').pop() || '';
  const possiblePaths = [
    // Ruta directa tal cual se pasa
    imagePath,
    // Desarrollo local: desde dist/ (src -> dist)
    join(__dirname, '..', '..', '..', '..', 'public', 'images', filename),
    // Desarrollo local: desde src/
    join(__dirname, '..', '..', '..', 'public', 'images', filename),
    // Docker: volumen montado en /public/images
    join('/public', 'images', filename),
    // Docker: desde /app/public/images
    join('/app', 'public', 'images', filename),
    // Desde la raíz del proyecto (local con ts-node)
    join(process.cwd(), 'public', 'images', filename),
  ];

  let body: Buffer | null = null;
  let foundPath = '';

  for (const p of possiblePaths) {
    if (existsSync(p)) {
      body = readFileSync(p);
      foundPath = p;
      break;
    }
  }

  if (!body) {
    console.log(`[ImageService] ⚠️ Imagen no encontrada para ${watchId} (${filename}), se usará placeholder`);
    console.log(`[ImageService] Rutas buscadas:\n  ${possiblePaths.join('\n  ')}`);
    return 'placeholder.webp';
  }

  console.log(`[ImageService] Imagen encontrada en: ${foundPath}`);

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: `image/${ext === 'webp' ? 'webp' : ext}`,
  }));

  console.log(`[ImageService] ✅ Imagen subida: ${key}`);
  return key;
}

/**
 * Elimina una imagen de MinIO por su key (filename).
 */
export async function deleteImage(key: string): Promise<void> {
  if (!key) return;
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch (e) {
    console.log(`No se pudo eliminar imagen: ${key}`);
  }
}

/**
 * Sirve una imagen desde MinIO a través de Express (proxy).
 * GET /api/v1/images/:filename
 */
export async function serveImage(filename: string, res: Response): Promise<void> {
  try {
    const command = new GetObjectCommand({ Bucket: BUCKET, Key: filename });
    const response = await s3.send(command);

    if (!response.Body) {
      res.status(404).json({ error: 'Imagen no encontrada' });
      return;
    }

    // Determinar content-type
    const ext = filename.split('.').pop()?.toLowerCase() || 'webp';
    const contentTypes: Record<string, string> = {
      webp: 'image/webp',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
    };

    res.setHeader('Content-Type', contentTypes[ext] || 'image/webp');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    // Convertir el stream a buffer y enviarlo
    const stream = response.Body as any;
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    res.end(Buffer.concat(chunks));
  } catch (e: any) {
    if (e.name === 'NoSuchKey') {
      res.status(404).json({ error: 'Imagen no encontrada' });
    } else {
      console.error('Error sirviendo imagen:', e);
      res.status(500).json({ error: 'Error al servir la imagen' });
    }
  }
}
