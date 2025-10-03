// Quick test to verify GCS environment variables and authentication
const { Storage } = require('@google-cloud/storage');

console.log('Testing GCS environment variables...');
console.log('GCP_PROJECT_ID:', process.env.GCP_PROJECT_ID);
console.log('GCP_BUCKET_NAME:', process.env.GCP_BUCKET_NAME);
console.log('GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS);

async function testGCS() {
  try {
    const storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });

    const bucket = storage.bucket(process.env.GCP_BUCKET_NAME);
    
    // Test bucket access
    const [exists] = await bucket.exists();
    console.log(`Bucket exists: ${exists}`);
    
    if (exists) {
      console.log('✅ GCS authentication and bucket access working!');
    } else {
      console.log('❌ Bucket does not exist or no access');
    }
  } catch (error) {
    console.error('❌ GCS test failed:', error.message);
  }
}

testGCS();