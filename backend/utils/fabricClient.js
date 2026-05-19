/**
 * Hyperledger Fabric Client Utility
 * 
 * Handles connection to Fabric network and transaction submission.
 * Includes fallback mode (database-only) when Fabric network is unavailable.
 */

'use strict';

const { Gateway, Wallets, DefaultQueryHandlerStrategies } = require('fabric-network');
const path = require('path');
const fs = require('fs');

// Configuration
const CHANNEL_NAME = process.env.FABRIC_CHANNEL || 'skchannel';
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

    // Check if identity exists in wallet (try admin first, fallback to appUser)
    let identityName = 'admin';
    let identity = await wallet.get(identityName);
    
    if (!identity) {
      console.warn('⚠️  Fabric identity "admin" not found, trying appUser...');
      identityName = 'appUser';
      identity = await wallet.get(identityName);
    }
    
    if (!identity) {
      console.warn('⚠️  No Fabric identity found in wallet');
      return null;
    }

    // Try with discovery disabled and explicit query handler
    gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: identityName,
      discovery: { enabled: false },
      queryHandlerOptions: {
        strategy: DefaultQueryHandlerStrategies.MSPID_SCOPE_SINGLE
      }
    });

    const network = await gateway.getNetwork(CHANNEL_NAME);
    contract = network.getContract(CHAINCODE_NAME);

    console.log(`✅ Connected to Fabric network as ${identityName}`);
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
 * Returns { txId, result } if Fabric is available, null otherwise
 */
