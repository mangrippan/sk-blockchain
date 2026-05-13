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
}

module.exports = KegiatanContract;
