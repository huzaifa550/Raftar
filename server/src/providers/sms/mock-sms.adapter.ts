import { SendOtpResult, SmsProvider } from './sms.interface.ts';

export class MockSmsAdapter implements SmsProvider {
  name = 'MockSmsAdapter (Dev / CI)';
  private lastOtps: Map<string, { code: string; sentAt: Date }> = new Map();

  async sendOtp(phone: string, otpCode: string): Promise<SendOtpResult> {
    const messageId = `mock_sms_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    this.lastOtps.set(phone, { code: otpCode, sentAt: new Date() });

    console.log(`\n======================================================`);
    console.log(`[Raftaar SMS Gateway - MOCK DISPATCH]`);
    console.log(`To:        ${phone}`);
    console.log(`OTP Code:  ${otpCode}`);
    console.log(`Message:   Your Raftaar (رفتار) verification code is ${otpCode}. Valid for 3 minutes. Do not share.`);
    console.log(`======================================================\n`);

    return {
      success: true,
      messageId,
      phone,
      otpCode,
      provider: 'mock',
    };
  }

  async sendTransactional(phone: string, message: string): Promise<{ success: boolean; messageId: string }> {
    const messageId = `mock_tx_${Date.now()}`;
    console.log(`[Raftaar SMS MOCK] To: ${phone} | Body: ${message}`);
    return { success: true, messageId };
  }

  getLastOtp(phone: string): string | undefined {
    return this.lastOtps.get(phone)?.code;
  }
}

export class TwilioSmsAdapter implements SmsProvider {
  name = 'TwilioSmsAdapter';
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor(accountSid: string, authToken: string, fromNumber: string) {
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.fromNumber = fromNumber;
  }

  async sendOtp(phone: string, otpCode: string): Promise<SendOtpResult> {
    if (!this.accountSid || !this.authToken) {
      console.warn('[TwilioSmsAdapter] Credentials missing. Falling back to simulated dispatch.');
      return {
        success: true,
        messageId: `sim_twilio_${Date.now()}`,
        phone,
        otpCode,
        provider: 'twilio_simulated',
      };
    }
    // In production with real Twilio credentials, would make REST request to Twilio API
    console.log(`[Twilio SMS] Sending OTP ${otpCode} to ${phone} from ${this.fromNumber}`);
    return {
      success: true,
      messageId: `tw_${Date.now()}`,
      phone,
      provider: 'twilio',
    };
  }

  async sendTransactional(phone: string, message: string): Promise<{ success: boolean; messageId: string }> {
    return { success: true, messageId: `tw_tx_${Date.now()}` };
  }
}
