import { Router } from 'express';
import { getAllWatches, getWatchById, getFeaturedWatches, getRelatedWatches } from './watchController.js';

const router = Router();

router.get('/', getAllWatches);
router.get('/featured', getFeaturedWatches);
router.get('/:id', getWatchById);
router.get('/:id/related', getRelatedWatches);

export default router;
