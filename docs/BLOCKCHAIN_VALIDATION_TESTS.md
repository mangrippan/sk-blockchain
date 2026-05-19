# Test Cases untuk Validasi Blockchain yang Tidak Valid di Kegiatan

## Ringkasan

Dokumen ini menjelaskan test cases yang telah dibuat untuk menangani berbagai skenario kegagalan blockchain pada modul kegiatan. Test cases ini memastikan bahwa sistem tetap berfungsi dengan baik meskipun terjadi masalah pada blockchain.

## Kategori Test Cases

### 1. **Blockchain Connection Failures**

#### Test: Verifikasi berhasil meskipun blockchain tidak tersedia
- **Skenario**: Blockchain network down atau disabled
- **Expected**: Database tetap ter-update, proses verifikasi berhasil
- **Lokasi**: `should handle verification gracefully when blockchain is unavailable`

#### Test: Warning log ketika blockchain recording gagal
- **Skenario**: Blockchain network timeout saat mencoba record transaksi
- **Expected**: Sistem log warning tapi tetap lanjut proses di database
- **Lokasi**: `should log warning when blockchain recording fails but continue processing`

### 2. **Document Hash Validation**

#### Test: Deteksi dokumen yang telah diubah (tampered)
- **Skenario**: Hash dokumen di database berbeda dengan hash di blockchain
- **Expected**: Sistem mendeteksi ketidakcocokan dan flag sebagai tampering
- **Lokasi**: `should detect tampered documents via hash mismatch`
- **Contoh Output**:
  ```json
  {
    "valid": false,
    "blockchainHash": "originalhash123456",
    "providedHash": "tamperedhash999",
    "message": "Document hash mismatch - possible tampering detected"
  }
  ```

#### Test: Validasi hash dokumen yang benar
- **Skenario**: Hash dokumen match dengan blockchain
- **Expected**: Verifikasi berhasil, status valid = true
- **Lokasi**: `should validate correct document hash successfully`

### 3. **Blockchain Transaction Validation**

#### Test: Handle invalid transaction ID format
- **Skenario**: Blockchain return null transaction ID
- **Expected**: Proses tetap lanjut, tidak error
- **Lokasi**: `should handle invalid transaction ID format`

#### Test: Handle transaction timeout
- **Skenario**: Blockchain transaction melebihi timeout (30 detik)
- **Expected**: Database tetap ter-update, error dicatat di log
- **Lokasi**: `should handle blockchain transaction timeout`

### 4. **Blockchain Data Integrity**

#### Test: Deteksi missing blockchain record
- **Skenario**: Kegiatan verified di database tapi tidak ada record di blockchain
- **Expected**: getKegiatanHistory() return null, flag red flag
- **Lokasi**: `should detect missing blockchain record for verified kegiatan`

#### Test: Validasi history blockchain vs database
- **Skenario**: Cek apakah status di blockchain match dengan database
- **Expected**: History array berisi txId dan status yang sesuai
- **Lokasi**: `should validate blockchain history matches database status`

#### Test: Handle corrupted blockchain data
- **Skenario**: Data di blockchain corrupt/tidak bisa di-parse
- **Expected**: Error dengan message "invalid JSON" atau sejenisnya
- **Lokasi**: `should handle corrupted blockchain data gracefully`

### 5. **Blockchain Status Consistency**

#### Test: Flag inconsistency antara database dan blockchain
- **Skenario**: Status di database = "verified" tapi di blockchain = "rejected"
- **Expected**: Test mendeteksi ketidakcocokan
- **Lokasi**: `should flag inconsistency between database and blockchain status`

#### Test: Verifikasi tanpa creation record
- **Skenario**: Ada transaction VERIFY tapi tidak ada transaction CREATE
- **Expected**: Incomplete blockchain trail terdeteksi
- **Lokasi**: `should handle verification without prior blockchain creation record`

### 6. **Edge Cases and Error Handling**

#### Test: Empty blockchain response
- **Skenario**: Query blockchain return array kosong []
- **Expected**: Tidak error, handle dengan graceful
- **Lokasi**: `should handle empty blockchain response`

#### Test: Malformed kegiatan ID
- **Skenario**: ID kegiatan format invalid (bukan UUID)
- **Expected**: Error "Invalid kegiatan ID format"
- **Lokasi**: `should handle malformed kegiatan ID in blockchain query`

#### Test: Endorsement policy failure
- **Skenario**: Blockchain endorsement tidak cukup untuk commit transaction
- **Expected**: Database tetap ter-update, blockchain error di-log
- **Lokasi**: `should validate blockchain network endorsement policy failures`

## Cara Menjalankan Tests

```bash
cd backend

# Run semua kegiatan tests
npm test -- kegiatan.test.js

# Run hanya blockchain validation tests
npm test -- kegiatan.test.js -t "Blockchain Validation"

# Run specific test
npm test -- kegiatan.test.js -t "should detect tampered documents"
```

## Mock yang Digunakan

Test cases ini menggunakan Jest mocks untuk:
- `fabricClient.isFabricEnabled()` - Simulasi blockchain enabled/disabled
- `fabricClient.recordKegiatanVerification()` - Simulasi record verification
- `fabricClient.verifyDocumentHash()` - Simulasi hash verification
- `fabricClient.getKegiatanHistory()` - Simulasi query history

## Arsitektur Fallback

Sistem dirancang dengan **blockchain-optional architecture**:
- ✅ Database adalah source of truth utama
- ✅ Blockchain sebagai audit trail dan immutable log
- ✅ Jika blockchain gagal, sistem tetap berfungsi
- ⚠️ Warning/error di-log untuk monitoring
- 🔍 Dapat di-audit nanti untuk reconciliation

## Skenario Real-World

### Skenario 1: Blockchain Network Down
```
1. Admin verifikasi kegiatan
2. Blockchain network tidak merespons
3. ✅ Kegiatan ter-verifikasi di database
4. ⚠️ Log warning: "Blockchain verification recording failed"
5. 🔧 Admin dapat re-sync ke blockchain nanti
```

### Skenario 2: Document Tampering Detected
```
1. Kegiatan sudah verified dan ada di blockchain
2. User mencoba ganti dokumen (hash berubah)
3. Sistem query blockchain untuk original hash
4. 🚨 Detect mismatch: tampering alert!
5. ❌ Reject perubahan atau flag untuk review
```

### Skenario 3: Transaction Timeout
```
1. Submit transaction ke blockchain
2. Network lambat, timeout setelah 30 detik
3. ✅ Database sudah commit
4. ❌ Blockchain belum confirm
5. 🔄 Retry mechanism atau manual reconciliation
```

## Best Practices

1. **Selalu check `isFabricEnabled()` sebelum call blockchain functions**
2. **Wrap blockchain calls dalam try-catch**
3. **Log errors untuk monitoring dan debugging**
4. **Database transaction terpisah dari blockchain transaction**
5. **Implement reconciliation job untuk sync DB ↔ Blockchain**

## Metrics yang Perlu Dimonitor

- Blockchain availability rate (uptime)
- Transaction success rate
- Average transaction latency
- Hash mismatch detection count
- Failed blockchain recordings count

## Future Enhancements

- [ ] Automatic retry mechanism untuk failed blockchain transactions
- [ ] Scheduled reconciliation job (DB vs Blockchain)
- [ ] Alert system untuk hash mismatch detection
- [ ] Dashboard untuk blockchain health monitoring
- [ ] Bulk verification untuk historical data

---

**Dibuat**: 2026-05-19  
**Update Terakhir**: 2026-05-19  
**Versi**: 1.0.0
