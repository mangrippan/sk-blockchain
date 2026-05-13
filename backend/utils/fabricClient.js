/**
 * Hyperledger Fabric Client Utility
 * 
 * Handles connection to Fabric network and transaction submission.
 * Includes fallback mode (database-only) when Fabric network is unavailable.
 */

'use strict';

const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

// Configuration
const CHANNEL_NAME = process.env.FABRIC_CHANNEL || 'mychannel';
const CHAINCODE_NAME = process.env.FABRIC_CHAINCODE || 'chainrank';
const FABRIC_ENABLED = process.env.FABRIC_ENABLED === 'true';
const CONNECTION_PROFILE_PATH = process.env.FABRIC_CONNECTION_PROFILE || 
  path.resolve(__dirname, '../../fabric-config/connection-org1.json');
const WALLET_PATH = process.env.FABRIC_WALLET_PATH ||
  path.resolve(__dirname, '../../fabric-config/wallet');

let gateway = null;
let contract = null;

/**
 * Check if Fabric integration is enabled
 */
function isFabricEnabled() {
  return FABRIC_ENABLED;
}

/**
 * Connect to Fabric network
 */
async function connectGateway() {
  if (!FABRIC_ENABLED) {
    console.log('⚠️  Fabric integration disabled (FABRIC_ENABLED=false)');
    return null;
  }

  try {
    // Check if connection profile exists
    if (!fs.existsSync(CONNECTION_PROFILE_PATH)) {
      console.warn('⚠️  Fabric connection profile not found:', CONNECTION_PROFILE_PATH);
      return null;
    }

    const ccp = JSON.parse(fs.readFileSync(CONNECTION_PROFILE_PATH, 'utf8'));
    const wallet = await Wallets.newFileSystemWallet(WALLET_PATH);

    // Check if identity exists in wallet
    const identity = await wallet.get('appUser');
    if (!identity) {
      console.warn('⚠️  Fabric identity "appUser" not found in wallet');
      return null;
    }

    gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: 'appUser',
      discovery: { enabled: true, asLocalhost: true },
    });

    const network = await gateway.getNetwork(CHANNEL_NAME);
    contract = network.getContract(CHAINCODE_NAME);

    console.log('✅ Connected to Fabric network');
    return contract;
  } catch (error) {
    console.error('❌ Failed to connect to Fabric network:', error.message);
    gateway = null;
    contract = null;
    return null;
  }
}

/**
 * Disconnect from Fabric network
 */
async function disconnectGateway() {
  if (gateway) {
    await gateway.disconnect();
    gateway = null;
    contract = null;
    console.log('📡 Disconnected from Fabric network');
  }
}

/**
 * Submit a transaction to the blockchain (write operation)
 * Returns null if Fabric is not available (fallback mode)
 */
async function submitTransaction(functionName, ...args) {
  if (!FABRIC_ENABLED || !contract) {
    return null; // Fallback: skip blockchain
  }

  try {
    const result = await contract.submitTransaction(functionName, ...args);
    return result.toString();
  } catch (error) {
    console.error(`❌ Fabric submitTransaction(${functionName}) failed:`, error.message);
    return null;
  }
}

/**
 * Evaluate a transaction (read-only query)
 * Returns null if Fabric is not available
 */
async function evaluateTransaction(functionName, ...args) {
  if (!FABRIC_ENABLED || !contract) {
    return null;
  }

  try {
    const result = await contract.evaluateTransaction(functionName, ...args);
    return result.toString();
  } catch (error) {
    console.error(`❌ Fabric evaluateTransaction(${functionName}) failed:`, error.message);
    return null;
  }
}

// ============================================
// HIGH-LEVEL BUSINESS FUNCTIONS
// ============================================

/**
 * Record a kegiatan creation on the blockchain
 * @returns {string|null} Transaction ID or null if Fabric unavailable
 */
async function recordKegiatanCreation(kegiatanId, dosenId, fileHash, refKegiatanId, poinKum) {
  const timestamp = new Date().toISOString();
  const result = await submitTransaction(
    'CreateKegiatan',
    kegiatanId,
    String(dosenId),
    fileHash,
    String(refKegiatanId),
    String(poinKum),
    timestamp
  );
  return result;
}

/**
 * Record a verification action on the blockchain
 * @returns {string|null} Result or null if Fabric unavailable
 */
async function recordKegiatanVerification(kegiatanId, newStatus, verifiedBy) {
  const timestamp = new Date().toISOString();
  const result = await submitTransaction(
    'VerifyKegiatan',
    kegiatanId,
    newStatus,
    String(verifiedBy),
    timestamp
  );
  return result;
}

/**
 * Get blockchain history for a kegiatan
 * @returns {Array|null} History array or null if Fabric unavailable
 */
async function getKegiatanHistory(kegiatanId) {
  const result = await evaluateTransaction('GetHistory', kegiatanId);
  if (result) {
    return JSON.parse(result);
  }
  return null;
}

/**
 * Verify document hash against blockchain record
 * @returns {object|null} Verification result or null if Fabric unavailable
 */
async function verifyDocumentHash(kegiatanId, documentHash) {
  const result = await evaluateTransaction('VerifyDocumentHash', kegiatanId, documentHash);
  if (result) {
    return JSON.parse(result);
  }
  return null;
}

module.exports = {
  isFabricEnabled,
  connectGateway,
  disconnectGateway,
  submitTransaction,
  evaluateTransaction,
  recordKegiatanCreation,
  recordKegiatanVerification,
  getKegiatanHistory,
  verifyDocumentHash,
};
