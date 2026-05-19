/**
 * Standalone test script to debug Fabric SDK connection
 * Run: node test-fabric-direct.js
 */

require('dotenv').config();
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

async function main() {
  console.log('=== Fabric Direct Test ===\n');
  
  // Load connection profile
  const ccpPath = path.resolve(__dirname, process.env.FABRIC_CONNECTION_PROFILE || '../fabric-config/connection-org1-wsl.json');
  console.log('Connection profile:', ccpPath);
  const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
  console.log('Peer URL:', ccp.peers['peer0.org1.example.com'].url);
  console.log('Has TLS cert:', !!ccp.peers['peer0.org1.example.com'].tlsCACerts);
  
  // Load wallet
  const walletPath = path.resolve(__dirname, process.env.FABRIC_WALLET_PATH || '../fabric-config/wallet');
  console.log('Wallet path:', walletPath);
  const wallet = await Wallets.newFileSystemWallet(walletPath);
  
  const identities = await wallet.list();
  console.log('Wallet identities:', identities);
  
  const identity = await wallet.get('admin');
  if (!identity) {
    console.error('ERROR: admin identity not found in wallet!');
    process.exit(1);
  }
  console.log('Identity found: admin\n');
  
  // Connect gateway
  console.log('Connecting gateway...');
  const gateway = new Gateway();
  await gateway.connect(ccp, {
    wallet,
    identity: 'admin',
    discovery: { enabled: false, asLocalhost: true }
  });
  console.log('Gateway connected!\n');
  
  // Get network and contract
  const network = await gateway.getNetwork('skchannel');
  console.log('Network (skchannel) obtained');
  
  const contract = network.getContract('chainrank', 'KegiatanContract');
  console.log('Contract obtained (chainrank/KegiatanContract)\n');
  
  // Try to submit transaction
  console.log('=== Submitting CreateKegiatan ===');
  const testId = `test-direct-${Date.now()}`;
  const args = [testId, 'user-test', 'hash-test-123', '1', '4.0', 'Direct test'];
  console.log('Args:', args);
  
  try {
    const transaction = contract.createTransaction('CreateKegiatan');
    const txId = transaction.getTransactionId();
    console.log('Transaction ID:', txId);
    console.log('Submitting...');
    
    const result = await transaction.submit(...args);
    console.log('\n✅ SUCCESS!');
    console.log('Result:', result.toString());
    console.log('TxId:', txId);
  } catch (error) {
    console.error('\n❌ FAILED!');
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    
    // Dump all error properties
    console.error('\nFull error properties:');
    for (const key of Object.getOwnPropertyNames(error)) {
      if (key === 'stack') continue;
      const val = error[key];
      if (typeof val === 'object' && val !== null) {
        console.error(`  ${key}:`, JSON.stringify(val, null, 2).substring(0, 500));
      } else {
        console.error(`  ${key}:`, val);
      }
    }
    
    // Check for responses
    if (error.responses) {
      console.error('\nPeer responses:');
      error.responses.forEach((r, i) => {
        console.error(`  Peer ${i}:`, JSON.stringify(r, null, 2).substring(0, 300));
      });
    }
    
    // Check for errors array
    if (error.errors) {
      console.error('\nErrors array:');
      error.errors.forEach((e, i) => {
        console.error(`  ${i}:`, e.message || JSON.stringify(e).substring(0, 200));
      });
    }
  }
  
  await gateway.disconnect();
  console.log('\nGateway disconnected.');
}

main().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
