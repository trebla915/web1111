const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const requiredSecrets = [
  'api_base_url',
  'firebase_api_key',
  'firebase_auth_domain',
  'firebase_project_id',
  'firebase_storage_bucket',
  'firebase_messaging_sender_id',
  'firebase_app_id',
  'apple_id',
  'asc_app_id',
  'apple_team_id'
];

function checkSecrets() {
  console.log('Checking EAS secrets...');
  try {
    const result = execSync('eas secret:list --json').toString();
    const secrets = JSON.parse(result);
    const missingSecrets = requiredSecrets.filter(secret => 
      !secrets.some(s => s.name === secret)
    );

    if (missingSecrets.length > 0) {
      console.error('Missing required secrets:');
      missingSecrets.forEach(secret => {
        console.error(`- ${secret}`);
      });
      console.log('\nPlease set the missing secrets using:');
      console.log('eas secret:create --scope project --name SECRET_NAME --value SECRET_VALUE');
      process.exit(1);
    }
    console.log('All required secrets are present!');
  } catch (error) {
    console.error('Error checking secrets:', error.message);
    process.exit(1);
  }
}

function validateEnvironment() {
  console.log('Validating environment setup...');
  
  // Check for Google Play service account key
  const serviceAccountPath = path.join(process.cwd(), 'google-play-service-account.json');
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('Missing Google Play service account key file');
    console.error('Please place your service account key at:', serviceAccountPath);
    process.exit(1);
  }

  // Check app.json
  const appJsonPath = path.join(process.cwd(), 'app.json');
  if (!fs.existsSync(appJsonPath)) {
    console.error('Missing app.json file');
    process.exit(1);
  }

  console.log('Environment validation complete!');
}

// Run checks
checkSecrets();
validateEnvironment(); 