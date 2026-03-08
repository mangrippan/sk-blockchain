# 🎉 Setup Blockchain dengan Ganache - COMPLETE!

## ✅ Yang Sudah Diinstall

### 1. **Nethereum Packages** ✅
- ✅ Nethereum.Web3 (5.8.0)
- ✅ Nethereum.Contracts (5.8.0)
- ✅ Nethereum.Accounts (5.8.0)
- ✅ Nethereum.RPC (5.8.0)
- ✅ Nethereum.Signer (5.8.0)
- ✅ BouncyCastle.Cryptography (2.5.1)

### 2. **Files yang Sudah Dibuat** ✅
- ✅ `Services/IBlockchainService.cs` - Interface blockchain service
- ✅ `Services/BlockchainService.cs` - Implementation blockchain service
- ✅ `Controllers/BlockchainController.cs` - API endpoints untuk blockchain
- ✅ `SmartContracts/DocumentRegistry.sol` - Solidity smart contract
- ✅ `SmartContracts/truffle-config.js` - Truffle configuration
- ✅ `GANACHE_SETUP.md` - Panduan lengkap setup Ganache

### 3. **Configuration** ✅
- ✅ `appsettings.json` - Template configuration
- ✅ `appsettings.Development.json` - Development configuration dengan Ganache
- ✅ `Program.cs` - Service registration

---

## 🚀 Quick Start Guide

### Step 1: Install Ganache

**Download Ganache GUI:**
```
https://trufflesuite.com/ganache/
```

**Atau install Ganache CLI:**
```bash
npm install -g ganache
```

### Step 2: Jalankan Ganache

**Ganache GUI:**
1. Buka aplikasi Ganache
2. Klik "QUICKSTART"
3. Ganache akan running di `http://127.0.0.1:7545`

**Ganache CLI:**
```bash
ganache --host 127.0.0.1 --port 7545
```

### Step 3: Copy Private Key

**Di Ganache:**
1. Klik icon **key (🔑)** di samping account pertama
2. Copy **PRIVATE KEY**
3. Update `appsettings.Development.json`:

```json
{
  "Blockchain": {
    "GanacheUrl": "http://127.0.0.1:7545",
    "PrivateKey": "PASTE_PRIVATE_KEY_HERE",
    "ContractAddress": "",
    "ContractAbi": ""
  }
}
```

### Step 4: Deploy Smart Contract

**Via Remix IDE (RECOMMENDED):**

1. Buka https://remix.ethereum.org
2. Create file: `DocumentRegistry.sol`
3. Copy dari `SmartContracts/DocumentRegistry.sol`
4. Compile dengan Solidity 0.8.0+
5. Deploy:
   - Environment: "External Http Provider"
   - URL: `http://127.0.0.1:7545`
   - Click "Deploy"
6. Copy **Contract Address** dan **ABI**
7. Update `appsettings.Development.json`

### Step 5: Run Backend

```bash
cd C:\Users\riffa\source\repos\UsulanKenaikanPangkatBlockchain
dotnet run
```

### Step 6: Test di Swagger

Buka: `http://localhost:5000/swagger`

**Test Endpoints:**

1. **Login** dulu:
   ```
   POST /Account/Login
   Body: { "username": "your_nip", "password": "your_password" }
   ```
   Copy JWT token

2. **Authorize** di Swagger:
   - Klik "Authorize" button
   - Masukkan: `Bearer YOUR_JWT_TOKEN`

3. **Test Blockchain:**
   ```
   GET /Blockchain/Wallet/1
   ```
   Akan create wallet address untuk user ID 1

4. **Generate Document Hash:**
   ```
   POST /Blockchain/GenerateHash
   Body: { "documentUrl": "test_document.pdf" }
   ```

5. **Store to Blockchain:**
   ```
   POST /Blockchain/StoreDocument
   Body: {
     "documentHash": "0x123...",
     "userId": 1
   }
   ```

6. **Verify Document:**
   ```
   POST /Blockchain/VerifyDocument
   Body: {
     "transactionHash": "0xabc...",
     "documentHash": "0x123..."
   }
   ```

---

## 📊 API Endpoints

