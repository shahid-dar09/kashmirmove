import { Request } from 'express';

export type UserRole = 'customer' | 'driver' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface UserPayload {
  id: number;
  role: UserRole | string;
  name?: string;
  email?: string;
}

export interface AuthRequest extends Request {
  user?: UserPayload;
  file?: Express.Multer.File;
  files?: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: any;
}
