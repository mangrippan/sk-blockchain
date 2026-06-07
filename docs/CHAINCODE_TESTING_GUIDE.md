# Testing Guide - Chaincode KegiatanContract

Panduan unit-testing untuk smart contract `KegiatanContract` (Hyperledger Fabric chaincode) menggunakan Jest dan mock stub — **tidak memerlukan jaringan Fabric atau CouchDB sungguhan**.

## Prerequisites

1. Node.js terinstall (chaincode menggunakan `fabric-contract-api`/`fabric-shim` ^2.5.0)
2. Dependencies sudah ter-install: `cd chaincode && npm install`
3. Familiar dengan Jest dasar (`describe`/`it`/`beforeEach`, `expect`)

Tidak perlu menjalankan `network.sh up`, men-deploy chaincode, atau menyalakan CouchDB. Semua interaksi dengan ledger (`ctx.stub`) dan identitas pemanggil (`ctx.clientIdentity`) di-mock secara in-memory di dalam test file itu sendiri.

## Menjalankan Test Suite

```bash
cd chaincode

# Jalankan seluruh test suite
npm test
# (alias untuk: npx jest)

# Watch mode — re-run otomatis setiap kali file berubah
npx jest --watch

# Tampilkan coverage report
npx jest --coverage

# Jalankan hanya test yang namanya cocok dengan pattern tertentu
npx jest -t "VerifyKegiatan"
npx jest -t "access control"

# Verbose — tampilkan PASS/FAIL untuk setiap `it` satu per satu
npx jest --verbose
```

Seluruh test berada dalam satu file: `chaincode/__tests__/kegiatanContract.test.js`.

## Arsitektur Test: Pola MockStub

Saat berjalan di peer Fabric sungguhan, setiap method contract menerima `ctx` (`Context`) yang menyediakan dua hal:

- **`ctx.stub`** (`ChaincodeStub`) — akses ke world state ledger: `getState`, `putState`, `getHistoryForKey`, `getStateByRange`, `getQueryResult`, `setEvent`, dst.
- **`ctx.clientIdentity`** (`ClientIdentity`) — info identitas pemanggil dari sertifikat: `getAttributeValue`, `getMSPID`, `getIDBytes`, `getID`.

Keduanya hanya benar-benar tersedia di dalam peer. Karena itu test file mendefinisikan `MockStub`, sebuah implementasi in-memory yang meniru permukaan API tersebut — cukup persis untuk menjalankan logic contract tanpa perubahan apa pun pada kode produksi:

| Method asli | Cara mock-nya |
|---|---|
| `getState(key)` / `putState(key, value)` | object `state` in-memory: `key → JSON string` |
| `setEvent(name, payload)` | push ke array `events`; assert dengan `ctx.stub.events.find(e => e.name === '...')` |
| `getHistoryForKey(key)` | iterator di atas array `historyData` yang kamu seed manual sebelum memanggil method (juga mencatat `lastHistoryKey` untuk verifikasi delegasi) |
| `getStateByRange(start, end)` | iterator di atas seluruh isi `state` (dipakai `GetAllKegiatan`) |
| `getQueryResult(queryString)` | iterator di atas `_queryResults` yang kamu daftarkan lewat `setQueryResult([...])` (juga mencatat `lastQueryString`) |

`beforeEach` di level paling luar memanggil `createContext()` sehingga setiap `it(...)` mendapat `ctx`/`stub`/`contract` yang baru — tidak ada state yang bocor antar test.

## Mocking `ctx.clientIdentity` untuk Role-Based Access Control

Ini bagian paling penting untuk dipahami sebelum menambah test pada method baru yang dibatasi akses (role-gated). Lima method (`VerifyKegiatan`, `GetAllKegiatan`, `ProsesUsulanKenaikanPangkat`, `TolakUsulanKenaikanPangkat`, `TerbitkanSkKenaikanPangkat`) memulai dengan memanggil helper `_checkRole(ctx, allowedRoles)`, yang mempunyai **dua jalur**:

1. **Jalur utama** — baca atribut `role` dari sertifikat lewat `ctx.clientIdentity.getAttributeValue('role')` (yang mengembalikan `null`, bukan throw, kalau atribut tidak ada — lihat `fabric-shim/lib/chaincode.js`). Kalau `role` ada **dan** termasuk `allowedRoles` → akses diizinkan. Kalau ada tapi **tidak** termasuk → throw `Access denied. Required role: ... Current role: ...`. Kalau atribut sama sekali tidak ada → throw `No role attribute found...`.
2. **Jalur fallback (legacy)** — *setiap* error dari jalur utama (termasuk "Access denied" sekalipun!) ditangkap oleh `catch`, yang lalu mengecek apakah pemanggil adalah admin `Org1MSP` lama: MSP ID harus `Org1MSP` **dan** ID bytes sertifikat mengandung string `admin`. Kalau cocok → diizinkan sebagai `'superadmin'` (disertai `console.warn` peringatan migrasi). Kalau tidak cocok → lempar ulang sebagai `Authorization failed: <pesan asli dari jalur utama>`.

