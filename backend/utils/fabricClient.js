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
let connectedIdentity = null;
let connectedAt = null;

// Tracks the outcome of the most recent transaction attempts so that
// getConnectionStatus() can reflect actual write/read capability instead of
// just the presence of cached gateway/contract objects (which stay non-null
// even after the underlying peer connection has gone stale).
let lastSuccessAt = null;
let lastFailureAt = null;
let lastError = null; // { message, code, at } — kept short, exposed via /system/status

// Periodic background probe so lastSuccessAt/lastFailureAt stay fresh even
// when no real user-triggered transaction has run recently -- this is what
// closes the gap where /system/status reported connected:true for >19 hours
// while every actual write silently failed (lastSuccessAt was simply never
// updated because nothing had been attempted since the last real success).
const LIVENESS_PROBE_INTERVAL_MS = parseInt(process.env.FABRIC_LIVENESS_INTERVAL_MS || '60000', 10);
const LIVENESS_STALE_THRESHOLD_MS = LIVENESS_PROBE_INTERVAL_MS * 3;
let livenessIntervalHandle = null;

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

    // Rewrite "localhost" to the IPv4 loopback literal so grpc-js connects
    // directly via its IP resolver, skipping DNS resolution altogether (a
    // harmless micro-optimization). TLS hostname verification still passes
    // via the profile's ssl-target-name-override/hostnameOverride.
    const ccpRaw = fs.readFileSync(CONNECTION_PROFILE_PATH, 'utf8').replace(/localhost/g, '127.0.0.1');
    const ccp = JSON.parse(ccpRaw);
    const wallet = await Wallets.newFileSystemWallet(WALLET_PATH);

    // Check if identity exists in wallet
    // SECURITY: Use appUser for normal operations (least privilege)
    // Only use admin for enrollment/maintenance tasks
    const preferredIdentity = process.env.FABRIC_USER_ID || 'appUser';
    let identityName = preferredIdentity;
    let identity = await wallet.get(identityName);
    
    if (!identity) {
      console.warn(`⚠️  Fabric identity "${preferredIdentity}" not found, trying admin...`);
      identityName = 'admin';
      identity = await wallet.get(identityName);
    }
    
    if (!identity) {
      console.warn('⚠️  No Fabric identity found in wallet');
      return null;
    }

    gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: identityName,
      discovery: {
        enabled: false,
        asLocalhost: true
      }
    });

    // gateway.connect() does not throw when the underlying peer/orderer gRPC
    // connections fail (e.g. TLS handshake rejected due to a stale CA cert in
    // the connection profile) -- it silently resolves with broken endpoints.
    // Verify every endorser/committer actually reached connected:true so
    // getConnectionStatus()/lastError reporting reflects reality.
    const network = await gateway.getNetwork(CHANNEL_NAME);
    const channel = network.getChannel();
    const endpoints = [...channel.getEndorsers(), ...channel.getCommitters()];
    const broken = endpoints.filter(ep => !ep.connected);
    if (broken.length > 0) {
      throw new Error(`${broken.length}/${endpoints.length} Fabric service endpoint(s) not connected: ${broken.map(ep => ep.name).join(', ')}`);
    }

    contract = network.getContract(CHAINCODE_NAME, 'KegiatanContract');

    connectedIdentity = identityName;
    connectedAt = new Date().toISOString();
    startLivenessProbe();
    console.log(`✅ Connected to Fabric network as ${identityName} (contract: KegiatanContract)`);
    return contract;
  } catch (error) {
    console.error('❌ Failed to connect to Fabric network:', error.message);
    gateway = null;
    contract = null;
    connectedIdentity = null;
    connectedAt = null;
    return null;
  }
}

/**
 * Disconnect from Fabric network
 */
/**
 * Periodically exercise a real peer round-trip (independent of whatever user
 * traffic is or isn't flowing) so lastSuccessAt/lastFailureAt/lastError never
 * go stale. KegiatanExists() is used as the probe target because it's a plain
 * getState() lookup that resolves to true/false and never throws "not found"
 * -- any outcome other than a clean resolve means the peer round-trip itself
 * is broken, which is exactly the liveness signal we want.
 */
function startLivenessProbe() {
  if (!FABRIC_ENABLED || livenessIntervalHandle) return;
  livenessIntervalHandle = setInterval(() => {
    evaluateTransaction('KegiatanExists', '__liveness_probe__').catch(() => {});
  }, LIVENESS_PROBE_INTERVAL_MS);
  // Don't let the probe keep the process alive on its own.
  if (typeof livenessIntervalHandle.unref === 'function') {
    livenessIntervalHandle.unref();
  }
}

function stopLivenessProbe() {
  if (livenessIntervalHandle) {
    clearInterval(livenessIntervalHandle);
    livenessIntervalHandle = null;
  }
}

/**
 * Get current Fabric connection status
 */
