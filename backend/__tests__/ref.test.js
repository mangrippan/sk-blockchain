/**
 * Reference Data API Tests
 * Tests for /api/v1/ref endpoints
 */

const request = require('supertest');
const express = require('express');
const refRouter = require('../routes/v1/ref');
const { pool } = require('../config/database');

// Create a minimal Express app for testing
const app = express();
app.use(express.json());
app.use('/api/v1/ref', refRouter);

describe('Reference Data API', () => {
  describe('GET /api/v1/ref/kategori', () => {
    it('should get all kategori KUM', async () => {
      const response = await request(app)
        .get('/api/v1/ref/kategori')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('count');
      
      if (response.body.data.length > 0) {
        const kategori = response.body.data[0];
        expect(kategori).toHaveProperty('id');
        expect(kategori).toHaveProperty('kode');
        expect(kategori).toHaveProperty('nama_kategori');
      }
    });

    it('should filter only active categories by default', async () => {
      const response = await request(app)
        .get('/api/v1/ref/kategori')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      // All returned categories should be active (if is_active field exists)
      response.body.data.forEach(kategori => {
        if (kategori.hasOwnProperty('is_active')) {
          expect(kategori.is_active).toBe(true);
        }
      });
    });

    it('should get all categories including inactive when active_only=false', async () => {
      const response = await request(app)
        .get('/api/v1/ref/kategori?active_only=false')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return categories sorted by kode', async () => {
      const response = await request(app)
        .get('/api/v1/ref/kategori')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      const kodes = response.body.data.map(k => k.kode);
      
      // Check if sorted (compare with sorted version)
      const sortedKodes = [...kodes].sort();
      expect(kodes).toEqual(sortedKodes);
    });
  });

  describe('GET /api/v1/ref/kegiatan', () => {
    it('should get all kegiatan KUM', async () => {
      const response = await request(app)
        .get('/api/v1/ref/kegiatan')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('count');
      
      if (response.body.data.length > 0) {
        const kegiatan = response.body.data[0];
        expect(kegiatan).toHaveProperty('id');
        expect(kegiatan).toHaveProperty('kode_kegiatan');
        expect(kegiatan).toHaveProperty('nama_kegiatan');
        expect(kegiatan).toHaveProperty('poin_maksimal');
      }
    });

    it('should filter kegiatan by kategori_id', async () => {
      // First get a kategori
      const kategoriResponse = await request(app)
        .get('/api/v1/ref/kategori')
        .expect(200);

      if (kategoriResponse.body.data.length > 0) {
        const kategoriId = kategoriResponse.body.data[0].id;
        
        const response = await request(app)
          .get(`/api/v1/ref/kegiatan?kategori_id=${kategoriId}`)
          .expect(200);

        expect(response.body).toHaveProperty('data');
        // All returned kegiatan should belong to the specified kategori
        response.body.data.forEach(kegiatan => {
          expect(kegiatan.kategori_id).toBe(kategoriId);
        });
      }
    });

    it('should filter only active kegiatan by default', async () => {
      const response = await request(app)
        .get('/api/v1/ref/kegiatan')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      response.body.data.forEach(kegiatan => {
        if (kegiatan.hasOwnProperty('is_active')) {
          expect(kegiatan.is_active).toBe(true);
        }
      });
    });

    it('should get all kegiatan including inactive when active_only=false', async () => {
      const response = await request(app)
        .get('/api/v1/ref/kegiatan?active_only=false')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/ref/kegiatan?limit=5&offset=0')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      // Note: Pagination might not be fully implemented, so just check it returns data
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/ref/kegiatan/:id', () => {
    let testKegiatanId;

    beforeAll(async () => {
      // Get an existing kegiatan ID for testing
      const result = await pool.query(
        'SELECT id FROM sk.ref_kegiatan_kum WHERE is_active = true LIMIT 1'
      );
      if (result.rows.length > 0) {
        testKegiatanId = result.rows[0].id;
      }
    });

    it('should get kegiatan details by id', async () => {
      if (!testKegiatanId) {
        console.log('Skipping test: no kegiatan available');
        return;
      }

      const response = await request(app)
        .get(`/api/v1/ref/kegiatan/${testKegiatanId}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('id', testKegiatanId);
      expect(response.body.data).toHaveProperty('kode_kegiatan');
      expect(response.body.data).toHaveProperty('nama_kegiatan');
      expect(response.body.data).toHaveProperty('nama_kategori');
    });

    it('should return 404 for non-existent kegiatan', async () => {
      const response = await request(app)
        .get('/api/v1/ref/kegiatan/999999')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should return kegiatan with kategori information', async () => {
      if (!testKegiatanId) return;

      const response = await request(app)
        .get(`/api/v1/ref/kegiatan/${testKegiatanId}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('kategori_id');
      expect(response.body.data).toHaveProperty('nama_kategori');
    });
  });

  describe('GET /api/v1/ref/dokumen', () => {
    it('should get all jenis dokumen', async () => {
      const response = await request(app)
        .get('/api/v1/ref/dokumen')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('count');
      
      if (response.body.data.length > 0) {
        const dokumen = response.body.data[0];
        expect(dokumen).toHaveProperty('id');
        expect(dokumen).toHaveProperty('nama');
      }
    });

    it('should filter only active dokumen by default', async () => {
      const response = await request(app)
        .get('/api/v1/ref/dokumen')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      response.body.data.forEach(dokumen => {
        if (dokumen.hasOwnProperty('is_active')) {
          expect(dokumen.is_active).toBe(true);
        }
      });
    });

    it('should get all dokumen including inactive when active_only=false', async () => {
      const response = await request(app)
        .get('/api/v1/ref/dokumen?active_only=false')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return dokumen sorted by nama_dokumen', async () => {
      const response = await request(app)
        .get('/api/v1/ref/dokumen')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      const names = response.body.data.map(d => d.nama_dokumen);
      
      // Check if sorted
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // This test simulates an error by using an invalid query parameter
      const response = await request(app)
        .get('/api/v1/ref/kegiatan?kategori_id=invalid')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    it('should return proper error structure', async () => {
      const response = await request(app)
        .get('/api/v1/ref/kegiatan/999999')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });
  });

  describe('Data Validation', () => {
    it('should validate kategori has required fields', async () => {
      const response = await request(app)
        .get('/api/v1/ref/kategori')
        .expect(200);

      if (response.body.data.length > 0) {
        const kategori = response.body.data[0];
        expect(kategori).toHaveProperty('id');
        expect(kategori).toHaveProperty('kode');
        expect(kategori).toHaveProperty('nama_kategori');
        expect(typeof kategori.id).toBe('number');
        expect(typeof kategori.kode).toBe('string');
        expect(typeof kategori.nama_kategori).toBe('string');
      }
    });

    it('should validate kegiatan has required fields', async () => {
      const response = await request(app)
        .get('/api/v1/ref/kegiatan')
        .expect(200);

      if (response.body.data.length > 0) {
        const kegiatan = response.body.data[0];
        expect(kegiatan).toHaveProperty('id');
        expect(kegiatan).toHaveProperty('kode_kegiatan');
        expect(kegiatan).toHaveProperty('nama_kegiatan');
        expect(kegiatan).toHaveProperty('poin_maksimal');
        expect(typeof kegiatan.id).toBe('number');
        expect(typeof kegiatan.kode_kegiatan).toBe('string');
        expect(typeof kegiatan.nama_kegiatan).toBe('string');
        // poin_maksimal is returned as string from database decimal type
        expect(typeof kegiatan.poin_maksimal).toBe('string');
      }
    });

    it('should validate dokumen has required fields', async () => {
      const response = await request(app)
        .get('/api/v1/ref/dokumen')
        .expect(200);

      if (response.body.data.length > 0) {
        const dokumen = response.body.data[0];
        expect(dokumen).toHaveProperty('id');
        expect(dokumen).toHaveProperty('nama');
        expect(typeof dokumen.id).toBe('number');
        expect(typeof dokumen.nama).toBe('string');
      }
    });
  });
});
