/**
 * Blockchain Reconciliation Job
 *
 * Periodically cross-checks the database against the expectation that certain
 * lifecycle transitions (kegiatan verification, usulan submit/proses/reject/SK
 * issuance) always produce an on-chain transaction. A record whose status
 * implies the write happened, but whose tx_id_fabric is still NULL, is a sign
 * that a blockchain write silently failed -- exactly the failure mode
 * documented as Finding #1 in docs/E2E_TEST_REPORT.md (status indicator
 * reported "connected" for >19 hours while every write failed underneath it).
 *
 * This job only logs findings -- it deliberately does not retry or mutate any
 * data, since "the on-chain write failed at the time" is itself the fact worth
 * surfacing to operators, not something to silently paper over after the fact.
 */

'use strict';

const { pool } = require('../config/database');
const fabricClient = require('./fabricClient');

const RECONCILE_INTERVAL_MS = parseInt(
  process.env.BLOCKCHAIN_RECONCILE_INTERVAL_MS || String(15 * 60 * 1000),
  10
);
const INITIAL_DELAY_MS = 30_000; // let the Fabric gateway finish connecting first

let reconcileIntervalHandle = null;

async function findMissingTxRecords() {
  const [kegiatanResult, usulanResult] = await Promise.all([
    pool.query(
      `SELECT id, status, verified_at
       FROM sk.kegiatan_dosen
       WHERE status = 'verified' AND tx_id_fabric IS NULL AND deleted_at IS NULL
       ORDER BY verified_at DESC
       LIMIT 50`
    ),
    pool.query(
      `SELECT id, status, updated_at
       FROM sk.usulan_kenaikan_pangkat
       WHERE status IN ('pending', 'diproses', 'rejected', 'sk_issued')
         AND tx_id_fabric IS NULL
         AND deleted_at IS NULL
       ORDER BY updated_at DESC
       LIMIT 50`
    ),
  ]);
  return { kegiatan: kegiatanResult.rows, usulan: usulanResult.rows };
}

async function runReconciliationCheck() {
  if (!fabricClient.isFabricEnabled()) return;

  try {
    const { kegiatan, usulan } = await findMissingTxRecords();
    const total = kegiatan.length + usulan.length;

    if (total === 0) {
      console.log('🔎 Blockchain reconciliation: no DB↔chain gaps found (all expected on-chain writes have a tx_id_fabric)');
      return;
    }

    console.warn(`⚠️  Blockchain reconciliation found ${total} record(s) whose status implies an on-chain write occurred, but tx_id_fabric IS NULL:`);
    kegiatan.forEach((k) => console.warn(`   - kegiatan_dosen ${k.id}: status=${k.status}, verified_at=${k.verified_at?.toISOString?.() || k.verified_at}`));
    usulan.forEach((u) => console.warn(`   - usulan_kenaikan_pangkat ${u.id}: status=${u.status}, updated_at=${u.updated_at?.toISOString?.() || u.updated_at}`));
    console.warn('   This indicates a blockchain write silently failed at the time of the transition (see docs/E2E_TEST_REPORT.md, Finding #1). Check backend logs around those timestamps for "Fabric submitTransaction(...) failed" entries.');
  } catch (err) {
    console.error('❌ Blockchain reconciliation check failed:', err.message);
  }
}

function startReconciliationJob() {
  if (reconcileIntervalHandle || !fabricClient.isFabricEnabled()) return;

  const initialTimer = setTimeout(runReconciliationCheck, INITIAL_DELAY_MS);
  if (typeof initialTimer.unref === 'function') initialTimer.unref();

  reconcileIntervalHandle = setInterval(runReconciliationCheck, RECONCILE_INTERVAL_MS);
  if (typeof reconcileIntervalHandle.unref === 'function') reconcileIntervalHandle.unref();

  console.log(`🔎 Blockchain reconciliation job scheduled (every ${Math.round(RECONCILE_INTERVAL_MS / 60000)} min)`);
}

function stopReconciliationJob() {
  if (reconcileIntervalHandle) {
    clearInterval(reconcileIntervalHandle);
    reconcileIntervalHandle = null;
  }
}

module.exports = {
  runReconciliationCheck,
  startReconciliationJob,
  stopReconciliationJob,
};
