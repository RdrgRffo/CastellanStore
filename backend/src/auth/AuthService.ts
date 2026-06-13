import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from './User.js';
import { eventBus } from '../shared/events/EventBus.js';
import { USER_REGISTERED_EVENT, UserRegisteredPayload } from '../shared/events/UserRegisteredEvent.js';
import { badRequest, unauthorized, conflict } from '../shared/utils/AppError.js';
import { logActivity } from '../activityLog/ActivityLogService.js';

const googleClient = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  ? new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      ''
    )
  : null;

function generateToken(userId: string, role: string, name?: string): string {
  return jwt.sign({ userId, role, name }, process.env.JWT_SECRET!, { expiresIn: '7d' });
}

export async function registerLocal(email: string, password: string, birthDate: string, name: string = '') {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw conflict('El email ya está registrado');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    email: email.toLowerCase(),
    name,
    passwordHash,
    provider: 'LOCAL',
    role: 'ROLE_USER',
    birthDate: new Date(birthDate),
  });

  await eventBus.emit(USER_REGISTERED_EVENT, {
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
    provider: 'LOCAL',
  } as UserRegisteredPayload);

  await logActivity({
    action: 'USER_REGISTER',
    entity: 'user',
    entityId: user._id.toString(),
    userId: user._id.toString(),
    userName: user.name,
    details: `Nuevo usuario registrado (LOCAL): ${user.email}`,
  });

  const token = generateToken(user._id.toString(), user.role, user.name);
  return { token, user: { id: user._id, email: user.email, name: user.name, role: user.role, provider: user.provider } };
}

export async function loginLocal(email: string, password: string) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.passwordHash) {
    throw unauthorized('Email o contraseña incorrectos');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw unauthorized('Email o contraseña incorrectos');
  }

  const token = generateToken(user._id.toString(), user.role, user.name);
  return { token, user: { id: user._id, email: user.email, name: user.name, role: user.role, provider: user.provider } };
}

export async function loginWithGoogle(idToken: string) {
  if (!googleClient) {
    throw unauthorized('Google OAuth no está configurado en el servidor');
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw unauthorized('Token de Google inválido');
  }

  let user = await User.findOne({ email: payload.email });

  if (!user) {
    user = await User.create({
      email: payload.email,
      name: payload.name || payload.given_name || '',
      picture: payload.picture || null,
      passwordHash: null,
      provider: 'GOOGLE',
      role: 'ROLE_USER',
      birthDate: null,
    });

    await eventBus.emit(USER_REGISTERED_EVENT, {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      provider: 'GOOGLE',
    } as UserRegisteredPayload);

    await logActivity({
      action: 'USER_REGISTER',
      entity: 'user',
      entityId: user._id.toString(),
      userId: user._id.toString(),
      userName: user.name,
      details: `Nuevo usuario registrado (GOOGLE): ${user.email}`,
    });
  }

  const token = generateToken(user._id.toString(), user.role, user.name);
  return { token, user: { id: user._id, email: user.email, name: user.name, picture: user.picture, role: user.role, provider: user.provider } };
}

export async function updateProfile(userId: string, birthDate: string) {
  const user = await User.findByIdAndUpdate(
    userId,
    { birthDate: new Date(birthDate) },
    { new: true }
  );
  if (!user) throw badRequest('Usuario no encontrado');
  return { id: user._id, email: user.email, name: user.name, birthDate: user.birthDate, role: user.role, provider: user.provider };
}

export async function getProfile(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw badRequest('Usuario no encontrado');
  return {
    id: user._id,
    email: user.email,
    name: user.name,
    picture: user.picture,
    role: user.role,
    provider: user.provider,
    birthDate: user.birthDate,
    createdAt: user.createdAt,
  };
}