function getConnectionStatus() {
  // "Connected" requires three independent signals to agree right now:
  //   1. gateway/contract objects are cached (cheap, but stays non-null even
  //      after the underlying peer connection has gone stale -- insufficient
  //      on its own, see Finding #1 in docs/E2E_TEST_REPORT.md)
  //   2. the most recent real transaction attempt succeeded, AND
  //   3. that success is RECENT -- not just "happened at some point since
  //      startup". The periodic liveness probe (see startLivenessProbe)
  //      guarantees a real attempt lands at least every LIVENESS_PROBE_INTERVAL_MS,
  //      so a stale lastSuccessAt now means the chain itself stopped responding,
  //      not merely that nobody happened to submit a transaction recently.
  const successAgeMs = lastSuccessAt !== null ? (Date.now() - new Date(lastSuccessAt).getTime()) : Infinity;
  const recentlySuccessful = successAgeMs < LIVENESS_STALE_THRESHOLD_MS;
  const operational = recentlySuccessful &&
    (lastFailureAt === null || lastSuccessAt > lastFailureAt);
  return {
    enabled: FABRIC_ENABLED,
    connected: FABRIC_ENABLED && gateway !== null && contract !== null && operational,
    identity: connectedIdentity,
    channel: CHANNEL_NAME,
    chaincode: CHAINCODE_NAME,
    connectedAt,
    lastSuccessAt,
    lastFailureAt,
    lastError,
    livenessProbeIntervalMs: LIVENESS_PROBE_INTERVAL_MS,
  };
}

async function disconnectGateway() {
  stopLivenessProbe();
  if (gateway) {
    await gateway.disconnect();
    gateway = null;
    contract = null;
    console.log('📡 Disconnected from Fabric network');
  }
}

/**
 * Record a failed transaction attempt and tear down the (possibly broken)
 * gateway/contract so the next call goes through a fresh connectGateway().
 */
async function handleTransactionFailure(error) {
  lastFailureAt = new Date().toISOString();
  lastError = { message: error.message, code: error.code || null, at: lastFailureAt };
  try {
    await disconnectGateway();
  } catch (_) {
    // Disconnecting an already-broken gateway can itself throw — ignore so it
    // doesn't mask the original error, and fall through to the manual reset.
  }
  gateway = null;
  contract = null;
}

/**
 * Ensure contract is connected, reconnecting if necessary.
 * Returns the contract or null if unavailable.
 */
async function getContract() {
  if (!FABRIC_ENABLED) return null;
  if (contract) return contract;

  console.log('🔄 Fabric contract not connected, attempting reconnect...');
  await connectGateway();
  if (!contract) {
    console.warn('⚠️  Fabric reconnect failed, skipping blockchain operation');
  }
  return contract;
}

/**
 * Submit a transaction to the blockchain (write operation)
 * Returns { txId, result } if Fabric is available, null otherwise
 */
async function submitTransaction(functionName, ...args) {
  const activeContract = await getContract();
  if (!activeContract) return null;

  try {
    const transaction = activeContract.createTransaction(functionName);
    const txId = transaction.getTransactionId();
    const result = await transaction.submit(...args);
    lastSuccessAt = new Date().toISOString();
    return { txId, result: result.toString() };
  } catch (error) {
    console.error(`❌ Fabric submitTransaction(${functionName}) failed:`, error.message);
    // Log detailed peer responses for debugging
    if (error.responses) {
      error.responses.forEach((resp, i) => {
        console.error(`   Peer ${i} response:`, resp.response ? `status=${resp.response.status} message=${resp.response.message}` : resp);
      });
    }
    if (error.errors) {
      error.errors.forEach((err, i) => {
        console.error(`   Error ${i}:`, err.message || err);
      });
    }
    await handleTransactionFailure(error);
    return null;
  }
}

/**
 * Evaluate a transaction (read-only query)
 * Returns null if Fabric is not available
 */
async function evaluateTransaction(functionName, ...args) {
  const activeContract = await getContract();
  if (!activeContract) return null;

  try {
    const result = await activeContract.evaluateTransaction(functionName, ...args);
    lastSuccessAt = new Date().toISOString();
    return result.toString();
  } catch (error) {
    console.error(`❌ Fabric evaluateTransaction(${functionName}) failed:`, error.message);
    await handleTransactionFailure(error);
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

/**
 * Get usulan record from blockchain
 * @param {string} usulanId - UUID of usulan
 * @returns {object|null} Usulan record or null if Fabric unavailable
 */
async function getUsulan(usulanId) {
  const result = await evaluateTransaction('GetUsulan', String(usulanId));
  if (result) {
    return JSON.parse(result);
  }
  return null;
}

/**
 * Verify SK document hash integrity against blockchain
 * @param {string} usulanId - UUID of usulan
 * @param {string} skDocumentHash - SK document hash from database to verify
 * @returns {object|null} Verification result or null if Fabric unavailable
 */
async function verifySkHash(usulanId, skDocumentHash) {
  const result = await evaluateTransaction('VerifySkHash', String(usulanId), skDocumentHash);
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
  getConnectionStatus,
  connectGateway,
  disconnectGateway,
  getContract,
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
  getUsulan,
  verifyUsulanSnapshot,
  verifySkHash,
  // CouchDB rich query functions
  queryKegiatanByDosen,
  queryKegiatanByStatus,
  queryKegiatanByDateRange,
  queryUsulanByHashNIP,
};