Dua helper di test file membangun keempat kombinasi identitas yang menutupi seluruh cabang di atas:

```js
createContext({ role: 'admin_sdm' })   // role ada & diizinkan       → lolos di jalur utama
createContext({ role: 'mahasiswa' })   // role ada, TIDAK diizinkan  → "Authorization failed: Access denied..."
createContext({ legacyAdmin: true })   // tanpa role; Org1MSP+admin  → fallback sukses sebagai 'superadmin'
createContext({ legacyAdmin: false })  // tanpa role; Org1MSP biasa  → "Authorization failed: No role attribute..."
createContext()                        // tanpa clientIdentity sama sekali — untuk method yang TIDAK role-gated
```

`setIdentity(ctx, options)` menerima opsi yang sama persis tapi menempel ke `ctx` yang sudah dibuat — dipakai di dalam `beforeEach` ketika rangkaian setup-nya (mis. `AjukanUsulanKenaikanPangkat` → `ProsesUsulanKenaikanPangkat` → `TerbitkanSkKenaikanPangkat`) melewati method role-gated dan butuh identitas yang diizinkan supaya tidak gagal *sebelum* test yang sebenarnya sempat berjalan.

> ⚠️ **Penting**: jangan taruh `setIdentity`/identitas default di `beforeEach` paling luar. Itu akan menutupi jalur "akses ditolak" yang justru sengaja diuji secara eksplisit di `describe('_checkRole access control', ...)`, dan membuat test untuk method yang **tidak** role-gated (mis. `CreateKegiatan`, `ReadKegiatan`, `AjukanUsulanKenaikanPangkat`) diam-diam bergantung pada identitas yang sebenarnya tidak mereka perlukan.

Tabel referensi cepat:

| Method | Role yang diizinkan |
|---|---|
| `VerifyKegiatan`, `GetAllKegiatan`, `ProsesUsulanKenaikanPangkat`, `TolakUsulanKenaikanPangkat`, `TerbitkanSkKenaikanPangkat` | `admin_sdm`, `pimpinan`, `superadmin` (atau identitas admin `Org1MSP` legacy) |
| Semua method lainnya — `CreateKegiatan`, `ReadKegiatan`, `VerifyDocumentHash`, `AjukanUsulanKenaikanPangkat`, `VerifySkHash`, `VerifyUsulanSnapshot`, seluruh `Query*`, dll. | tidak ada pengecekan role di level chaincode; `ctx.clientIdentity` boleh `undefined` |

## Mocking CouchDB Rich Query

Empat method (`QueryKegiatanByDosen`, `QueryKegiatanByStatus`, `QueryKegiatanByDateRange`, `QueryUsulanByHashNIP`) membangun selector JSON lalu memanggil `ctx.stub.getQueryResult(queryString)` — fitur CouchDB yang **tidak bisa** dijalankan sungguhan oleh `MockStub` (tidak ada index/selector matching beneran). Sebagai gantinya, daftarkan dulu hasil yang diinginkan lewat `setQueryResult`:

```js
ctx.stub.setQueryResult([
  { key: 'kg-001', value: { docType: 'kegiatan', id: 'kg-001', dosenId: 'dosen-1', status: 'verified' } },
]);

const records = JSON.parse(await contract.QueryKegiatanByDosen(ctx, 'dosen-1'));
// records[0] => { Key: 'kg-001', Record: { docType: 'kegiatan', id: 'kg-001', dosenId: 'dosen-1', status: 'verified' } }
```

`value` cukup berupa object biasa — `setQueryResult` yang men-`JSON.stringify`-kannya (meniru cara CouchDB menyimpan dokumen sebagai Buffer), dan `getQueryResultForQueryString` di contract akan mem-parse-nya kembali lalu membungkus tiap baris sebagai `{ Key, Record }`.

Karena `MockStub` tidak benar-benar mencocokkan selector, ia akan mengembalikan `_queryResults` yang terdaftar terlepas dari isi query string yang dikirim. Untuk memverifikasi *selector yang dibangun contract itu sendiri* (logic yang justru ingin diuji), inspeksi `ctx.stub.lastQueryString` — seperti pada test `QueryKegiatanByDateRange` yang mem-parse ulang string itu dan men-assert field `$gte`/`$lte`-nya.

## Menulis Test Baru — Pola dan Konvensi

