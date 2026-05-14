'use strict';

const { Contract } = require('fabric-contract-api');

/**
 * KegiatanContract - Smart Contract for Kegiatan Dosen
 * 
 * Stores document hashes and kegiatan metadata on the blockchain
 * for tamper-proof audit trail and integrity verification.
 */
class KegiatanContract extends Contract {

  constructor() {
    super('KegiatanContract');
  }

  /**
   * InitLedger - Initialize the ledger with sample data (optional)
   */
  async InitLedger(ctx) {
    console.info('============= START : Initialize Ledger ===========');
    console.info('============= END : Initialize Ledger ===========');
  }

  /**
   * CreateKegiatan - Record a new kegiatan hash on the blockchain
   * 
   * @param {Context} ctx - Transaction context
   * @param {string} kegiatanId - UUID of the kegiatan (from PostgreSQL)
   * @param {string} dosenId - ID of the dosen who owns the kegiatan
   * @param {string} fileHash - SHA-256 hash of the uploaded document
   * @param {string} refKegiatanId - Reference kegiatan ID
   * @param {string} poinKum - Point value
   * @param {string} timestamp - ISO timestamp of creation
   */
  async CreateKegiatan(ctx, kegiatanId, dosenId, fileHash, refKegiatanId, poinKum, timestamp) {
    // Check if kegiatan already exists
    const exists = await this.KegiatanExists(ctx, kegiatanId);
    if (exists) {
      throw new Error(`Kegiatan ${kegiatanId} already exists`);
    }

    const kegiatan = {
      docType: 'kegiatan',
      id: kegiatanId,
      dosenId: dosenId,
      fileHash: fileHash,
      refKegiatanId: refKegiatanId,
      poinKum: parseFloat(poinKum),
      status: 'unverified',
      createdAt: timestamp,
      updatedAt: timestamp,
      verifiedBy: null,
      verifiedAt: null,
    };

    await ctx.stub.putState(kegiatanId, Buffer.from(JSON.stringify(kegiatan)));
    
    // Emit event for off-chain listeners
    ctx.stub.setEvent('KegiatanCreated', Buffer.from(JSON.stringify({
      id: kegiatanId,
      fileHash: fileHash,
      dosenId: dosenId,
    })));

    return JSON.stringify(kegiatan);
  }

  /**
   * ReadKegiatan - Retrieve kegiatan data from the blockchain
   * 
   * @param {Context} ctx - Transaction context
   * @param {string} kegiatanId - UUID of the kegiatan
   */
  async ReadKegiatan(ctx, kegiatanId) {
    const kegiatanJSON = await ctx.stub.getState(kegiatanId);
    if (!kegiatanJSON || kegiatanJSON.length === 0) {
      throw new Error(`Kegiatan ${kegiatanId} does not exist`);
    }
    return kegiatanJSON.toString();
  }

  /**
   * VerifyKegiatan - Update kegiatan status to verified/rejected
   * 
   * @param {Context} ctx - Transaction context
   * @param {string} kegiatanId - UUID of the kegiatan
   * @param {string} newStatus - New status (verified/rejected)
   * @param {string} verifiedBy - User ID who verified
   * @param {string} timestamp - ISO timestamp of verification
   */
  async VerifyKegiatan(ctx, kegiatanId, newStatus, verifiedBy, timestamp) {
    const kegiatanJSON = await ctx.stub.getState(kegiatanId);
    if (!kegiatanJSON || kegiatanJSON.length === 0) {
      throw new Error(`Kegiatan ${kegiatanId} does not exist`);
    }

    const kegiatan = JSON.parse(kegiatanJSON.toString());
    
    const oldStatus = kegiatan.status;
    kegiatan.status = newStatus;
    kegiatan.verifiedBy = verifiedBy;
    kegiatan.verifiedAt = timestamp;
    kegiatan.updatedAt = timestamp;

    await ctx.stub.putState(kegiatanId, Buffer.from(JSON.stringify(kegiatan)));

    ctx.stub.setEvent('KegiatanVerified', Buffer.from(JSON.stringify({
      id: kegiatanId,
      oldStatus: oldStatus,
      newStatus: newStatus,
      verifiedBy: verifiedBy,
    })));

    return JSON.stringify(kegiatan);
  }

  /**
   * GetHistory - Get the full transaction history for a kegiatan
   * This is the key blockchain advantage: immutable audit trail
   * 
   * @param {Context} ctx - Transaction context
   * @param {string} kegiatanId - UUID of the kegiatan
   */
  async GetHistory(ctx, kegiatanId) {
    const iterator = await ctx.stub.getHistoryForKey(kegiatanId);
    const history = [];

    let result = await iterator.next();
    while (!result.done) {
      const record = {
        txId: result.value.txId,
        timestamp: result.value.timestamp,
        isDelete: result.value.isDelete,
      };

      if (!result.value.isDelete) {
        try {
          record.value = JSON.parse(result.value.value.toString('utf8'));
        } catch (err) {
          record.value = result.value.value.toString('utf8');
        }
      }

      history.push(record);
      result = await iterator.next();
    }

    await iterator.close();
    return JSON.stringify(history);
  }

