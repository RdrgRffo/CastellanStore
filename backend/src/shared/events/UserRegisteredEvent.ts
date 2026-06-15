export interface UserRegisteredPayload {
  userId: string;
  email: string;
  name: string;
  provider: 'LOCAL' | 'GOOGLE';
}

export const USER_REGISTERED_EVENT = 'user.registered';