async function submitTransaction(functionName, ...args) {
  if (!FABRIC_ENABLED || !contract) {
    return null; // Fallback: skip blockchain
  }

  try {
    const transaction = contract.createTransaction(functionName);
    const txId = transaction.getTransactionId();
    const result = await transaction.submit(...args);
    return { txId, result: result.toString() };
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
 * @param {string} kegiatanId - Kegiatan UUID
 * @param {number} dosenId - Dosen user ID
 * @param {string} fileHash - Document SHA-256 hash
 * @param {number} refKegiatanId - Reference kegiatan ID
 * @param {number} poinKum - Point value
 * @param {object} revisionInfo - Optional revision info {parentId, versi}
 * @returns {string|null} Transaction ID or null if Fabric unavailable
 */
async function recordKegiatanCreation(kegiatanId, dosenId, fileHash, refKegiatanId, poinKum, revisionInfo = null) {
  const timestamp = new Date().toISOString();
  
  const args = [
    kegiatanId,
    String(dosenId),
    fileHash,
    String(refKegiatanId),
    String(poinKum),
    timestamp
  ];
  
  // Add revision parameters if this is a revision
  if (revisionInfo && revisionInfo.parentId) {
    args.push(revisionInfo.parentId);
    args.push(String(revisionInfo.versi || 1));
  }
  
  const result = await submitTransaction('CreateKegiatan', ...args);
  return result ? result.txId : null;
}

/**
 * Record a verification action on the blockchain
 * @returns {string|null} Transaction ID or null if Fabric unavailable
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
  return result ? result.txId : null;
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

// ============================================
// USULAN KENAIKAN PANGKAT FUNCTIONS
// ============================================

/**
 * Record usulan creation on blockchain
 * @param {string} usulanId - UUID of usulan
 * @param {string} hashNIP - Hashed NIP
 * @param {number} totalKUM - Total KUM points
 * @param {string} jabatanTujuan - Target position
 * @param {string|null} idUsulanLama - Previous usulan ID if resubmission
 * @param {string} snapshotHash - SHA-256 hash of kegiatan snapshot
 * @returns {string|null} Transaction ID or null if Fabric unavailable
 */
async function recordUsulanCreation(usulanId, hashNIP, totalKUM, jabatanTujuan, idUsulanLama, snapshotHash) {
  const timestamp = new Date().toISOString();
  const result = await submitTransaction(
    'AjukanUsulanKenaikanPangkat',
    String(usulanId),
    hashNIP,
    String(totalKUM),
    jabatanTujuan,
    idUsulanLama ? String(idUsulanLama) : 'null',
    snapshotHash || '',
    timestamp
  );
  return result ? result.txId : null;
}

/**
 * Record usulan processing on blockchain
 * @returns {string|null} Transaction ID or null if Fabric unavailable
 */
async function recordUsulanProcess(usulanId, processedBy) {
  const timestamp = new Date().toISOString();
  const result = await submitTransaction(
    'ProsesUsulanKenaikanPangkat',
    String(usulanId),
    String(processedBy),
    timestamp
  );
  return result ? result.txId : null;
}

/**
 * Record usulan rejection on blockchain
 * @returns {string|null} Transaction ID or null if Fabric unavailable
 */
async function recordUsulanRejection(usulanId, processedBy, catatan) {
  const timestamp = new Date().toISOString();
  const result = await submitTransaction(
    'TolakUsulanKenaikanPangkat',
    String(usulanId),
    String(processedBy),
    catatan,
    timestamp
  );
  return result ? result.txId : null;
}

/**
 * Record SK issuance on blockchain
 * @returns {string|null} Transaction ID or null if Fabric unavailable
 */
async function recordUsulanSKIssued(usulanId, skHash, processedBy) {
  const timestamp = new Date().toISOString();
  const result = await submitTransaction(
    'TerbitkanSkKenaikanPangkat',
    String(usulanId),
    skHash,
    String(processedBy),
    timestamp
  );
  return result ? result.txId : null;
}

/**
 * Get usulan history from blockchain
 */
async function getUsulanHistory(usulanId) {
  const result = await evaluateTransaction('GetHistoriUsulan', String(usulanId));
  if (result) {
    return JSON.parse(result);
  }
  return null;
}

/**
 * Verify usulan snapshot integrity against blockchain
 * @param {string} usulanId - UUID of usulan
 * @param {string} calculatedHash - Hash calculated from current snapshot
 * @returns {object|null} Verification result or null if Fabric unavailable
 */
async function verifyUsulanSnapshot(usulanId, calculatedHash) {
  const result = await evaluateTransaction('VerifyUsulanSnapshot', String(usulanId), calculatedHash);
  if (result) {
    return JSON.parse(result);
  }
  return null;
}

// ============================================
// COUCHDB RICH QUERY FUNCTIONS
// ============================================

/**
 * Query kegiatan by dosen using CouchDB rich query
 * @param {number} dosenId - Dosen user ID
 * @returns {Array|null} Array of kegiatan records or null if Fabric unavailable
 */
async function queryKegiatanByDosen(dosenId) {
  const result = await evaluateTransaction('QueryKegiatanByDosen', String(dosenId));
  if (result) {
    return JSON.parse(result);
  }
  return null;
}

/**
 * Query kegiatan by status using CouchDB rich query
 * @param {string} status - Status value (unverified/verified/rejected/revision_requested)
 * @returns {Array|null} Array of kegiatan records or null if Fabric unavailable
 */
async function queryKegiatanByStatus(status) {
  const result = await evaluateTransaction('QueryKegiatanByStatus', status);
  if (result) {
    return JSON.parse(result);
  }
  return null;
}

/**
 * Query kegiatan by date range using CouchDB rich query
 * @param {string} startDate - Start date in ISO format
 * @param {string} endDate - End date in ISO format
 * @returns {Array|null} Array of kegiatan records or null if Fabric unavailable
 */
async function queryKegiatanByDateRange(startDate, endDate) {
  const result = await evaluateTransaction('QueryKegiatanByDateRange', startDate, endDate);
  if (result) {
    return JSON.parse(result);
  }
  return null;
}

/**
 * Query usulan by hashed NIP using CouchDB rich query
 * @param {string} hashNIP - Hashed NIP of dosen
 * @returns {Array|null} Array of usulan records or null if Fabric unavailable
 */
async function queryUsulanByHashNIP(hashNIP) {
  const result = await evaluateTransaction('QueryUsulanByHashNIP', hashNIP);
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
  recordUsulanCreation,
  recordUsulanProcess,
  recordUsulanRejection,
  recordUsulanSKIssued,
  getUsulanHistory,
  verifyUsulanSnapshot,
  // CouchDB rich query functions
  queryKegiatanByDosen,
  queryKegiatanByStatus,
  queryKegiatanByDateRange,
  queryUsulanByHashNIP,
};
