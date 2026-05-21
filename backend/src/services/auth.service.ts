import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { signAccessToken } from '../utils/tokens.js';

export interface AuthResult {
  user: { id: string; name: string; email: string };
  token: string;
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  const email = input.email.toLowerCase().trim();
  const existing = await User.findOne({ email }).lean();
  if (existing) throw ApiError.conflict('An account with that email already exists.');

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await User.create({ name: input.name.trim(), email, passwordHash });

  const token = signAccessToken({ sub: user._id.toString(), email: user.email });
  return {
    user: { id: user._id.toString(), name: user.name, email: user.email },
    token,
  };
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const email = input.email.toLowerCase().trim();
  const user = await User.findOne({ email });
  if (!user) throw ApiError.unauthorized('Invalid email or password.');

  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) throw ApiError.unauthorized('Invalid email or password.');

  const token = signAccessToken({ sub: user._id.toString(), email: user.email });
  return {
    user: { id: user._id.toString(), name: user.name, email: user.email },
    token,
  };
}

export async function getUserById(id: string) {
  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('User not found.');
  return { id: user._id.toString(), name: user.name, email: user.email };
}
