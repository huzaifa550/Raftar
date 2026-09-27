import { z } from 'zod';

export const RequestOtpSchema = z.object({
  phone: z
    .string()
    .min(10, 'Phone number must have at least 10 digits')
    .max(16, 'Phone number cannot exceed 16 characters')
    .regex(/^(\+92|0|92)?3\d{9}$/, 'Must be a valid Pakistani mobile number (e.g. 03001234567 or +923001234567)'),
});

export const VerifyOtpSchema = z.object({
  phone: z.string().min(10),
  code: z.string().length(6, 'Verification code must be exactly 6 digits'),
  fullName: z.string().min(2).max(100).optional(),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(10, 'Refresh token required'),
});

export const LogoutSchema = z.object({
  refreshToken: z.string().optional(),
});
