/**
 * Test Chaincode Invocation
 * Tests CreateKegiatan function via Fabric SDK
 */

// Load environment variables FIRST
require('dotenv').config();

const fabricClient = require('./utils/fabricClient');
const crypto = require('crypto');

async function testChaincode() {
  console.log('🧪 Testing Chaincode Invocation...\n');

  try {
    // Connect to Fabric
    console.log('📡 Connecting to Fabric network...');
    await fabricClient.connectGateway();

    // Test data
    const testKegiatan = {
      id: 'TEST-KEG-' + Date.now(),
      dosenId: '1',
      fileHash: crypto.createHash('sha256').update('test-file-content').digest('hex'),
      refKegiatanId: '1',
      poinKum: '15.5',
      timestamp: new Date().toISOString()
    };

    console.log('\n📝 Test Data:');
    console.log('   ID:', testKegiatan.id);
    console.log('   Dosen ID:', testKegiatan.dosenId);
    console.log('   File Hash:', testKegiatan.fileHash.substring(0, 16) + '...');
    console.log('   Poin KUM:', testKegiatan.poinKum);

    // Invoke CreateKegiatan
    console.log('\n🚀 Invoking CreateKegiatan...');
    const result = await fabricClient.submitTransaction(
      'CreateKegiatan',
      testKegiatan.id,
      testKegiatan.dosenId,
      testKegiatan.fileHash,
      testKegiatan.refKegiatanId,
      testKegiatan.poinKum,
      testKegiatan.timestamp
    );

    console.log('✅ Transaction submitted successfully!');
    if (result) {
      console.log('📄 Result:', result);
    }

    // Query the created kegiatan
    console.log('\n🔍 Querying created kegiatan...');
    const queryResult = await fabricClient.evaluateTransaction(
      'ReadKegiatan',
      testKegiatan.id
    );

    if (queryResult) {
      const kegiatan = JSON.parse(queryResult);
      console.log('✅ Kegiatan retrieved from blockchain:');
      console.log('   ID:', kegiatan.id);
      console.log('   File Hash:', kegiatan.fileHash.substring(0, 16) + '...');
      console.log('   Status:', kegiatan.status);
      console.log('   Poin KUM:', kegiatan.poinKum);
      console.log('   Created At:', kegiatan.createdAt);
    }

    // Test GetKegiatanHistory
    console.log('\n📜 Testing GetKegiatanHistory...');
    const historyResult = await fabricClient.evaluateTransaction(
      'GetKegiatanHistory',
      testKegiatan.id
    );

    if (historyResult) {
      const history = JSON.parse(historyResult);
      console.log('✅ History entries:', history.length);
      if (history.length > 0) {
        console.log('   Latest entry:');
        console.log('     TxId:', history[0].txId.substring(0, 16) + '...');
        console.log('     Timestamp:', history[0].timestamp);
        console.log('     IsDelete:', history[0].isDelete);
      }
    }

    console.log('\n🎉 All chaincode tests passed!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    // Disconnect
    await fabricClient.disconnectGateway();
  }
}

// Run test
testChaincode()
  .then(() => {
    console.log('\n✅ Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
