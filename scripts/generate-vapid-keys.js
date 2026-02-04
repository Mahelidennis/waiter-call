#!/usr/bin/env node

/**
 * Generate VAPID keys for push notifications
 * Run this script to generate new VAPID keys for your project
 */

const webpush = require('web-push');

console.log('🔑 Generating VAPID keys for push notifications...\n');

try {
  const vapidKeys = webpush.generateVAPIDKeys();
  
  console.log('✅ VAPID keys generated successfully!\n');
  console.log('📝 Add these to your Vercel environment variables:\n');
  console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
  console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
  console.log('\n📋 Also add these additional variables:\n');
  console.log('PUSH_ENABLED=true');
  console.log('NEXT_PUBLIC_APP_URL=https://waiter-call-mqse1foj7-mahelis-projects.vercel.app');
  
  console.log('\n🔧 Setup Instructions:');
  console.log('1. Go to your Vercel project dashboard');
  console.log('2. Navigate to Settings → Environment Variables');
  console.log('3. Add the 4 environment variables above');
  console.log('4. Redeploy the application');
  console.log('5. Test push notifications in waiter dashboard');
  
  console.log('\n🎯 After setup, waiters should be able to:');
  console.log('- See PushToggle component in dashboard');
  console.log('- Click "Enable notifications"');
  console.log('- Grant browser permission');
  console.log('- Receive push notifications when calls are created');
  
} catch (error) {
  console.error('❌ Error generating VAPID keys:', error);
  process.exit(1);
}
