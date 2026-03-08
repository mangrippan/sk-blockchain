# Setup Ganache untuk Blockchain Development

## 📦 Yang Dibutuhkan

### 1. **Ganache** - Local Blockchain untuk Development
Download dan install Ganache dari: https://trufflesuite.com/ganache/

**Pilihan:**
- **Ganache GUI** (Recommended untuk pemula) - Windows Desktop App
- **Ganache CLI** - Command line version

---

## 🚀 Instalasi Ganache

### Option 1: Ganache GUI (RECOMMENDED)

1. **Download Ganache:**
   - Website: https://trufflesuite.com/ganache/
   - Download versi Windows
   - Install seperti aplikasi biasa

2. **Jalankan Ganache:**
   - Buka aplikasi Ganache
   - Klik "QUICKSTART" atau "NEW WORKSPACE"
   - Default settings sudah OK:
     - RPC Server: `http://127.0.0.1:7545`
     - Network ID: `5777`
     - 10 accounts dengan 100 ETH masing-masing

### Option 2: Ganache CLI

```bash
# Install via npm
npm install -g ganache

# Jalankan Ganache
ganache --host 127.0.0.1 --port 7545
```

---

## 🔧 Konfigurasi Project

### 1. Update appsettings.Development.json

File sudah dikonfigurasi dengan default Ganache settings:

```json
{
  "Blockchain": {
    "GanacheUrl": "http://127.0.0.1:7545",
    "PrivateKey": "",
    "ContractAddress": "",
    "ContractAbi": ""
  }
}
```

### 2. Copy Private Key dari Ganache

**Di Ganache GUI:**
1. Klik icon **key (🔑)** di samping account pertama
2. Copy **PRIVATE KEY** (tanpa 0x prefix jika ada)
3. Paste ke `appsettings.Development.json`:

```json
{
  "Blockchain": {
    "GanacheUrl": "http://127.0.0.1:7545",
    "PrivateKey": "YOUR_PRIVATE_KEY_HERE",
    "ContractAddress": "",
    "ContractAbi": ""
  }
}
```

⚠️ **PENTING:** Jangan commit private key ke Git!

---

## 📜 Deploy Smart Contract ke Ganache

### Menggunakan Remix IDE (RECOMMENDED)

1. **Buka Remix IDE:**
   - Website: https://remix.ethereum.org

2. **Upload Smart Contract:**
   - Buat file baru: `DocumentRegistry.sol`
   - Copy isi dari `SmartContracts/DocumentRegistry.sol`
   - Paste ke Remix

3. **Compile Contract:**
   - Klik tab "Solidity Compiler" (icon S)
   - Pilih compiler version: `0.8.0` atau higher
   - Klik "Compile DocumentRegistry.sol"

4. **Connect ke Ganache:**
   - Klik tab "Deploy & Run Transactions" (icon Ethereum)
   - Environment: Pilih "**Injected Provider - MetaMask**" atau "**External Http Provider**"
   - Jika pilih External Http Provider, masukkan: `http://127.0.0.1:7545`

5. **Deploy Contract:**
   - Pastikan contract "DocumentRegistry" dipilih
   - Klik "Deploy"
   - Contract akan di-deploy ke Ganache

6. **Copy Contract Address & ABI:**
   - Setelah deploy, copy **Contract Address** (0x...)
   - Untuk ABI, klik icon copy di bawah contract name di Remix
   - Paste ke `appsettings.Development.json`

```json
{
  "Blockchain": {
    "GanacheUrl": "http://127.0.0.1:7545",
    "PrivateKey": "your_private_key",
    "ContractAddress": "0x1234...5678",
    "ContractAbi": "[{...}]"
  }
}
```

---

## 🧪 Testing Blockchain Integration

### 1. Start Ganache
- Pastikan Ganache running di `http://127.0.0.1:7545`

### 2. Run Backend
```bash
dotnet run
```

### 3. Test Endpoints via Swagger

Buka: `http://localhost:5000/swagger`

**Test Flow:**

#### A. Get/Create Wallet Address
```
GET /Blockchain/Wallet/{userId}
```
Response:
```json
{
  "success": true,
  "walletAddress": "0xabc...123",
  "userId": 1
}
```

