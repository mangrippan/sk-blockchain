'use strict';

const KegiatanContract = require('../lib/kegiatanContract');

// Mock ChaincodeStub
class MockStub {
  constructor() {
    this.state = {};
    this.events = [];
    this.historyData = [];
    this.lastHistoryKey = null;
    this._queryResults = [];
    this.lastQueryString = null;
  }

  async getState(key) {
    const val = this.state[key];
    if (!val) return Buffer.from('');
    return Buffer.from(val);
  }

  async putState(key, value) {
    this.state[key] = value.toString();
  }

  setEvent(name, payload) {
    this.events.push({ name, payload: JSON.parse(payload.toString()) });
  }

  async getHistoryForKey(key) {
    this.lastHistoryKey = key;
    let index = 0;
    const data = this.historyData;
    return {
      next: async () => {
        if (index < data.length) {
          return { value: data[index++], done: false };
        }
        return { value: null, done: true };
      },
      close: async () => {},
    };
  }

  async getStateByRange(start, end) {
    const entries = Object.entries(this.state).map(([key, val]) => ({
      value: { key, value: Buffer.from(val) },
    }));
    let index = 0;
    return {
      next: async () => {
        if (index < entries.length) {
          return { value: entries[index++].value, done: false };
        }
        return { value: null, done: true };
      },
      close: async () => {},
    };
  }

  // Register canned results for a CouchDB rich query (MockStub cannot run real
  // CouchDB selector matching). `records` is an array of { key, value } where
  // `value` is a plain object that will be JSON-stringified, mirroring how
  // CouchDB stores documents.
  setQueryResult(records) {
    this._queryResults = records.map(({ key, value }) => ({
      key,
      value: Buffer.from(JSON.stringify(value)),
    }));
  }

  async getQueryResult(queryString) {
    this.lastQueryString = queryString;
    const entries = this._queryResults.map(({ key, value }) => ({ value: { key, value } }));
    let index = 0;
    return {
      next: async () => {
        if (index < entries.length) {
          return { value: entries[index++].value, done: false };
        }
        return { value: null, done: true };
      },
      close: async () => {},
    };
  }
}

// Mock client identity, mirroring the surface of fabric-shim's ClientIdentity
// that _checkRole() relies on: getAttributeValue (returns the cert attribute or
// null if absent — see fabric-shim/lib/chaincode.js), getMSPID, getIDBytes.
function createClientIdentity({ role, mspId, idBytesContainsAdmin } = {}) {
  return {
    getAttributeValue: (attrName) => {
      if (attrName === 'role') {
        return role === undefined ? null : role;
      }
      return null;
    },
    getMSPID: () => (mspId !== undefined ? mspId : 'Org1MSP'),
    // Only identities explicitly marked idBytesContainsAdmin: true look like a
    // legacy admin cert. This matters for the catch-block fallback in
    // _checkRole: a present-but-disallowed role (e.g. 'mahasiswa') must NOT
    // also resolve as a legacy Org1MSP admin, or the "Access denied" path can
    // never be observed.
    getIDBytes: () => Buffer.from(
      idBytesContainsAdmin === true
        ? 'x509::CN=admin,OU=client'
        : 'x509::CN=someuser,OU=client'
    ),
    getID: () => 'x509::mock-identity',
  };
}

// Mock transaction context. Pass `identity` to control ctx.clientIdentity:
//   createContext()                       -> no clientIdentity (methods that don't call _checkRole)
//   createContext({ role: 'admin_sdm' })  -> role attribute present & allowed
//   createContext({ role: 'mahasiswa' })  -> role attribute present but not allowed -> "Access denied"
//   createContext({ legacyAdmin: true })  -> no role attr, MSP=Org1MSP, IDBytes contains 'admin' -> superadmin fallback
//   createContext({ legacyAdmin: false }) -> no role attr, MSP=Org1MSP, IDBytes without 'admin' -> "Authorization failed"
function createContext(identity) {
  const stub = new MockStub();
  const ctx = { stub };

  if (identity && identity.legacyAdmin !== undefined) {
    ctx.clientIdentity = createClientIdentity({
      mspId: 'Org1MSP',
      idBytesContainsAdmin: identity.legacyAdmin,
    });
  } else if (identity && 'role' in identity) {
    ctx.clientIdentity = createClientIdentity({ role: identity.role });
  }

  return ctx;
}

// Attach/replace ctx.clientIdentity on an already-built ctx — handy inside a
// describe block's beforeEach where ctx was created via the bare createContext().
function setIdentity(ctx, options) {
  if (options && options.legacyAdmin !== undefined) {
    ctx.clientIdentity = createClientIdentity({
      mspId: 'Org1MSP',
      idBytesContainsAdmin: options.legacyAdmin,
    });
  } else {
    ctx.clientIdentity = createClientIdentity({ role: options ? options.role : undefined });
  }
  return ctx;
}