- **Struktur**: satu `describe` per method contract, satu `it` per skenario/cabang logic. Kalau sebuah method butuh data awal, taruh `beforeEach` di **dalam** describe method tersebut (bukan di level paling luar) supaya tidak memengaruhi test lain yang tidak membutuhkannya.
- **Return value selalu string JSON** — pola standarnya `const data = JSON.parse(await contract.Method(...))`, lalu assert pada field-fieldnya satu per satu (hindari `toEqual` pada keseluruhan object kecuali kamu sengaja ingin menguji bentuk lengkapnya, seperti pada test query).
- **Error**: `await expect(contract.Method(...)).rejects.toThrow('substring pesan error')`. Jest mencocokkan substring, jadi cukup gunakan bagian pesan yang stabil dan bermakna (`'does not exist'`, `'Access denied'`, `'Authorization failed'`) — bukan menyalin pesan lengkap yang gampang berubah.
- **Event**: panggil method-nya, lalu `const event = ctx.stub.events.find(e => e.name === 'NamaEvent')`, assert `event` ada dan periksa field di `event.payload`.
- **History**: seed `ctx.stub.historyData` secara manual — array berisi `{ txId, timestamp, isDelete, value: Buffer.from(JSON.stringify(...)) }` — sebelum memanggil `GetHistory`/`GetHistoriUsulan`.
- **Method role-gated**: panggil `setIdentity(ctx, { role: '...' })` dengan role yang diizinkan *sebelum* memanggil method-nya (lihat tabel di bagian access control).
- **ID unik per test**: `MockStub.state` dan ledger sungguhan sama-sama menolak `putState` pada key yang sudah pernah dipakai untuk record yang sama (`... already exists`). Kalau sebuah test (apalagi yang parametrized via `.forEach`) memanggil `CreateKegiatan`/`AjukanUsulanKenaikanPangkat` lebih dari sekali, pastikan setiap panggilan memakai ID berbeda — lihat pola `usl-${jabatan}-low` / `usl-${jabatan}-ok` di `describe('KUM Validation per Jabatan', ...)`.

## Coverage Saat Ini

Seluruh method publik di `KegiatanContract` sudah memiliki test, **kecuali `InitLedger`** — method itu sengaja dilewati karena badan fungsinya hanya berisi dua baris `console.info` (no-op murni; tidak menyentuh state maupun melakukan validasi). Jika di kemudian hari `InitLedger` diisi logic seeding data sungguhan, tambahkan test untuknya pada saat itu juga.

Area yang sebelumnya **sama sekali tidak** punya coverage dan sekarang sudah:

- Seluruh percabangan `_checkRole`, termasuk jalur fallback admin `Org1MSP` legacy (`describe('_checkRole access control', ...)`) — sebelumnya jalur ini tidak pernah dilewati oleh satu pun test
- `KegiatanExists`, `VerifyUsulanSnapshot`, `GetHistoriUsulan`
- Keempat method CouchDB rich query: `QueryKegiatanByDosen`, `QueryKegiatanByStatus`, `QueryKegiatanByDateRange`, `QueryUsulanByHashNIP`

## Troubleshooting

### `TypeError: Cannot read properties of undefined (reading 'getMSPID')`

Method yang kamu panggil adalah method role-gated (memanggil `_checkRole` di awal), tapi `ctx.clientIdentity` belum di-set sehingga `undefined`. Tambahkan `setIdentity(ctx, { role: 'admin_sdm' })` (atau role lain yang sesuai — lihat tabel di bagian access control) sebelum memanggil method tersebut, biasanya di baris pertama `beforeEach` describe block-nya.

### `Error: Usulan usl-xxx already exists` / `Error: Kegiatan kg-xxx already exists`

Dua pemanggilan `AjukanUsulanKenaikanPangkat`/`CreateKegiatan` memakai ID yang sama pada `MockStub.state` yang sama. Ini paling sering terjadi pada test parametrized yang lupa memberi ID berbeda untuk tiap kasus dalam satu `it` yang sama — lihat poin "ID unik per test" di atas.

### Argumen `AjukanUsulanKenaikanPangkat` "bergeser"

Signature-nya punya **7 parameter** setelah `ctx`: `(usulanId, hashNIP, totalKUM, jabatanTujuan, idUsulanLama, snapshotHash, timestamp)`. Kalau kamu memanggilnya dengan hanya 6 argumen, nilai yang kamu maksud sebagai `timestamp` akan diam-diam mengisi posisi `snapshotHash`, dan `timestamp` yang sebenarnya menjadi `undefined` (lalu hilang begitu di-`JSON.stringify`). Bug seperti ini bisa luput cukup lama karena tidak terlihat dari luar — tidak ada error yang dilempar. Kalau menambah call site baru, hitung argumennya (harus genap 7 plus `ctx`), dan pertimbangkan menambahkan assertion pada `usulan.snapshotHash`/`usulan.createdAt` sebagai regression check, seperti pada test `'should create a new usulan'`.

---

**Last Updated**: 2026-06-07
**Version**: 1.0.0