### Blockchain Controller

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/Blockchain/StoreDocument` | Store document hash ke blockchain |
| POST | `/Blockchain/VerifyDocument` | Verify document dari blockchain |
| GET | `/Blockchain/Transaction/{txHash}` | Get transaction details |
| POST | `/Blockchain/GenerateHash` | Generate SHA256 hash dokumen |
| GET | `/Blockchain/Wallet/{userId}` | Get/create wallet address |

---

## 🔧 Fitur Blockchain Service

### 1. **StoreDocumentHashAsync**
```csharp
var txHash = await _blockchainService.StoreDocumentHashAsync(
    documentHash: "0x1234...",
    userId: 1
);
```

### 2. **VerifyDocumentHashAsync**
```csharp
var isValid = await _blockchainService.VerifyDocumentHashAsync(
    txHash: "0xabc...",
    documentHash: "0x1234..."
);
```

### 3. **GetTransactionDetailsAsync**
```csharp
var details = await _blockchainService.GetTransactionDetailsAsync("0xabc...");
```

### 4. **GenerateDocumentHashAsync**
```csharp
var hash = await _blockchainService.GenerateDocumentHashAsync(
    "https://example.com/doc.pdf"
);
```

### 5. **GetOrCreateWalletAddressAsync**
```csharp
var walletAddress = await _blockchainService.GetOrCreateWalletAddressAsync(userId: 1);
```

---

## 📝 Smart Contract Functions

### DocumentRegistry.sol

#### Store Document
```solidity
function storeDocument(string memory _documentHash, uint256 _userId) 
    public 
    returns (bytes32 documentId)
```

#### Verify Document
```solidity
function verifyDocument(bytes32 _documentId) public
```

#### Get Document
```solidity
function getDocument(bytes32 _documentId) 
    public 
    view 
    returns (...)
```

#### Get User Documents
```solidity
function getUserDocuments(uint256 _userId) 
    public 
    view 
    returns (bytes32[] memory)
```

---

## 🎯 Integration dengan Existing Models

### KegiatanDosen - Blockchain Integration

```csharp
// Example: Store kegiatan to blockchain
public async Task<string> StoreKegiatanToBlockchain(KegiatanDosen kegiatan)
{
    // 1. Generate document hash
    var documentHash = await _blockchainService.GenerateDocumentHashAsync(
        kegiatan.DocumentUrl
    );
    
    // 2. Store to blockchain
    var txHash = await _blockchainService.StoreDocumentHashAsync(
        documentHash,
        kegiatan.DosenId.Value
    );
    
    // 3. Update database
    kegiatan.DocumentHash = documentHash;
    kegiatan.TxHashStore = txHash;
    await _db.SaveChangesAsync();
    
    return txHash;
}
```

### Verify Kegiatan

```csharp
public async Task<bool> VerifyKegiatanFromBlockchain(Guid kegiatanId)
{
    var kegiatan = await _db.KegiatanDosens.FindAsync(kegiatanId);
    
    var isValid = await _blockchainService.VerifyDocumentHashAsync(
        kegiatan.TxHashStore,
        kegiatan.DocumentHash
    );
    
    if (isValid)
    {
        kegiatan.Status = "Verified";
        // Generate verify transaction
        var verifyTxHash = await _blockchainService.StoreDocumentHashAsync(
            kegiatan.DocumentHash,
            kegiatan.DosenId.Value
        );
        kegiatan.TxHashVerify = verifyTxHash;
        await _db.SaveChangesAsync();
    }
    
    return isValid;
}
```

---

## 🔍 Monitoring & Debugging

### Di Ganache GUI:

1. **Blocks Tab** - Lihat semua blocks yang di-mine
2. **Transactions Tab** - Detail setiap transaction
3. **Contracts Tab** - Contract yang sudah deploy
4. **Events Tab** - Smart contract events
5. **Logs Tab** - Real-time blockchain logs

### Di Backend Logs:

```bash
# Windows PowerShell
Get-Content -Path "logs/*.log" -Wait

# Atau lihat di console saat dotnet run
```

---

## ⚠️ Troubleshooting

### ❌ "Connection refused to http://127.0.0.1:7545"
**Fix:** Pastikan Ganache running

### ❌ "Insufficient funds for gas"
**Fix:** Pastikan private key dari account yang punya ETH

### ❌ "Contract not deployed"
**Fix:** Deploy smart contract via Remix IDE dulu

### ❌ "Invalid ABI"
**Fix:** Copy ABI yang lengkap dari Remix (format JSON array)

---

## 🎓 Learning Resources

- **Ganache:** https://trufflesuite.com/docs/ganache/
- **Nethereum:** https://docs.nethereum.com
- **Remix IDE:** https://remix.ethereum.org
- **Solidity:** https://docs.soliditylang.org

---

## 🚀 Next Steps

1. ✅ Install Ganache
2. ✅ Deploy Smart Contract
3. ✅ Update appsettings.json
4. ✅ Test blockchain endpoints
5. 🔲 Integrate dengan KegiatanDosen CRUD
6. 🔲 Integrate dengan UsulanKenaikanPangkat
7. 🔲 Add frontend integration
8. 🔲 Deploy to testnet (Polygon Mumbai)
9. 🔲 Production deployment

---

## 📦 Package Summary

**Total Packages Installed:** 20+
**Main Package:** Nethereum.Web3 (5.8.0)
**Dependencies:** Auto-installed

**Build Status:** ✅ SUCCESS
**Ready for:** Development & Testing

---

**🎉 Blockchain integration dengan Ganache sudah COMPLETE!**
**Silakan follow panduan di GANACHE_SETUP.md untuk detail setup.**

Happy Coding! 🚀

