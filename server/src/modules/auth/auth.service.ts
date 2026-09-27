import jwt from 'jsonwebtoken';
import { dataStore } from '../../db/datastore.ts';
import { smsProvider } from '../../providers/sms/index.ts';
import { RoleId, User } from '../../types/index.ts';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'raftaar_jwt_access_super_secret_key_pk_2026';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'raftaar_jwt_refresh_super_secret_key_pk_2026';
const ACCESS_EXPIRY = '15m';
const REFRESH_EXPIRY_DAYS = 30;

export interface TokenPayload {
  sub: string;
  phone: string;
  roles: RoleId[];
  merchantId?: string;
  riderId?: string;
}

export class AuthService {
  // 1. Request OTP for Pakistani phone (+92300XXXXXXX or 0300XXXXXXX)
  async requestOtp(rawPhone: string) {
    const formattedPhone = this.normalizePakistaniPhone(rawPhone);
    // Generate secure 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in dataStore with 180s TTL
    dataStore.setOtp(formattedPhone, otpCode, 180);

    // Send via SMS provider (Mock or Twilio)
    const smsResult = await smsProvider.sendOtp(formattedPhone, otpCode);

    return {
      phone: formattedPhone,
      expiresInSeconds: 180,
      mockOtpCode: process.env.NODE_ENV !== 'production' ? otpCode : undefined,
      provider: smsResult.provider,
    };
  }

  // 2. Verify OTP and return tokens + user
  async verifyOtpAndLogin(
    rawPhone: string,
    code: string,
    fullNameIfRegister?: string,
    rolesIfRegister: RoleId[] = ['customer'],
    ipAddress?: string,
    userAgent?: string
  ) {
    const phone = this.normalizePakistaniPhone(rawPhone);
    const verification = dataStore.verifyOtp(phone, code);

    if (!verification.success) {
      throw new Error(verification.error || 'OTP verification failed');
    }

    let user = dataStore.findUserByPhone(phone);

    if (!user) {
      // Auto-register customer if not found
      user = dataStore.createUser({
        phone,
        fullName: fullNameIfRegister || `Customer ${phone.slice(-4)}`,
        roles: rolesIfRegister,
        status: 'active',
        isPhoneVerified: true,
      });

      dataStore.addAuditLog({
        actorId: user.id,
        actorPhone: user.phone,
        actorRole: user.roles[0],
        action: 'user:register:otp',
        resource: 'users',
        targetId: user.id,
        diff: { phone, roles: user.roles },
        ipAddress,
        userAgent,
      });
    } else {
      if (!user.isPhoneVerified) {
        user = dataStore.updateUser(user.id, { isPhoneVerified: true });
      }

      dataStore.addAuditLog({
        actorId: user?.id,
        actorPhone: user?.phone,
        actorRole: user?.roles[0],
        action: 'user:login:otp',
        resource: 'auth',
        targetId: user?.id,
        ipAddress,
        userAgent,
      });
    }

    if (!user) {
      throw new Error('Failed to resolve user account');
    }

    // Generate tokens
    const tokens = this.generateTokenPair(user, ipAddress, userAgent);

    return {
      user,
      ...tokens,
    };
  }

  // 3. Refresh Access Token using Refresh Token
  async refreshTokens(refreshToken: string, ipAddress?: string, userAgent?: string) {
    let decoded: { sub: string };
    try {
      decoded = jwt.verify(refreshToken, REFRESH_SECRET) as { sub: string };
    } catch {
      throw new Error('Invalid or expired refresh token');
    }

    const storedToken = dataStore.findRefreshToken(refreshToken);
    if (!storedToken || storedToken.revokedAt || new Date(storedToken.expiresAt) < new Date()) {
      throw new Error('Refresh token has been revoked or expired');
    }

    const user = dataStore.findUserById(decoded.sub);
    if (!user || user.status !== 'active') {
      throw new Error('User not found or suspended');
    }

    // Revoke used token (token rotation for security)
    dataStore.revokeRefreshToken(refreshToken);

    // Issue fresh pair
    const tokens = this.generateTokenPair(user, ipAddress, userAgent);

    dataStore.addAuditLog({
      actorId: user.id,
      actorPhone: user.phone,
      actorRole: user.roles[0],
      action: 'auth:token:refresh',
      resource: 'auth',
      targetId: user.id,
      ipAddress,
      userAgent,
    });

    return {
      user,
      ...tokens,
    };
  }

  // 4. Logout / Revoke Token
  async logout(refreshToken: string, actorId?: string) {
    if (refreshToken) {
      dataStore.revokeRefreshToken(refreshToken);
    }
    if (actorId) {
      const user = dataStore.findUserById(actorId);
      dataStore.addAuditLog({
        actorId,
        actorPhone: user?.phone,
        actorRole: user?.roles[0],
        action: 'user:logout',
        resource: 'auth',
        targetId: actorId,
      });
    }
    return { success: true };
  }

  // Token Generation
  generateTokenPair(user: User, ipAddress?: string, userAgent?: string) {
    const payload: TokenPayload = {
      sub: user.id,
      phone: user.phone,
      roles: user.roles,
      merchantId: user.merchantId,
      riderId: user.riderId,
    };

    const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY });
    const jti = `jti_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const refreshToken = jwt.sign({ sub: user.id, jti }, REFRESH_SECRET, {
      expiresIn: `${REFRESH_EXPIRY_DAYS}d`,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_EXPIRY_DAYS);

    dataStore.saveRefreshToken({
      userId: user.id,
      tokenHash: refreshToken,
      expiresAt: expiresAt.toISOString(),
      ipAddress,
      userAgent,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 mins in seconds
    };
  }

  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
    } catch {
      throw new Error('Invalid or expired access token');
    }
  }

  // Normalizes +92 300 1234567, 03001234567, 3001234567 -> +923001234567
  normalizePakistaniPhone(raw: string): string {
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('92')) {
      return `+${digits}`;
    }
    if (digits.startsWith('0')) {
      return `+92${digits.slice(1)}`;
    }
    if (digits.length === 10 && digits.startsWith('3')) {
      return `+92${digits}`;
    }
    return `+${digits}`;
  }
}

export const authService = new AuthService();