describe('KegiatanContract', () => {
  let contract;
  let ctx;

  beforeEach(() => {
    contract = new KegiatanContract();
    ctx = createContext();
  });

  // ==========================================
  // KEGIATAN TESTS
  // ==========================================

  describe('CreateKegiatan', () => {
    it('should create a new kegiatan', async () => {
      const result = await contract.CreateKegiatan(
        ctx, 'kg-001', 'dosen-1', 'abc123hash', 'ref-1', '10', '2026-01-01T00:00:00Z'
      );
      const kegiatan = JSON.parse(result);

      expect(kegiatan.id).toBe('kg-001');
      expect(kegiatan.dosenId).toBe('dosen-1');
      expect(kegiatan.fileHash).toBe('abc123hash');
      expect(kegiatan.poinKum).toBe(10);
      expect(kegiatan.status).toBe('unverified');
    });

    it('should emit KegiatanCreated event', async () => {
      await contract.CreateKegiatan(
        ctx, 'kg-001', 'dosen-1', 'abc123hash', 'ref-1', '10', '2026-01-01T00:00:00Z'
      );

      expect(ctx.stub.events).toHaveLength(1);
      expect(ctx.stub.events[0].name).toBe('KegiatanCreated');
      expect(ctx.stub.events[0].payload.id).toBe('kg-001');
    });

    it('should throw if kegiatan already exists', async () => {
      await contract.CreateKegiatan(
        ctx, 'kg-001', 'dosen-1', 'abc123hash', 'ref-1', '10', '2026-01-01T00:00:00Z'
      );

      await expect(
        contract.CreateKegiatan(ctx, 'kg-001', 'dosen-1', 'xyz', 'ref-1', '5', '2026-01-02T00:00:00Z')
      ).rejects.toThrow('Kegiatan kg-001 already exists');
    });
  });

  describe('ReadKegiatan', () => {
    it('should read an existing kegiatan', async () => {
      await contract.CreateKegiatan(
        ctx, 'kg-001', 'dosen-1', 'abc123hash', 'ref-1', '10', '2026-01-01T00:00:00Z'
      );

      const result = await contract.ReadKegiatan(ctx, 'kg-001');
      const kegiatan = JSON.parse(result);
      expect(kegiatan.id).toBe('kg-001');
      expect(kegiatan.fileHash).toBe('abc123hash');
    });

    it('should throw if kegiatan does not exist', async () => {
      await expect(
        contract.ReadKegiatan(ctx, 'nonexistent')
      ).rejects.toThrow('Kegiatan nonexistent does not exist');
    });
  });

  describe('VerifyKegiatan', () => {
    beforeEach(async () => {
      // VerifyKegiatan is role-gated (_checkRole) — give ctx an allowed identity
      // so these tests exercise the business logic, not the access-control branch
      // (that gets its own dedicated coverage in the "_checkRole access control" block).
      setIdentity(ctx, { role: 'admin_sdm' });
      await contract.CreateKegiatan(
        ctx, 'kg-001', 'dosen-1', 'abc123hash', 'ref-1', '10', '2026-01-01T00:00:00Z'
      );
    });

    it('should verify a kegiatan', async () => {
      const result = await contract.VerifyKegiatan(
        ctx, 'kg-001', 'verified', 'admin-1', '2026-01-02T00:00:00Z'
      );
      const kegiatan = JSON.parse(result);

      expect(kegiatan.status).toBe('verified');
      expect(kegiatan.verifiedBy).toBe('admin-1');
      expect(kegiatan.verifiedAt).toBe('2026-01-02T00:00:00Z');
    });

    it('should reject a kegiatan', async () => {
      const result = await contract.VerifyKegiatan(
        ctx, 'kg-001', 'rejected', 'admin-1', '2026-01-02T00:00:00Z'
      );
      const kegiatan = JSON.parse(result);
      expect(kegiatan.status).toBe('rejected');
    });

    it('should emit KegiatanVerified event', async () => {
      await contract.VerifyKegiatan(ctx, 'kg-001', 'verified', 'admin-1', '2026-01-02T00:00:00Z');

      const event = ctx.stub.events.find(e => e.name === 'KegiatanVerified');
      expect(event).toBeDefined();
      expect(event.payload.oldStatus).toBe('unverified');
      expect(event.payload.newStatus).toBe('verified');
    });

    it('should throw if kegiatan does not exist', async () => {
      await expect(
        contract.VerifyKegiatan(ctx, 'nonexistent', 'verified', 'admin-1', '2026-01-02T00:00:00Z')
      ).rejects.toThrow('Kegiatan nonexistent does not exist');
    });
  });

  describe('_checkRole access control', () => {
    // VerifyKegiatan is used as the canonical representative: all 5 role-gated
    // methods (VerifyKegiatan, GetAllKegiatan, ProsesUsulanKenaikanPangkat,
    // TolakUsulanKenaikanPangkat, TerbitkanSkKenaikanPangkat) call the exact
    // same this._checkRole(ctx, ['admin_sdm', 'pimpinan', 'superadmin']), so
    // exercising every branch here once covers the access-control logic shared
    // by all of them.
    beforeEach(async () => {
      await contract.CreateKegiatan(
        ctx, 'kg-001', 'dosen-1', 'abc123hash', 'ref-1', '10', '2026-01-01T00:00:00Z'
      );
    });

    it('should allow access when role is admin_sdm', async () => {
      setIdentity(ctx, { role: 'admin_sdm' });
      const result = await contract.VerifyKegiatan(ctx, 'kg-001', 'verified', 'admin-1', '2026-01-02T00:00:00Z');
      expect(JSON.parse(result).status).toBe('verified');
    });

    it('should allow access when role is pimpinan', async () => {
      setIdentity(ctx, { role: 'pimpinan' });
      const result = await contract.VerifyKegiatan(ctx, 'kg-001', 'verified', 'pimpinan-1', '2026-01-02T00:00:00Z');
      expect(JSON.parse(result).status).toBe('verified');
    });

    it('should deny access when role is present but not in the allowed list', async () => {
      setIdentity(ctx, { role: 'mahasiswa' });
      await expect(
        contract.VerifyKegiatan(ctx, 'kg-001', 'verified', 'mahasiswa-1', '2026-01-02T00:00:00Z')
      ).rejects.toThrow('Access denied');
    });

    it('should deny access when there is no role attribute and the identity is not a legacy Org1MSP admin', async () => {
      setIdentity(ctx, { legacyAdmin: false });
      await expect(
        contract.VerifyKegiatan(ctx, 'kg-001', 'verified', 'someone', '2026-01-02T00:00:00Z')
      ).rejects.toThrow('Authorization failed');
    });

    it('should allow a legacy Org1MSP admin identity without a role attribute (backward compatibility)', async () => {
      setIdentity(ctx, { legacyAdmin: true });
      const result = await contract.VerifyKegiatan(ctx, 'kg-001', 'verified', 'admin-legacy', '2026-01-02T00:00:00Z');
      expect(JSON.parse(result).status).toBe('verified');
    });
  });

  describe('VerifyDocumentHash', () => {
    beforeEach(async () => {
      await contract.CreateKegiatan(
        ctx, 'kg-001', 'dosen-1', 'abc123hash', 'ref-1', '10', '2026-01-01T00:00:00Z'
      );
    });

    it('should return valid for matching hash', async () => {
      const result = await contract.VerifyDocumentHash(ctx, 'kg-001', 'abc123hash');
      const verification = JSON.parse(result);

      expect(verification.isValid).toBe(true);
      expect(verification.message).toBe('Document integrity verified');
    });

    it('should return invalid for mismatched hash', async () => {
      const result = await contract.VerifyDocumentHash(ctx, 'kg-001', 'tampered-hash');
      const verification = JSON.parse(result);

      expect(verification.isValid).toBe(false);
      expect(verification.message).toBe('Document has been tampered!');
    });

    it('should throw if kegiatan does not exist', async () => {
      await expect(
        contract.VerifyDocumentHash(ctx, 'nonexistent', 'hash')
      ).rejects.toThrow('Kegiatan nonexistent does not exist');
    });
  });

  describe('GetHistory', () => {
    it('should return history for a kegiatan', async () => {
      ctx.stub.historyData = [
        {
          txId: 'tx-001',
          timestamp: { seconds: { low: 1700000000 } },
          isDelete: false,
          value: Buffer.from(JSON.stringify({ id: 'kg-001', status: 'unverified' })),
        },
        {
          txId: 'tx-002',
          timestamp: { seconds: { low: 1700001000 } },
          isDelete: false,
          value: Buffer.from(JSON.stringify({ id: 'kg-001', status: 'verified' })),
        },
      ];

      const result = await contract.GetHistory(ctx, 'kg-001');
      const history = JSON.parse(result);

      expect(history).toHaveLength(2);
      expect(history[0].txId).toBe('tx-001');
      expect(history[1].value.status).toBe('verified');
    });
  });

  describe('GetAllKegiatan', () => {
    it('should return all kegiatan records', async () => {
      // GetAllKegiatan is role-gated (_checkRole) — needs an allowed identity.
      setIdentity(ctx, { role: 'admin_sdm' });
      await contract.CreateKegiatan(ctx, 'kg-001', 'dosen-1', 'h1', 'ref-1', '10', '2026-01-01T00:00:00Z');
      await contract.CreateKegiatan(ctx, 'kg-002', 'dosen-2', 'h2', 'ref-2', '20', '2026-01-02T00:00:00Z');

      const result = await contract.GetAllKegiatan(ctx);
      const records = JSON.parse(result);

      expect(records).toHaveLength(2);
    });
  });

  // ==========================================
  // USULAN KENAIKAN PANGKAT TESTS
  // ==========================================

  describe('AjukanUsulanKenaikanPangkat', () => {
    it('should create a new usulan', async () => {
      const result = await contract.AjukanUsulanKenaikanPangkat(
        ctx, 'usl-001', 'hashNIP123', '250', 'Lektor', 'null', 'snap-hash-usl-001', '2026-01-01T00:00:00Z'
      );
      const usulan = JSON.parse(result);

      expect(usulan.id).toBe('usl-001');
      expect(usulan.hashNIP).toBe('hashNIP123');
      expect(usulan.totalKUM).toBe(250);
      expect(usulan.jabatanTujuan).toBe('Lektor');
      expect(usulan.status).toBe('pending');
      expect(usulan.idUsulanLama).toBeNull();
      // Regression check for the 7-arg signature (usulanId, hashNIP, totalKUM,
      // jabatanTujuan, idUsulanLama, snapshotHash, timestamp): snapshotHash and
      // createdAt are the two fields that silently absorbed a shifted argument
      // when a call passed only 6 args — no prior assertion caught it.
      expect(usulan.snapshotHash).toBe('snap-hash-usl-001');
      expect(usulan.createdAt).toBe('2026-01-01T00:00:00Z');
    });

    it('should record kumMeetRequirement=false when KUM is insufficient (no throw — app layer validates)', async () => {
      // The chaincode deliberately does NOT reject low-KUM proposals (see the
      // comment at kegiatanContract.js:319-320) — it records kumMeetRequirement
      // for the audit trail and lets the application layer enforce the rule
      // (backend/routes/v1/usulan.js already returns HTTP 400 "Insufficient KUM"
      // before the chaincode is ever invoked).
      const result = await contract.AjukanUsulanKenaikanPangkat(
        ctx, 'usl-001', 'hashNIP', '50', 'Lektor', 'null', 'snap-hash-usl-001', '2026-01-01T00:00:00Z'
      );
      const usulan = JSON.parse(result);

      expect(usulan.kumMeetRequirement).toBe(false);
      expect(usulan.totalKUM).toBe(50);
      expect(usulan.status).toBe('pending');
    });

    it('should throw if usulan already exists', async () => {
      await contract.AjukanUsulanKenaikanPangkat(
        ctx, 'usl-001', 'hashNIP', '250', 'Lektor', 'null', 'snap-hash-usl-001', '2026-01-01T00:00:00Z'
      );

      await expect(
        contract.AjukanUsulanKenaikanPangkat(
          ctx, 'usl-001', 'hashNIP', '250', 'Lektor', 'null', 'snap-hash-usl-001', '2026-01-02T00:00:00Z'
        )
      ).rejects.toThrow('Usulan usl-001 already exists');
    });

    it('should allow resubmission if old usulan was rejected', async () => {
      // ProsesUsulanKenaikanPangkat/TolakUsulanKenaikanPangkat below are role-gated.
      setIdentity(ctx, { role: 'admin_sdm' });

      // Create and reject old usulan
      await contract.AjukanUsulanKenaikanPangkat(
        ctx, 'usl-old', 'hashNIP', '250', 'Lektor', 'null', 'snap-hash-usl-old', '2026-01-01T00:00:00Z'
      );
      await contract.ProsesUsulanKenaikanPangkat(ctx, 'usl-old', 'admin-1', '2026-01-02T00:00:00Z');
      // Need to manually set to rejected since ProsesUsulan sets to 'diproses'
      await contract.TolakUsulanKenaikanPangkat(
        ctx, 'usl-old', 'admin-1', 'Dokumen kurang', '2026-01-03T00:00:00Z'
      );

      // Resubmit with reference to old
      const result = await contract.AjukanUsulanKenaikanPangkat(
        ctx, 'usl-new', 'hashNIP', '250', 'Lektor', 'usl-old', 'snap-hash-usl-new', '2026-01-04T00:00:00Z'
      );
      const usulan = JSON.parse(result);
      expect(usulan.idUsulanLama).toBe('usl-old');
    });

    it('should throw if old usulan is not rejected', async () => {
      await contract.AjukanUsulanKenaikanPangkat(
        ctx, 'usl-old', 'hashNIP', '250', 'Lektor', 'null', 'snap-hash-usl-old', '2026-01-01T00:00:00Z'
      );

      await expect(
        contract.AjukanUsulanKenaikanPangkat(
          ctx, 'usl-new', 'hashNIP', '250', 'Lektor', 'usl-old', 'snap-hash-usl-new', '2026-01-02T00:00:00Z'
        )
      ).rejects.toThrow('belum berstatus rejected');
    });

    it('should emit UsulanCreated event', async () => {
      await contract.AjukanUsulanKenaikanPangkat(
        ctx, 'usl-001', 'hashNIP', '250', 'Lektor', 'null', 'snap-hash-usl-001', '2026-01-01T00:00:00Z'
      );

      const event = ctx.stub.events.find(e => e.name === 'UsulanCreated');
      expect(event).toBeDefined();
      expect(event.payload.jabatanTujuan).toBe('Lektor');
    });
  });

  describe('ProsesUsulanKenaikanPangkat', () => {
    beforeEach(async () => {
      // ProsesUsulanKenaikanPangkat is role-gated (_checkRole) — give ctx an allowed identity.
      setIdentity(ctx, { role: 'admin_sdm' });
      await contract.AjukanUsulanKenaikanPangkat(
        ctx, 'usl-001', 'hashNIP', '250', 'Lektor', 'null', 'snap-hash-usl-001', '2026-01-01T00:00:00Z'
      );
    });

    it('should change status from pending to diproses', async () => {
      const result = await contract.ProsesUsulanKenaikanPangkat(
        ctx, 'usl-001', 'admin-1', '2026-01-02T00:00:00Z'
      );
      const usulan = JSON.parse(result);

      expect(usulan.status).toBe('diproses');
      expect(usulan.processedBy).toBe('admin-1');
    });

    it('should throw if not in pending status', async () => {
      await contract.ProsesUsulanKenaikanPangkat(ctx, 'usl-001', 'admin-1', '2026-01-02T00:00:00Z');

      await expect(
        contract.ProsesUsulanKenaikanPangkat(ctx, 'usl-001', 'admin-1', '2026-01-03T00:00:00Z')
      ).rejects.toThrow('not in pending status');
    });

    it('should throw if usulan does not exist', async () => {
      await expect(
        contract.ProsesUsulanKenaikanPangkat(ctx, 'nonexistent', 'admin-1', '2026-01-02T00:00:00Z')
      ).rejects.toThrow('does not exist');
    });
  });

  describe('TolakUsulanKenaikanPangkat', () => {
    beforeEach(async () => {
      // TolakUsulanKenaikanPangkat (and ProsesUsulanKenaikanPangkat / TerbitkanSkKenaikanPangkat
      // used inline by some tests below) are role-gated — give ctx an allowed identity.
      setIdentity(ctx, { role: 'admin_sdm' });
      await contract.AjukanUsulanKenaikanPangkat(
        ctx, 'usl-001', 'hashNIP', '250', 'Lektor', 'null', 'snap-hash-usl-001', '2026-01-01T00:00:00Z'
      );
    });

    it('should reject a pending usulan', async () => {
      const result = await contract.TolakUsulanKenaikanPangkat(
        ctx, 'usl-001', 'admin-1', 'Dokumen tidak lengkap', '2026-01-02T00:00:00Z'
      );
      const usulan = JSON.parse(result);

      expect(usulan.status).toBe('rejected');
      expect(usulan.catatanPenolakan).toBe('Dokumen tidak lengkap');
    });

    it('should reject a diproses usulan', async () => {
      await contract.ProsesUsulanKenaikanPangkat(ctx, 'usl-001', 'admin-1', '2026-01-02T00:00:00Z');

      const result = await contract.TolakUsulanKenaikanPangkat(
        ctx, 'usl-001', 'admin-1', 'Alasan tolak', '2026-01-03T00:00:00Z'
      );
      const usulan = JSON.parse(result);
      expect(usulan.status).toBe('rejected');
    });

    it('should throw if already sk_issued', async () => {
      await contract.ProsesUsulanKenaikanPangkat(ctx, 'usl-001', 'admin-1', '2026-01-02T00:00:00Z');
      await contract.TerbitkanSkKenaikanPangkat(ctx, 'usl-001', 'skhash', 'admin-1', '2026-01-03T00:00:00Z');

      await expect(
        contract.TolakUsulanKenaikanPangkat(ctx, 'usl-001', 'admin-1', 'Batal', '2026-01-04T00:00:00Z')
      ).rejects.toThrow('cannot be rejected');
    });

    it('should throw if usulan does not exist', async () => {
      await expect(
        contract.TolakUsulanKenaikanPangkat(ctx, 'nonexistent', 'admin-1', 'Alasan', '2026-01-02T00:00:00Z')
      ).rejects.toThrow('does not exist');
    });
  });

  describe('TerbitkanSkKenaikanPangkat', () => {
    beforeEach(async () => {
      // TerbitkanSkKenaikanPangkat (and ProsesUsulanKenaikanPangkat used in setup) are role-gated.
      setIdentity(ctx, { role: 'admin_sdm' });
      await contract.AjukanUsulanKenaikanPangkat(
        ctx, 'usl-001', 'hashNIP', '250', 'Lektor', 'null', 'snap-hash-usl-001', '2026-01-01T00:00:00Z'
      );
      await contract.ProsesUsulanKenaikanPangkat(ctx, 'usl-001', 'admin-1', '2026-01-02T00:00:00Z');
    });

    it('should issue SK and store hash', async () => {
      const result = await contract.TerbitkanSkKenaikanPangkat(
        ctx, 'usl-001', 'sk-hash-abc', 'admin-1', '2026-01-03T00:00:00Z'
      );
      const usulan = JSON.parse(result);

      expect(usulan.status).toBe('sk_issued');
      expect(usulan.skHash).toBe('sk-hash-abc');
    });

    it('should throw if not in diproses status', async () => {
      await contract.TerbitkanSkKenaikanPangkat(ctx, 'usl-001', 'hash', 'admin-1', '2026-01-03T00:00:00Z');

      // Already sk_issued, can't issue again
      await expect(
        contract.TerbitkanSkKenaikanPangkat(ctx, 'usl-001', 'hash2', 'admin-1', '2026-01-04T00:00:00Z')
      ).rejects.toThrow("must be in 'diproses' status");
    });

    it('should emit SKIssued event', async () => {
      await contract.TerbitkanSkKenaikanPangkat(ctx, 'usl-001', 'sk-hash', 'admin-1', '2026-01-03T00:00:00Z');

      const event = ctx.stub.events.find(e => e.name === 'SKIssued');
      expect(event).toBeDefined();
      expect(event.payload.skHash).toBe('sk-hash');
    });

    it('should throw if usulan does not exist', async () => {
      await expect(
        contract.TerbitkanSkKenaikanPangkat(ctx, 'nonexistent', 'sk-hash', 'admin-1', '2026-01-03T00:00:00Z')
      ).rejects.toThrow('does not exist');
    });
  });

  describe('GetUsulan', () => {
    it('should read an existing usulan', async () => {
      await contract.AjukanUsulanKenaikanPangkat(
        ctx, 'usl-001', 'hashNIP', '250', 'Lektor', 'null', 'snap-hash-usl-001', '2026-01-01T00:00:00Z'
      );

      const result = await contract.GetUsulan(ctx, 'usl-001');
      const usulan = JSON.parse(result);
      expect(usulan.id).toBe('usl-001');
      expect(usulan.jabatanTujuan).toBe('Lektor');
    });

    it('should throw if usulan does not exist', async () => {
      await expect(
        contract.GetUsulan(ctx, 'nonexistent')
      ).rejects.toThrow('does not exist');
    });
  });

  describe('VerifySkHash', () => {
    beforeEach(async () => {
      // ProsesUsulanKenaikanPangkat / TerbitkanSkKenaikanPangkat below are role-gated
      // (VerifySkHash itself is not, but needs this setup chain to succeed first).
      setIdentity(ctx, { role: 'admin_sdm' });

      // Create and issue SK for testing
      await contract.AjukanUsulanKenaikanPangkat(
        ctx, 'usl-001', 'hashNIP', '250', 'Lektor', 'null', 'snap-hash-usl-001', '2026-01-01T00:00:00Z'
      );
      await contract.ProsesUsulanKenaikanPangkat(ctx, 'usl-001', 'admin-1', '2026-01-02T00:00:00Z');
      await contract.TerbitkanSkKenaikanPangkat(ctx, 'usl-001', 'sk-hash-original', 'admin-1', '2026-01-03T00:00:00Z');
    });

    it('should verify valid SK hash', async () => {
      const result = await contract.VerifySkHash(ctx, 'usl-001', 'sk-hash-original');
      const verification = JSON.parse(result);

      expect(verification.isValid).toBe(true);
      expect(verification.storedHash).toBe('sk-hash-original');
      expect(verification.providedHash).toBe('sk-hash-original');
      expect(verification.message).toContain('no tampering detected');
    });

    it('should detect tampered SK hash', async () => {
      const result = await contract.VerifySkHash(ctx, 'usl-001', 'sk-hash-tampered');
      const verification = JSON.parse(result);

      expect(verification.isValid).toBe(false);
      expect(verification.storedHash).toBe('sk-hash-original');
      expect(verification.providedHash).toBe('sk-hash-tampered');
      expect(verification.message).toContain('tampering detected');
    });

    it('should return false if SK not issued yet', async () => {
      // Create new usulan without issuing SK
      await contract.AjukanUsulanKenaikanPangkat(
        ctx, 'usl-002', 'hashNIP2', '250', 'Lektor', 'null', 'snap-hash-usl-002', '2026-01-01T00:00:00Z'
      );

      const result = await contract.VerifySkHash(ctx, 'usl-002', 'some-hash');
      const verification = JSON.parse(result);

      expect(verification.isValid).toBe(false);
      expect(verification.storedHash).toBeNull();
      expect(verification.message).toContain('SK has not been issued yet');
    });

    it('should throw if usulan does not exist', async () => {
      await expect(
        contract.VerifySkHash(ctx, 'nonexistent', 'some-hash')
      ).rejects.toThrow('does not exist');
    });
  });

  describe('KUM Validation per Jabatan', () => {
    const testCases = [
      { jabatan: 'Asisten Ahli', minKUM: 100 },
      { jabatan: 'Lektor', minKUM: 200 },
      { jabatan: 'Lektor Kepala', minKUM: 300 },
      { jabatan: 'Guru Besar', minKUM: 400 },
    ];

    testCases.forEach(({ jabatan, minKUM }) => {
      it(`should set kumMeetRequirement based on minimum KUM for ${jabatan}`, async () => {
        const below = JSON.parse(await contract.AjukanUsulanKenaikanPangkat(
          ctx, `usl-${jabatan}-low`, 'hashNIP', String(minKUM - 1), jabatan, 'null', `snap-hash-${jabatan}-low`, '2026-01-01T00:00:00Z'
        ));
        expect(below.kumMeetRequirement).toBe(false);
        expect(below.totalKUM).toBe(minKUM - 1);
        expect(below.status).toBe('pending');

        // Should also succeed (and meet requirement) with the exact minimum
        const atMinimum = JSON.parse(await contract.AjukanUsulanKenaikanPangkat(
          ctx, `usl-${jabatan}-ok`, 'hashNIP', String(minKUM), jabatan, 'null', `snap-hash-${jabatan}-ok`, '2026-01-01T00:00:00Z'
        ));
        expect(atMinimum.kumMeetRequirement).toBe(true);
        expect(atMinimum.totalKUM).toBe(minKUM);
        expect(atMinimum.status).toBe('pending');
      });
    });
  });

  describe('KegiatanExists', () => {
    it('should return a truthy value if the kegiatan exists', async () => {
      await contract.CreateKegiatan(
        ctx, 'kg-001', 'dosen-1', 'abc123hash', 'ref-1', '10', '2026-01-01T00:00:00Z'
      );

      const exists = await contract.KegiatanExists(ctx, 'kg-001');
      expect(exists).toBeTruthy();
    });

    it('should return a falsy value if the kegiatan does not exist', async () => {
      const exists = await contract.KegiatanExists(ctx, 'nonexistent');
      expect(exists).toBeFalsy();
    });
  });

  describe('GetHistoriUsulan', () => {
    it('should delegate to GetHistory using the USULAN_ key prefix', async () => {
      ctx.stub.historyData = [
        {
          txId: 'tx-101',
          timestamp: { seconds: { low: 1700000000 } },
          isDelete: false,
          value: Buffer.from(JSON.stringify({ id: 'usl-001', status: 'pending' })),
        },
        {
          txId: 'tx-102',
          timestamp: { seconds: { low: 1700001000 } },
          isDelete: false,
          value: Buffer.from(JSON.stringify({ id: 'usl-001', status: 'diproses' })),
        },
      ];

      const result = await contract.GetHistoriUsulan(ctx, 'usl-001');
      const history = JSON.parse(result);

      expect(ctx.stub.lastHistoryKey).toBe('USULAN_usl-001');
      expect(history).toHaveLength(2);
      expect(history[0].txId).toBe('tx-101');
      expect(history[1].value.status).toBe('diproses');
    });
  });

  describe('VerifyUsulanSnapshot', () => {
    beforeEach(async () => {
      await contract.AjukanUsulanKenaikanPangkat(
        ctx, 'usl-001', 'hashNIP', '250', 'Lektor', 'null', 'snap-hash-original', '2026-01-01T00:00:00Z'
      );
    });

    it('should verify a valid snapshot hash', async () => {
      const result = await contract.VerifyUsulanSnapshot(ctx, 'usl-001', 'snap-hash-original');
      const verification = JSON.parse(result);

      expect(verification.isValid).toBe(true);
      expect(verification.storedHash).toBe('snap-hash-original');
      expect(verification.calculatedHash).toBe('snap-hash-original');
      expect(verification.message).toContain('no tampering detected');
    });

    it('should detect a tampered snapshot hash', async () => {
      const result = await contract.VerifyUsulanSnapshot(ctx, 'usl-001', 'snap-hash-tampered');
      const verification = JSON.parse(result);

      expect(verification.isValid).toBe(false);
      expect(verification.storedHash).toBe('snap-hash-original');
      expect(verification.calculatedHash).toBe('snap-hash-tampered');
      expect(verification.message).toContain('tampering');
    });

    it('should throw if usulan does not exist', async () => {
      await expect(
        contract.VerifyUsulanSnapshot(ctx, 'nonexistent', 'some-hash')
      ).rejects.toThrow('does not exist');
    });
  });

  // ==========================================
  // COUCHDB RICH QUERY TESTS
  // MockStub cannot run real CouchDB selector matching, so these use
  // ctx.stub.setQueryResult([...]) to register canned { key, value } records
  // and assert that the contract wraps them as { Key, Record } correctly.
  // ==========================================

  describe('QueryKegiatanByDosen', () => {
    it('should return matching kegiatan records wrapped as { Key, Record }', async () => {
      ctx.stub.setQueryResult([
        { key: 'kg-001', value: { docType: 'kegiatan', id: 'kg-001', dosenId: 'dosen-1', status: 'verified' } },
        { key: 'kg-002', value: { docType: 'kegiatan', id: 'kg-002', dosenId: 'dosen-1', status: 'unverified' } },
      ]);

      const result = await contract.QueryKegiatanByDosen(ctx, 'dosen-1');
      const records = JSON.parse(result);

      expect(records).toHaveLength(2);
      expect(records[0]).toEqual({
        Key: 'kg-001',
        Record: { docType: 'kegiatan', id: 'kg-001', dosenId: 'dosen-1', status: 'verified' },
      });
      expect(records[1].Record.id).toBe('kg-002');
    });

    it('should return an empty array when no kegiatan match', async () => {
      ctx.stub.setQueryResult([]);

      const result = await contract.QueryKegiatanByDosen(ctx, 'dosen-unknown');
      expect(JSON.parse(result)).toEqual([]);
    });
  });

  describe('QueryKegiatanByStatus', () => {
    it('should return matching kegiatan records wrapped as { Key, Record }', async () => {
      ctx.stub.setQueryResult([
        { key: 'kg-001', value: { docType: 'kegiatan', id: 'kg-001', status: 'verified' } },
      ]);

      const result = await contract.QueryKegiatanByStatus(ctx, 'verified');
      const records = JSON.parse(result);

      expect(records).toHaveLength(1);
      expect(records[0].Key).toBe('kg-001');
      expect(records[0].Record.status).toBe('verified');
    });

    it('should return an empty array when no kegiatan match', async () => {
      ctx.stub.setQueryResult([]);

      const result = await contract.QueryKegiatanByStatus(ctx, 'rejected');
      expect(JSON.parse(result)).toEqual([]);
    });
  });

  describe('QueryKegiatanByDateRange', () => {
    it('should return matching kegiatan records and build a $gte/$lte selector on createdAt', async () => {
      ctx.stub.setQueryResult([
        { key: 'kg-001', value: { docType: 'kegiatan', id: 'kg-001', createdAt: '2026-01-15T00:00:00Z' } },
      ]);

      const result = await contract.QueryKegiatanByDateRange(ctx, '2026-01-01T00:00:00Z', '2026-01-31T23:59:59Z');
      const records = JSON.parse(result);

      expect(records).toHaveLength(1);
      expect(records[0].Key).toBe('kg-001');

      const query = JSON.parse(ctx.stub.lastQueryString);
      expect(query.selector.createdAt.$gte).toBe('2026-01-01T00:00:00Z');
      expect(query.selector.createdAt.$lte).toBe('2026-01-31T23:59:59Z');
    });

    it('should return an empty array when no kegiatan fall within the range', async () => {
      ctx.stub.setQueryResult([]);

      const result = await contract.QueryKegiatanByDateRange(ctx, '2020-01-01T00:00:00Z', '2020-01-31T23:59:59Z');
      expect(JSON.parse(result)).toEqual([]);
    });
  });

  describe('QueryUsulanByHashNIP', () => {
    it('should return matching usulan records wrapped as { Key, Record }', async () => {
      ctx.stub.setQueryResult([
        { key: 'USULAN_usl-001', value: { docType: 'usulan', id: 'usl-001', hashNIP: 'hash-nip-1', status: 'pending' } },
      ]);

      const result = await contract.QueryUsulanByHashNIP(ctx, 'hash-nip-1');
      const records = JSON.parse(result);

      expect(records).toHaveLength(1);
      expect(records[0].Key).toBe('USULAN_usl-001');
      expect(records[0].Record.hashNIP).toBe('hash-nip-1');
    });

    it('should return an empty array when no usulan match', async () => {
      ctx.stub.setQueryResult([]);

      const result = await contract.QueryUsulanByHashNIP(ctx, 'hash-nip-unknown');
      expect(JSON.parse(result)).toEqual([]);
    });
  });
});
