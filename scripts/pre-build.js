const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function validateVersion() {
  console.log('Validating version...');
  const packageJson = require('../package.json');
  const version = packageJson.version;
  
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    console.error('Invalid version format. Must be in format x.y.z');
    process.exit(1);
  }
  
  console.log(`Version ${version} is valid`);
}

function checkDependencies() {
  console.log('Checking dependencies...');
  try {
    execSync('npm audit', { stdio: 'inherit' });
  } catch (error) {
    console.error('Dependency audit failed. Please fix vulnerabilities before building.');
    process.exit(1);
  }
}

function validateAssets() {
  console.log('Validating assets...');
  const requiredAssets = [
    'assets/icon.png',
    'assets/splash.png',
    'assets/adaptive-icon.png'
  ];

  requiredAssets.forEach(asset => {
    const assetPath = path.join(process.cwd(), asset);
    if (!fs.existsSync(assetPath)) {
      console.error(`Missing required asset: ${asset}`);
      process.exit(1);
    }
  });

  console.log('All required assets are present');
}

function checkLinting() {
  console.log('Running lint check...');
  try {
    execSync('npm run lint', { stdio: 'inherit' });
  } catch (error) {
    console.error('Lint check failed. Please fix linting errors before building.');
    process.exit(1);
  }
}

function checkTests() {
  console.log('Running tests...');
  try {
    execSync('npm test', { stdio: 'inherit' });
  } catch (error) {
    console.error('Tests failed. Please fix test failures before building.');
    process.exit(1);
  }
}

// Run all validations
console.log('Starting pre-build validation...');
validateVersion();
checkDependencies();
validateAssets();
checkLinting();
checkTests();
console.log('Pre-build validation completed successfully!'); 