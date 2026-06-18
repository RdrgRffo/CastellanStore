import { Response, NextFunction } from 'express';
import { AuthRequest } from '../shared/middleware/authMiddleware.js';
import * as AddressService from './AddressService.js';
import { sendSuccess, sendCreated } from '../shared/utils/ApiResponse.js';

export async function getAddresses(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const addresses = await AddressService.getAddresses(req.userId!);
    sendSuccess(res, { data: addresses });
  } catch (err) {
    next(err);
  }
}

export async function getAddressById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const address = await AddressService.getAddressById(req.userId!, id);
    sendSuccess(res, { data: address });
  } catch (err) {
    next(err);
  }
}

export async function createAddress(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const address = await AddressService.createAddress(req.userId!, req.body);
    sendCreated(res, { data: address, message: 'Dirección guardada correctamente' });
  } catch (err) {
    next(err);
  }
}

export async function updateAddress(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const address = await AddressService.updateAddress(req.userId!, id, req.body);
    sendSuccess(res, { data: address, message: 'Dirección actualizada correctamente' });
  } catch (err) {
    next(err);
  }
}

export async function deleteAddress(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    await AddressService.deleteAddress(req.userId!, id);
    sendSuccess(res, { data: null, message: 'Dirección eliminada correctamente' });
  } catch (err) {
    next(err);
  }
}

export async function setDefaultAddress(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const address = await AddressService.setDefaultAddress(req.userId!, id);
    sendSuccess(res, { data: address, message: 'Dirección predeterminada actualizada' });
  } catch (err) {
    next(err);
  }
}
