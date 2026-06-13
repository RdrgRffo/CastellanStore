import { Router, Request, Response } from 'express';
import { serveImage } from '../shared/utils/ImageService.js';

const router = Router();

// GET /api/v1/images/:filename
// Sirve imágenes desde MinIO a través del backend (proxy)
router.get('/:filename', async (req: Request, res: Response) => {
  const filename = req.params.filename as string;
  
  // Validar que el filename no intente path traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    res.status(400).json({ error: 'Filename inválido' });
    return;
  }

  await serveImage(filename, res);
});

export default router;
