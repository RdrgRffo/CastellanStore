import Address from './Address.js';
import { notFound, badRequest } from '../shared/utils/AppError.js';

export async function getAddresses(userId: string) {
  return Address.find({ userId }).sort({ isDefault: -1, createdAt: -1 });
}

export async function getAddressById(userId: string, addressId: string) {
  const address = await Address.findOne({ _id: addressId, userId });
  if (!address) throw notFound('Dirección no encontrada');
  return address;
}

export async function createAddress(
  userId: string,
  data: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country?: string;
    phone?: string;
    isDefault?: boolean;
  }
) {
  if (!data.name || !data.address || !data.city || !data.state || !data.zip) {
    throw badRequest('Todos los campos obligatorios deben estar completos');
  }

  // Si es la primera dirección o se marca como default, quitar default de las demás
  if (data.isDefault) {
    await Address.updateMany({ userId }, { isDefault: false });
  } else {
    const count = await Address.countDocuments({ userId });
    if (count === 0) {
      data.isDefault = true;
    }
  }

  const address = await Address.create({
    userId,
    name: data.name,
    address: data.address,
    city: data.city,
    state: data.state,
    zip: data.zip,
    country: data.country || 'España',
    phone: data.phone || '',
    isDefault: data.isDefault ?? false,
  });

  return address;
}

export async function updateAddress(
  userId: string,
  addressId: string,
  data: {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    phone?: string;
    isDefault?: boolean;
  }
) {
  const address = await Address.findOne({ _id: addressId, userId });
  if (!address) throw notFound('Dirección no encontrada');

  // Si se marca como default, quitar default de las demás
  if (data.isDefault) {
    await Address.updateMany({ userId, _id: { $ne: addressId } }, { isDefault: false });
  }

  Object.assign(address, data);
  await address.save();
  return address;
}

export async function deleteAddress(userId: string, addressId: string) {
  const address = await Address.findOne({ _id: addressId, userId });
  if (!address) throw notFound('Dirección no encontrada');

  const wasDefault = address.isDefault;
  await Address.deleteOne({ _id: addressId });

  // Si la dirección eliminada era la default, asignar la más reciente como default
  if (wasDefault) {
    const nextAddress = await Address.findOne({ userId }).sort({ createdAt: -1 });
    if (nextAddress) {
      nextAddress.isDefault = true;
      await nextAddress.save();
    }
  }

  return { deleted: true };
}

export async function setDefaultAddress(userId: string, addressId: string) {
  const address = await Address.findOne({ _id: addressId, userId });
  if (!address) throw notFound('Dirección no encontrada');

  await Address.updateMany({ userId }, { isDefault: false });
  address.isDefault = true;
  await address.save();
  return address;
}