  /**
   * VerifyDocumentHash - Compare a document hash against the stored hash
   * 
   * @param {Context} ctx - Transaction context
   * @param {string} kegiatanId - UUID of the kegiatan
   * @param {string} documentHash - Hash to verify against stored hash
   */
  async VerifyDocumentHash(ctx, kegiatanId, documentHash) {
    const kegiatanJSON = await ctx.stub.getState(kegiatanId);
    if (!kegiatanJSON || kegiatanJSON.length === 0) {
      throw new Error(`Kegiatan ${kegiatanId} does not exist`);
    }

    const kegiatan = JSON.parse(kegiatanJSON.toString());
    const isValid = kegiatan.fileHash === documentHash;

    return JSON.stringify({
      kegiatanId: kegiatanId,
      storedHash: kegiatan.fileHash,
      providedHash: documentHash,
      isValid: isValid,
      message: isValid ? 'Document integrity verified' : 'Document has been tampered!',
    });
  }

  /**
   * KegiatanExists - Check if a kegiatan exists on the ledger
   * 
   * @param {Context} ctx - Transaction context
   * @param {string} kegiatanId - UUID of the kegiatan
   */
  async KegiatanExists(ctx, kegiatanId) {
    const kegiatanJSON = await ctx.stub.getState(kegiatanId);
    return kegiatanJSON && kegiatanJSON.length > 0;
  }

  /**
   * GetAllKegiatan - Get all kegiatan records (for admin/audit)
   * Uses range query with empty start/end keys
   */
  async GetAllKegiatan(ctx) {
    const iterator = await ctx.stub.getStateByRange('', '');
    const results = [];

    let result = await iterator.next();
    while (!result.done) {
      const strValue = Buffer.from(result.value.value).toString('utf8');
      try {
        const record = JSON.parse(strValue);
        if (record.docType === 'kegiatan') {
          results.push(record);
        }
      } catch (err) {
        // Skip non-JSON entries
      }
      result = await iterator.next();
    }

    await iterator.close();
    return JSON.stringify(results);
  }

  // ============================================================
  // USULAN KENAIKAN PANGKAT FUNCTIONS
  // ============================================================

  /**
   * Syarat KUM minimal per jabatan
   */
  _getMinKUM(jabatanTujuan) {
    const syarat = {
      'Asisten Ahli': 100,
      'Lektor': 200,
      'Lektor Kepala': 300,
      'Guru Besar': 400,
    };
    return syarat[jabatanTujuan] || 0;
  }

  /**
   * AjukanUsulanKenaikanPangkat - Record a new promotion request on blockchain
   * 
   * @param {Context} ctx
   * @param {string} usulanId - UUID of the usulan
   * @param {string} hashNIP - Hashed NIP of the dosen
   * @param {string} totalKUM - Total accumulated KUM points
   * @param {string} jabatanTujuan - Target position
   * @param {string} idUsulanLama - Previous rejected usulan ID (null if first time)
   * @param {string} timestamp - ISO timestamp
   */
  async AjukanUsulanKenaikanPangkat(ctx, usulanId, hashNIP, totalKUM, jabatanTujuan, idUsulanLama, timestamp) {
    const key = 'USULAN_' + usulanId;

    // Check if already exists
    const existing = await ctx.stub.getState(key);
    if (existing && existing.length > 0) {
      throw new Error(`Usulan ${usulanId} already exists`);
    }

    // Validate minimum KUM
    const minKUM = this._getMinKUM(jabatanTujuan);
    if (parseFloat(totalKUM) < minKUM) {
      throw new Error(`KUM tidak mencukupi. Minimal ${minKUM} untuk ${jabatanTujuan}, dimiliki: ${totalKUM}`);
    }

    // Versioning: if resubmitting after rejection
    if (idUsulanLama && idUsulanLama !== 'null') {
      const oldKey = 'USULAN_' + idUsulanLama;
      const oldData = await ctx.stub.getState(oldKey);
      if (oldData && oldData.length > 0) {
        const oldUsulan = JSON.parse(oldData.toString());
        if (oldUsulan.status !== 'rejected') {
          throw new Error(`Usulan lama ${idUsulanLama} belum berstatus rejected`);
        }
      }
    }

    const usulan = {
      docType: 'usulan',
      id: usulanId,
      hashNIP: hashNIP,
      totalKUM: parseFloat(totalKUM),
      jabatanTujuan: jabatanTujuan,
      status: 'pending',
      idUsulanLama: idUsulanLama !== 'null' ? idUsulanLama : null,
      skHash: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      processedBy: null,
      processedAt: null,
      catatanPenolakan: null,
    };

    await ctx.stub.putState(key, Buffer.from(JSON.stringify(usulan)));

    ctx.stub.setEvent('UsulanCreated', Buffer.from(JSON.stringify({
      id: usulanId,
      hashNIP: hashNIP,
      jabatanTujuan: jabatanTujuan,
    })));

    return JSON.stringify(usulan);
  }

