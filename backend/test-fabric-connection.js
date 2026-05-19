/**
 * Quick Fabric Connection Test
 * Run: node test-fabric-connection.js
 */

require('dotenv').config();
const fabricClient = require('./utils/fabricClient');

async function testFabricConnection() {
  console.log('\n🔍 Testing Fabric Connection...\n');
  console.log('Environment Variables:');
  console.log(`- FABRIC_ENABLED: ${process.env.FABRIC_ENABLED}`);
  console.log(`- FABRIC_CHANNEL: ${process.env.FABRIC_CHANNEL}`);
  console.log(`- FABRIC_CHAINCODE: ${process.env.FABRIC_CHAINCODE}`);
  
  try {
    console.log('\n⏱️  Attempting to connect to Fabric network...');
    const startTime = Date.now();
    
    await fabricClient.connectGateway();
    
    const connectTime = Date.now() - startTime;
    console.log(`✅ Connected successfully in ${connectTime}ms`);
    
    // Test a simple transaction
    console.log('\n⏱️  Testing transaction (CreateKegiatan)...');
    const txStartTime = Date.now();
    
    const testKegiatanId = 'test-' + Date.now();
    const txId = await fabricClient.recordKegiatanCreation(
      testKegiatanId,
      1,
      'test-hash-' + Date.now(),
      1,
      5.0
    );
    
    const txTime = Date.now() - txStartTime;
    
    if (txId) {
      console.log(`✅ Transaction submitted successfully in ${txTime}ms`);
      console.log(`   Transaction ID: ${txId}`);
    } else {
      console.log(`⚠️  Transaction returned null (Fabric disabled or failed) - took ${txTime}ms`);
    }
    
    await fabricClient.disconnectGateway();
    console.log('\n✅ Test completed!\n');
    
    if (txTime > 30000) {
      console.log('⚠️  WARNING: Transaction took more than 30 seconds!');
      console.log('   This explains why SK issuance is slow.');
      console.log('   Possible causes:');
      console.log('   - Network latency');
      console.log('   - Peer nodes busy/slow');
      console.log('   - Chaincode execution delay');
      console.log('   - Docker resource constraints');
    }
    
  } catch (error) {
    console.error('\n❌ Error during test:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testFabricConnection()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
