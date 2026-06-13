import { S3Client } from '@aws-sdk/client-s3';

/**
 * Cliente S3 singleton para MinIO.
 * Centraliza la configuración para evitar duplicación entre ImageService y uploadMiddleware.
 */
let s3Instance: S3Client | null = null;

export function getS3Client(): S3Client {
  if (!s3Instance) {
    s3Instance = new S3Client({
      endpoint: process.env.MINIO_ENDPOINT || 'http://minio:9000',
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
        secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
      },
      forcePathStyle: true,
    });
  }
  return s3Instance;
}

export const BUCKET = process.env.MINIO_BUCKET || 'castellan-images';