  /**
   * ProsesUsulanKenaikanPangkat - Change status from Pending → Diproses
   */
  async ProsesUsulanKenaikanPangkat(ctx, usulanId, processedBy, timestamp) {
    const key = 'USULAN_' + usulanId;
    const data = await ctx.stub.getState(key);
    if (!data || data.length === 0) {
      throw new Error(`Usulan ${usulanId} does not exist`);
    }

    const usulan = JSON.parse(data.toString());
    if (usulan.status !== 'pending') {
      throw new Error(`Usulan ${usulanId} is not in pending status (current: ${usulan.status})`);
    }

    usulan.status = 'diproses';
    usulan.processedBy = processedBy;
    usulan.processedAt = timestamp;
    usulan.updatedAt = timestamp;

    await ctx.stub.putState(key, Buffer.from(JSON.stringify(usulan)));

    ctx.stub.setEvent('UsulanProcessed', Buffer.from(JSON.stringify({
      id: usulanId,
      status: 'diproses',
      processedBy: processedBy,
    })));

    return JSON.stringify(usulan);
  }

  /**
   * TolakUsulanKenaikanPangkat - Reject an usulan
   */
  async TolakUsulanKenaikanPangkat(ctx, usulanId, processedBy, catatanPenolakan, timestamp) {
    const key = 'USULAN_' + usulanId;
    const data = await ctx.stub.getState(key);
    if (!data || data.length === 0) {
      throw new Error(`Usulan ${usulanId} does not exist`);
    }

    const usulan = JSON.parse(data.toString());
    if (!['pending', 'diproses'].includes(usulan.status)) {
      throw new Error(`Usulan ${usulanId} cannot be rejected (current: ${usulan.status})`);
    }

    usulan.status = 'rejected';
    usulan.processedBy = processedBy;
    usulan.processedAt = timestamp;
    usulan.catatanPenolakan = catatanPenolakan;
    usulan.updatedAt = timestamp;

    await ctx.stub.putState(key, Buffer.from(JSON.stringify(usulan)));

    ctx.stub.setEvent('UsulanRejected', Buffer.from(JSON.stringify({
      id: usulanId,
      status: 'rejected',
      processedBy: processedBy,
    })));

    return JSON.stringify(usulan);
  }

  /**
   * TerbitkanSkKenaikanPangkat - Issue SK and lock hash on blockchain
   */
  async TerbitkanSkKenaikanPangkat(ctx, usulanId, skHash, processedBy, timestamp) {
    const key = 'USULAN_' + usulanId;
    const data = await ctx.stub.getState(key);
    if (!data || data.length === 0) {
      throw new Error(`Usulan ${usulanId} does not exist`);
    }

    const usulan = JSON.parse(data.toString());
    if (usulan.status !== 'diproses') {
      throw new Error(`Usulan ${usulanId} must be in 'diproses' status to issue SK (current: ${usulan.status})`);
    }

    usulan.status = 'sk_issued';
    usulan.skHash = skHash;
    usulan.processedBy = processedBy;
    usulan.processedAt = timestamp;
    usulan.updatedAt = timestamp;

    await ctx.stub.putState(key, Buffer.from(JSON.stringify(usulan)));

    ctx.stub.setEvent('SKIssued', Buffer.from(JSON.stringify({
      id: usulanId,
      skHash: skHash,
      processedBy: processedBy,
    })));

    return JSON.stringify(usulan);
  }

  /**
   * GetUsulan - Read usulan from blockchain (wraps GetAset for USULAN_ key)
   */
  async GetUsulan(ctx, usulanId) {
    const key = 'USULAN_' + usulanId;
    const data = await ctx.stub.getState(key);
    if (!data || data.length === 0) {
      throw new Error(`Usulan ${usulanId} does not exist`);
    }
    return data.toString();
  }

  /**
   * GetHistoriUsulan - Get full audit trail for an usulan
   */
  async GetHistoriUsulan(ctx, usulanId) {
    const key = 'USULAN_' + usulanId;
    return await this.GetHistory(ctx, key);
  }
}

module.exports = KegiatanContract;
