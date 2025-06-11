#!/usr/bin/env node

/**
 * Check if current changes are compatible with existing builds
 * Run this before publishing OTA updates
 */

const { execSync } = require('child_process');
const fs = require('fs');

async function checkCompatibility() {
  try {
    console.log('🔍 Checking OTA update compatibility...\n');
    
    // Get current local fingerprint
    const currentFingerprint = execSync('npx @expo/fingerprint .', { 
      encoding: 'utf8', 
      stdio: ['pipe', 'pipe', 'ignore'] 
    });
    
    const fingerprintData = JSON.parse(currentFingerprint);
    const currentHash = fingerprintData.hash;
    
    console.log(`📱 Current local fingerprint: ${currentHash}`);
    
    // Store current fingerprint for comparison
    const storedFingerprintFile = '.last-build-fingerprint';
    
    try {
      // Try to get latest build runtime version from EAS
      const builds = execSync('eas build:list --limit=1 --json', { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore']
      });
      
      const buildData = JSON.parse(builds);
      if (buildData.length > 0) {
        const latestBuild = buildData[0];
        const buildRuntimeVersion = latestBuild.runtimeVersion;
        
        console.log(`🏗️  Latest build runtime: ${buildRuntimeVersion}`);
        
        // Store this for future reference
        fs.writeFileSync(storedFingerprintFile, buildRuntimeVersion);
        
        if (currentHash === buildRuntimeVersion) {
          console.log('\n✅ COMPATIBLE: Changes are OTA-compatible!');
          console.log('   → You can safely publish an OTA update');
          
          console.log('\n📤 Suggested command:');
          console.log(`   eas update --branch ${latestBuild.distribution === 'INTERNAL' ? 'preview' : 'production'} --message "Your update message"`);
          
          process.exit(0);
        } else {
          console.log('\n❌ INCOMPATIBLE: Changes require a new build');
          console.log('   → Native dependencies or configuration changed');
          console.log('   → Create a new build instead of OTA update');
          
          console.log('\n🏗️  Suggested command:');
          console.log(`   eas build --platform ios --profile ${latestBuild.buildProfile || 'preview-device'} --message "Native changes"`);
          
          process.exit(1);
        }
      }
    } catch (easError) {
      // Fall back to stored fingerprint if EAS command fails
      console.log('⚠️  Could not fetch latest build from EAS');
      
      if (fs.existsSync(storedFingerprintFile)) {
        const storedFingerprint = fs.readFileSync(storedFingerprintFile, 'utf8').trim();
        console.log(`🏗️  Using stored build runtime: ${storedFingerprint}`);
        
        if (currentHash === storedFingerprint) {
          console.log('\n✅ COMPATIBLE: Changes are likely OTA-compatible!');
          console.log('   → You can try publishing an OTA update');
          console.log('   → Verify with: eas build:list');
          
          console.log('\n📤 Suggested command:');
          console.log(`   eas update --branch preview --message "Your update message"`);
          
          process.exit(0);
        } else {
          console.log('\n❌ INCOMPATIBLE: Changes likely require a new build');
          console.log('   → Native dependencies or configuration changed');
          console.log('   → Create a new build to be safe');
          
          console.log('\n🏗️  Suggested command:');
          console.log(`   eas build --platform ios --profile preview-device --message "Native changes"`);
          
          process.exit(1);
        }
      } else {
        console.log('\n🤔 Cannot determine compatibility without a reference build');
        console.log('   → Create your first build with:');
        console.log('   → eas build --platform ios --profile preview-device');
        process.exit(1);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking compatibility:', error.message);
    process.exit(1);
  }
}

checkCompatibility(); 