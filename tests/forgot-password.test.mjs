import assert from 'assert';

async function runTests() {
  const baseUrl = 'http://localhost:3000';
  console.log('--- Starting Forgot Password & Auth End-to-End Tests ---');

  // 1. Test Unregistered user on forgot-password
  console.log('1. Testing unregistered user on /api/auth/forgot-password...');
  const unregRes = await fetch(`${baseUrl}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nonexistent_user_99999@example.com' }),
  });
  const unregData = await unregRes.json();
  console.log('Unregistered response status:', unregRes.status);
  console.log('Unregistered response body:', unregData);
  assert.strictEqual(unregRes.status, 404, 'Should return 404 for unregistered user');
  assert(unregData.error.toLowerCase().includes('not registered'), 'Should state user is not registered');
  console.log('✅ Unregistered user test PASSED!\n');

  // 2. Test Registration of a test user
  const testEmail = `test_customer_${Date.now()}@example.com`;
  const initialPassword = 'InitialPassword123!';
  console.log(`2. Registering test user: ${testEmail}...`);
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Customer',
      email: testEmail,
      password: initialPassword,
    }),
  });
  const regData = await regRes.json();
  console.log('Register status:', regRes.status, 'user:', regData.user?.email);
  assert.strictEqual(regRes.status, 200, 'Registration should succeed');
  console.log('✅ Registration test PASSED!\n');

  // 3. Test Forgot Password for REGISTERED user
  console.log('3. Testing forgot password for registered user...');
  const forgotRes = await fetch(`${baseUrl}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail }),
  });
  const forgotData = await forgotRes.json();
  console.log('Forgot password status:', forgotRes.status);
  console.log('Reset link generated:', forgotData.resetUrl);
  assert.strictEqual(forgotRes.status, 200, 'Forgot password should succeed');
  assert(forgotData.resetToken, 'Should return reset token');
  console.log('✅ Registered forgot password test PASSED!\n');

  // 4. Test Reset Password with token
  const newPassword = 'NewSecretPassword456!';
  console.log('4. Testing reset password with token...');
  const resetRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: forgotData.resetToken,
      newPassword: newPassword,
    }),
  });
  const resetData = await resetRes.json();
  console.log('Reset password status:', resetRes.status, resetData.message);
  assert.strictEqual(resetRes.status, 200, 'Reset password should succeed');
  console.log('✅ Reset password test PASSED!\n');

  // 5. Test Login with NEW password
  console.log('5. Testing login with new password...');
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: newPassword,
    }),
  });
  const loginData = await loginRes.json();
  console.log('Login status:', loginRes.status, 'logged in as:', loginData.user?.name);
  assert.strictEqual(loginRes.status, 200, 'Login with new password should succeed');
  console.log('✅ Login with new password test PASSED!\n');

  // 6. Test old token reuse (should fail)
  console.log('6. Testing reuse of already consumed token...');
  const reuseRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: forgotData.resetToken,
      newPassword: 'AnotherPassword789!',
    }),
  });
  assert.strictEqual(reuseRes.status, 400, 'Reused token should fail');
  console.log('✅ Token single-use security test PASSED!\n');

  console.log('🎉 ALL FORGOT PASSWORD & AUTH TESTS PASSED PERFECTLY!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
