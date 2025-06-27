const replicateService = require('./src/services/replicateService');
const firebaseService = require('./src/services/firebaseService');

console.log('🧪 Firebase Integration Test\n');

// Test Firebase configuration
console.log('📋 Firebase Configuration Status:');
console.log('- Configured:', firebaseService.isConfigured());
console.log('- Bucket Info:', firebaseService.getBucketInfo());

// Test storage service info
console.log('\n📦 Storage Service Info:');
const storageInfo = replicateService.getStorageInfo();
console.log('- Type:', storageInfo.type);
if (storageInfo.type === 'firebase') {
  console.log('- Bucket:', storageInfo.name);
  console.log('- Project ID:', storageInfo.projectId);
} else {
  console.log('- URL:', storageInfo.url);
}

console.log('\n✅ Test completed successfully!');
console.log('\n📝 Next steps:');
console.log('1. If Firebase is not configured, the service will use local storage');
console.log('2. To enable Firebase Storage, follow the FIREBASE_SETUP.md guide');
console.log('3. Add Firebase credentials to your .env file');
console.log('4. Restart the server to use Firebase Storage'); 