#### B. Generate Document Hash
```
POST /Blockchain/GenerateHash
Body: {
  "documentUrl": "https://example.com/document.pdf"
}
```
Response:
```json
{
  "success": true,
  "documentHash": "0x1234...abcd",
  "documentUrl": "https://example.com/document.pdf"
}
```

#### C. Store Document to Blockchain
```
POST /Blockchain/StoreDocument
Body: {
  "documentHash": "0x1234...abcd",
  "userId": 1
}
```
Response:
```json
{
  "success": true,
  "transactionHash": "0xabcd...1234",
  "message": "Document hash stored successfully on blockchain"
}
```

#### D. Verify Document
```
POST /Blockchain/VerifyDocument
Body: {
  "transactionHash": "0xabcd...1234",
  "documentHash": "0x1234...abcd"
}
```
Response:
```json
{
  "success": true,
  "isValid": true,
  "message": "Document is valid"
}
```

#### E. Get Transaction Details
```
GET /Blockchain/Transaction/{txHash}
```

---

## 📊 Monitoring di Ganache

**Di Ganache GUI, Anda bisa lihat:**

1. **Accounts Tab:**
   - Saldo ETH setiap account
   - Account yang digunakan untuk transaksi

2. **Blocks Tab:**
   - Semua block yang sudah di-mine
   - Transaction di setiap block

3. **Transactions Tab:**
   - Detail setiap transaction
   - Gas used
   - TX Hash
   - Status (Success/Failed)

4. **Contracts Tab:**
   - Contract yang sudah di-deploy
   - Contract address
   - Storage

5. **Logs Tab:**
   - Real-time logs dari Ganache
   - Debugging information

---

## 🔥 Troubleshooting

### Error: "Connection refused"
- **Solusi:** Pastikan Ganache running di port 7545
- Check: `http://127.0.0.1:7545` di browser harus return JSON response

### Error: "Insufficient funds"
- **Solusi:** Pastikan account yang digunakan punya ETH
- Di Ganache, setiap account default dapat 100 ETH

### Error: "Contract not deployed"
- **Solusi:** Deploy smart contract dulu via Remix IDE
- Copy contract address ke appsettings.json

### Error: "Invalid ABI"
- **Solusi:** Copy ABI yang benar dari Remix
- Format harus JSON array: `[{...}]`

---

## 🎯 Production Deployment

Untuk production, ganti Ganache dengan:

### Option 1: Polygon Mumbai (Testnet - GRATIS)
```json
{
  "Blockchain": {
    "GanacheUrl": "https://rpc-mumbai.maticvigil.com",
    "PrivateKey": "your_production_private_key",
    "ContractAddress": "deployed_contract_address",
    "ContractAbi": "[...]"
  }
}
```

### Option 2: Polygon Mainnet (Production)
```json
{
  "Blockchain": {
    "GanacheUrl": "https://polygon-rpc.com",
    "PrivateKey": "your_production_private_key",
    "ContractAddress": "deployed_contract_address",
    "ContractAbi": "[...]"
  }
}
```

**Catatan:**
- Untuk testnet/mainnet, butuh MATIC token untuk gas fees
- Gunakan Infura/Alchemy untuk RPC endpoint yang lebih reliable
- JANGAN commit private key production ke Git!

---

## 📝 Best Practices

1. **Development:**
   - ✅ Gunakan Ganache untuk testing
   - ✅ Private key boleh hardcode di appsettings.Development.json
   - ✅ Reset Ganache bila perlu fresh start

2. **Staging:**
   - ✅ Gunakan testnet (Polygon Mumbai/Sepolia)
   - ✅ Private key dari environment variable
   - ✅ Monitor gas fees

3. **Production:**
   - ✅ Gunakan mainnet (Polygon/Ethereum)
   - ✅ Private key dari Azure Key Vault/secrets manager
   - ✅ Implement rate limiting
   - ✅ Monitor transaction costs

---

## 🆘 Support

**Resources:**
- Ganache Docs: https://trufflesuite.com/docs/ganache/
- Nethereum Docs: https://docs.nethereum.com
- Remix IDE: https://remix.ethereum.org
- Solidity Docs: https://docs.soliditylang.org

**Jika ada masalah:**
1. Check Ganache logs
2. Check backend logs (.NET)
3. Verify contract di Remix
4. Test dengan Postman/Swagger

---

**Setup selesai! Happy Coding! 🚀**

