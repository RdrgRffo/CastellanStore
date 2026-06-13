import { Request, Response, NextFunction } from 'express';
import * as WatchService from './WatchService.js';
import { sendSuccess } from '../shared/utils/ApiResponse.js';

export async function getAllWatches(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      tag,
      sortBy,
      page,
      size,
    } = req.query;

    const result = await WatchService.getAll({
      search: search as string | undefined,
      category: category as string | undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      tag: tag as string | undefined,
      sortBy: sortBy as string | undefined,
      page: page ? Number(page) : undefined,
      size: size ? Number(size) : undefined,
    });

    sendSuccess(res, { data: result });
  } catch (err) {
    next(err);
  }
}

export async function getWatchById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const watch = await WatchService.getById(req.params.id as string);
    sendSuccess(res, { data: watch });
  } catch (err) {
    next(err);
  }
}

export async function getFeaturedWatches(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const watches = await WatchService.getFeatured();
    sendSuccess(res, { data: watches });
  } catch (err) {
    next(err);
  }
}

export async function getRelatedWatches(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = req.query.limit ? Number(String(req.query.limit)) : 4;
    const watches = await WatchService.getRelated(String(req.params.id), limit);
    sendSuccess(res, { data: watches });
  } catch (err) {
    next(err);
  }
}
