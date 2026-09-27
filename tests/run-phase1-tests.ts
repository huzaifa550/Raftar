import { hasPermission, ROLE_DEFINITIONS } from '../server/src/config/rbac.ts';
import { dataStore } from '../server/src/db/datastore.ts';
import { authService } from '../server/src/modules/auth/auth.service.ts';
import { smsProvider } from '../server/src/providers/sms/index.ts';
import { MockSmsAdapter } from '../server/src/providers/sms/mock-sms.adapter.ts';

async function runTests() {
  console.log('🧪 Starting Raftaar Phase 1 Automated Test Suite...\n');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      throw new Error(`Test Failed: ${testName}`);
    }
  }

  // 1. Phone Normalization Tests
  console.log('--- 1. Pakistani Phone Number Normalization ---');
  assert(authService.normalizePakistaniPhone('03001234567') === '+923001234567', 'Format: 03001234567 -> +923001234567');
  assert(authService.normalizePakistaniPhone('+92 300 1234567') === '+923001234567', 'Format: +92 300 1234567 -> +923001234567');
  assert(authService.normalizePakistaniPhone('3001234567') === '+923001234567', 'Format: 3001234567 -> +923001234567');

  // 2. OTP Request & Mock SMS Provider
  console.log('\n--- 2. OTP Request & Mock SMS Provider ---');
  const otpResult = await authService.requestOtp('03451122334');
  assert(otpResult.phone === '+923451122334', 'OTP requested for normalized phone');
  assert(Boolean(otpResult.mockOtpCode), 'Mock OTP generated');

  let sentOtp = otpResult.mockOtpCode;
  if (!sentOtp && smsProvider instanceof MockSmsAdapter) {
    sentOtp = smsProvider.getLastOtp('+923451122334');
  }
  assert(Boolean(sentOtp && sentOtp.length === 6), 'OTP code is 6 digits');

  // 3. OTP Verification & Auto-Registration
  console.log('\n--- 3. OTP Verification & Auto-Registration ---');
  const loginResult = await authService.verifyOtpAndLogin(
    '+923451122334',
    sentOtp!,
    'Ahmad Raza',
    ['customer'],
    '192.168.1.1',
    'TestRunner/1.0'
  );

  assert(loginResult.user.phone === '+923451122334', 'User created with expected phone');
  assert(loginResult.user.fullName === 'Ahmad Raza', 'User created with full name');
  assert(Boolean(loginResult.accessToken), 'Access JWT issued');
  assert(Boolean(loginResult.refreshToken), 'Refresh token issued');

  // 4. Token Verification & Payload
  console.log('\n--- 4. Access Token Cryptographic Verification ---');
  const verifiedPayload = authService.verifyAccessToken(loginResult.accessToken);
  assert(verifiedPayload.sub === loginResult.user.id, 'Payload sub matches user ID');
  assert(verifiedPayload.roles.includes('customer'), 'Payload contains customer role');

  // 5. Refresh Token Rotation
  console.log('\n--- 5. Token Rotation & Replay Protection ---');
  const refreshed = await authService.refreshTokens(loginResult.refreshToken);
  assert(Boolean(refreshed.accessToken), 'Fresh access token received');
  assert(Boolean(refreshed.refreshToken), 'Fresh refresh token received');
  assert(refreshed.refreshToken !== loginResult.refreshToken, 'New refresh token differs from previous');

  // Assert old token is revoked
  let replayError = false;
  try {
    await authService.refreshTokens(loginResult.refreshToken);
  } catch {
    replayError = true;
  }
  assert(replayError, 'Replay of rotated refresh token is correctly rejected');

  // 6. RBAC Permission Checks
  console.log('\n--- 6. RBAC Role & Permission Boundary Checks ---');
  assert(hasPermission(['customer'], 'orders', 'create'), 'Customer CAN create orders');
  assert(!hasPermission(['customer'], 'merchants', 'approve'), 'Customer CANNOT approve merchants');
  assert(!hasPermission(['customer'], 'audit_logs', 'read'), 'Customer CANNOT read audit logs');

  assert(hasPermission(['restaurant_partner'], 'orders', 'accept'), 'Restaurant Partner CAN accept orders');
  assert(!hasPermission(['restaurant_partner'], 'dispatch', 'assign'), 'Restaurant Partner CANNOT assign riders');

  assert(hasPermission(['rider'], 'dispatch', 'accept_offer'), 'Rider CAN accept dispatch offer');
  assert(hasPermission(['rider'], 'rider', 'stream_location'), 'Rider CAN stream location');
  assert(!hasPermission(['rider'], 'catalog', 'write'), 'Rider CANNOT modify catalog');

  assert(hasPermission(['finance_staff'], 'payments', 'reconcile_cod'), 'Finance CAN reconcile COD cash');
  assert(hasPermission(['finance_staff'], 'settlements', 'manage'), 'Finance CAN manage settlements');
  assert(!hasPermission(['finance_staff'], 'orders', 'override_status'), 'Finance CANNOT override order status');

  assert(hasPermission(['admin'], 'merchants', 'approve'), 'Admin CAN approve merchants');
  assert(hasPermission(['admin'], 'settings', 'edit'), 'Admin CAN edit settings');

  assert(hasPermission(['super_admin'], 'orders', 'create'), 'Super Admin has all permissions (orders:create)');
  assert(hasPermission(['super_admin'], 'settings', 'edit'), 'Super Admin has all permissions (settings:edit)');

  // 7. Audit Log Verification
  console.log('\n--- 7. Audit Trail Integrity ---');
  const auditLogs = dataStore.listAuditLogs(10);
  assert(auditLogs.length > 0, 'Audit logs populated');
  assert(Boolean(auditLogs[0].action), 'Audit log contains action field');
  assert(Boolean(auditLogs[0].createdAt), 'Audit log contains timestamp');

  console.log(`\n🎉 All ${passed}/${total} Phase 1 tests passed successfully!`);
}

runTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
