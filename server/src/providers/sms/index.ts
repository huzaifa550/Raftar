import { TwilioSmsAdapter } from './twilio-sms.adapter.ts';
import { SmsProvider } from './sms.interface.ts';

// Dedicated Twilio SMS Provider
const activeSmsProvider: TwilioSmsAdapter = new TwilioSmsAdapter({
  accountSid: process.env.TWILIO_ACCOUNT_SID || '',
  authToken: process.env.TWILIO_AUTH_TOKEN || '',
  fromNumber: process.env.TWILIO_PHONE_NUMBER || '',
  messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID || '',
});

export const smsProvider: SmsProvider = activeSmsProvider;
export { TwilioSmsAdapter };
export const MockSmsAdapter = TwilioSmsAdapter;

