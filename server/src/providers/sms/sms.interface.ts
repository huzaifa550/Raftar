export interface SendOtpResult {
  success: boolean;
  messageId: string;
  phone: string;
  otpCode?: string; // Only returned/logged in development or mock mode
  provider: string;
}

export interface SmsProvider {
  name: string;
  sendOtp(phone: string, otpCode: string): Promise<SendOtpResult>;
  sendTransactional(phone: string, message: string): Promise<{ success: boolean; messageId: string }>;
}
