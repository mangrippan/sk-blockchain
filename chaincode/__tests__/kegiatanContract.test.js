'use strict';

const KegiatanContract = require('../lib/kegiatanContract');

// Mock ChaincodeStub
class MockStub {
  constructor() {
    this.state = {};
    this.events = [];
    this.historyData = [];
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
}

// Mock transaction context
function createContext() {
  const stub = new MockStub();
  return { stub };
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
        ctx, 'usl-001', 'hashNIP123', '250', 'Lektor', 'null', '2026-01-01T00:00:00Z'
      );
      const usulan = JSON.parse(result);

      expect(usulan.id).toBe('usl-001');
      expect(usulan.hashNIP).toBe('hashNIP123');
      expect(usulan.totalKUM).toBe(250);
      expect(usulan.jabatanTujuan).toBe('Lektor');
      expect(usulan.status).toBe('pending');
      expect(usulan.idUsulanLama).toBeNull();
    });

    it('should throw if KUM insufficient', async () => {
      await expect(
        contract.AjukanUsulanKenaikanPangkat(
          ctx, 'usl-001', 'hashNIP', '50', 'Lektor', 'null', '2026-01-01T00:00:00Z'
        )
      ).rejects.toThrow('KUM tidak mencukupi');
    });

    it('should throw if usulan already exists', async () => {
      await contract.AjukanUsulanKenaikanPangkat(
        ctx, 'usl-001', 'hashNIP', '250', 'Lektor', 'null', '2026-01-01T00:00:00Z'
      );

      await expect(
        contract.AjukanUsulanKenaikanPangkat(
          ctx, 'usl-001', 'hashNIP', '250', 'Lektor', 'null', '2026-01-02T00:00:00Z'
        )
      ).rejects.toThrow('Usulan usl-001 already exists');
    });

    it('should allow resubmission if old usulan was rejected', async () => {
      // Create and reject old usulan
      await contract.AjukanUsulanKenaikanPangkat(
        ctx, 'usl-old', 'hashNIP', '250', 'Lektor', 'null', '2026-01-01T00:00:00Z'
      );
      await contract.ProsesUsulanKenaikanPangkat(ctx, 'usl-old', 'admin-1', '2026-01-02T00:00:00Z');
      // Need to manually set to rejected since ProsesUsulan sets to 'diproses'
      await contract.TolakUsulanKenaikanPangkat(
        ctx, 'usl-old', 'admin-1', 'Dokumen kurang', '2026-01-03T00:00:00Z'
      );

      // Resubmit with reference to old
      const result = await contract.AjukanUsulanKenaikanPangkat(
        ctx, 'usl-new', 'hashNIP', '250', 'Lektor', 'usl-old', '2026-01-04T00:00:00Z'
      );
      const usulan = JSON.parse(result);
      expect(usulan.idUsulanLama).toBe('usl-old');
    });

    it('should throw if old usulan is not rejected', async () => {
      await contract.AjukanUsulanKenaikanPangkat(
        ctx, 'usl-old', 'hashNIP', '250', 'Lektor', 'null', '2026-01-01T00:00:00Z'
      );

      await expect(
        contract.AjukanUsulanKenaikanPangkat(
          ctx, 'usl-new', 'hashNIP', '250', 'Lektor', 'usl-old', '2026-01-02T00:00:00Z'
        )
      ).rejects.toThrow('belum berstatus rejected');
    });

    it('should emit UsulanCreated event', async () => {
      await contract.AjukanUsulanKenaikanPangkat(
        ctx, 'usl-001', 'hashNIP', '250', 'Lektor', 'null', '2026-01-01T00:00:00Z'
      );

      const event = ctx.stub.events.find(e => e.name === 'UsulanCreated');
      expect(event).toBeDefined();
      expect(event.payload.jabatanTujuan).toBe('Lektor');
    });
  });

  describe('ProsesUsulanKenaikanPangkat', () => {
    beforeEach(async () => {
      await contract.AjukanUsulanKenaikanPangkat(
        ctx, 'usl-001', 'hashNIP', '250', 'Lektor', 'null', '2026-01-01T00:00:00Z'
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
      await contract.AjukanUsulanKenaikanPangkat(
        ctx, 'usl-001', 'hashNIP', '250', 'Lektor', 'null', '2026-01-01T00:00:00Z'
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
  });

  describe('TerbitkanSkKenaikanPangkat', () => {
    beforeEach(async () => {
      await contract.AjukanUsulanKenaikanPangkat(
        ctx, 'usl-001', 'hashNIP', '250', 'Lektor', 'null', '2026-01-01T00:00:00Z'
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
  });

  describe('GetUsulan', () => {
    it('should read an existing usulan', async () => {
      await contract.AjukanUsulanKenaikanPangkat(
        ctx, 'usl-001', 'hashNIP', '250', 'Lektor', 'null', '2026-01-01T00:00:00Z'
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

  describe('KUM Validation per Jabatan', () => {
    const testCases = [
      { jabatan: 'Asisten Ahli', minKUM: 100 },
      { jabatan: 'Lektor', minKUM: 200 },
      { jabatan: 'Lektor Kepala', minKUM: 300 },
      { jabatan: 'Guru Besar', minKUM: 400 },
    ];

    testCases.forEach(({ jabatan, minKUM }) => {
      it(`should require minimum ${minKUM} KUM for ${jabatan}`, async () => {
        await expect(
          contract.AjukanUsulanKenaikanPangkat(
            ctx, `usl-${jabatan}`, 'hashNIP', String(minKUM - 1), jabatan, 'null', '2026-01-01T00:00:00Z'
          )
        ).rejects.toThrow('KUM tidak mencukupi');

        // Should succeed with exact minimum
        const result = await contract.AjukanUsulanKenaikanPangkat(
          ctx, `usl-${jabatan}`, 'hashNIP', String(minKUM), jabatan, 'null', '2026-01-01T00:00:00Z'
        );
        const usulan = JSON.parse(result);
        expect(usulan.status).toBe('pending');
      });
    });
  });
});
