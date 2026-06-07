'use strict';

/**
 * Enroll appUser for backend to interact with Fabric network
 * Run after network is started
 */

const { Wallets, Gateway } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const WALLET_PATH = path.join(PROJECT_ROOT, 'fabric-config', 'wallet');
const CCP_PATH = path.join(PROJECT_ROOT, 'fabric-config', 'connection-org1.json');

async function main() {
  try {
    // Load connection profile
    if (!fs.existsSync(CCP_PATH)) {
      console.error('❌ Connection profile not found at:', CCP_PATH);
      process.exit(1);
    }
    const ccp = JSON.parse(fs.readFileSync(CCP_PATH, 'utf8'));

    // Create CA client. Rewrite "localhost" to the IPv4 loopback literal --
    // Docker Desktop on Windows publishes the CA port on 127.0.0.1 but not
    // reliably on the IPv6 loopback (::1), and Node's https client resolves
    // "localhost" to ::1 first, causing ETIMEDOUT.
    const caURL = ccp.certificateAuthorities['ca.org1.example.com'].url.replace('localhost', '127.0.0.1');
    const ca = new FabricCAServices(caURL);

    // Create wallet
    const wallet = await Wallets.newFileSystemWallet(WALLET_PATH);

    // Check if admin already enrolled
    const adminIdentity = await wallet.get('admin');
    if (!adminIdentity) {
      console.log('📋 Enrolling admin...');
      const enrollment = await ca.enroll({
        enrollmentID: 'admin',
        enrollmentSecret: 'adminpw',
      });
      const x509Identity = {
        credentials: {
          certificate: enrollment.certificate,
          privateKey: enrollment.key.toBytes(),
        },
        mspId: 'Org1MSP',
        type: 'X.509',
      };
      await wallet.put('admin', x509Identity);
      console.log('✅ Admin enrolled');
    } else {
      console.log('✅ Admin already enrolled');
    }

    // Check if appUser already registered
    const userIdentity = await wallet.get('appUser');
    if (!userIdentity) {
      console.log('📋 Registering appUser...');

      // Connect as admin to register new user
      const adminId = await wallet.get('admin');
      const provider = wallet.getProviderRegistry().getProvider(adminId.type);
      const adminUser = await provider.getUserContext(adminId, 'admin');

      const secret = await ca.register({
        affiliation: 'org1.department1',
        enrollmentID: 'appUser',
        role: 'client',
        // The chaincode's _checkRole() reads a custom 'role' ABAC attribute
        // from the certificate (ctx.clientIdentity.getAttributeValue('role'))
        // to gate admin-only functions (TerbitkanSkKenaikanPangkat,
        // ProsesUsulanKenaikanPangkat, TolakUsulanKenaikanPangkat,
        // VerifyKegiatan, GetAllKegiatan). The backend uses this single
        // identity for every transaction regardless of which end-user is
        // acting -- access control per end-user is already enforced by the
        // Express checkRole() middleware -- so this identity needs the
        // highest-privilege ABAC role for the chaincode to accept those calls.
        attrs: [{ name: 'role', value: 'admin_sdm', ecert: true }],
      }, adminUser);

      const enrollment = await ca.enroll({
        enrollmentID: 'appUser',
        enrollmentSecret: secret,
        attr_reqs: [{ name: 'role', optional: false }],
      });

      const x509Identity = {
        credentials: {
          certificate: enrollment.certificate,
          privateKey: enrollment.key.toBytes(),
        },
        mspId: 'Org1MSP',
        type: 'X.509',
      };
      await wallet.put('appUser', x509Identity);
      console.log('✅ appUser registered and enrolled');
    } else {
      console.log('✅ appUser already enrolled');
    }

    console.log('');
    console.log('✅ Wallet ready at:', WALLET_PATH);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
