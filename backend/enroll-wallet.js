'use strict';

const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function main() {
    const walletPath = path.resolve(__dirname, '../fabric-config/wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const cryptoPath = path.resolve(__dirname, '../fabric-network/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com');
    
    // Find the private key file dynamically
    const keystorePath = path.join(cryptoPath, 'users/Admin@org1.example.com/msp/keystore');
    const keyFiles = fs.readdirSync(keystorePath);
    const keyFile = keyFiles.find(f => f.endsWith('_sk'));
    if (!keyFile) {
        throw new Error('No private key file found in keystore');
    }

    const certPath = path.join(cryptoPath, 'users/Admin@org1.example.com/msp/signcerts/cert.pem');
    const keyPath = path.join(keystorePath, keyFile);

    const certificate = fs.readFileSync(certPath).toString();
    const privateKey = fs.readFileSync(keyPath).toString();

    console.log('Certificate subject (first line):', certificate.split('\n')[0]);
    console.log('Private key (first line):', privateKey.split('\n')[0]);

    const identity = {
        credentials: { certificate, privateKey },
        mspId: 'Org1MSP',
        type: 'X.509'
    };

    await wallet.put('admin', identity);
    console.log('✅ admin identity added to wallet');

    await wallet.put('appUser', identity);
    console.log('✅ appUser identity added to wallet');

    const ids = await wallet.list();
    console.log('Wallet identities:', ids);
}

main().catch(e => { console.error(e); process.exit(1); });
