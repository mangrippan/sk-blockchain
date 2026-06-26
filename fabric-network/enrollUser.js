'use strict';

/**
 * Enroll appUser for backend to interact with Fabric network
 * Run after network is started
 */

const { Wallets, Gateway } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const WALLET_PATH = path.join(PROJECT_ROOT, 'fabric-config', 'wallet');
const CCP_PATH = path.join(PROJECT_ROOT, 'fabric-config', 'connection-org1.json');

// A wallet identity that merely *exists* is not the same as one that is still
// *trusted* -- if the network's crypto material is regenerated (new CA root,
// same CN, e.g. "CN=ca.org1.example.com"), the old wallet cert keeps loading
// successfully but every transaction it signs is rejected by peer MSPs as
// "not connected". This happened on 2026-06-06: the wallet kept "looking"
// enrolled (file present, cert parses fine) while being signed by a CA
// instance the network no longer trusted. checkIssued() confirms the issuer
// DN matches the current root's subject DN, and verify() cryptographically
// confirms the cert's signature actually chains to that specific root's key
// -- the second check is what catches "same CN, different CA instance".
function isIdentitySignedByCurrentCA(identityCertPem, caRootCertPem) {
  try {
    const identityCert = new crypto.X509Certificate(identityCertPem);
    const caRootCert = new crypto.X509Certificate(caRootCertPem);
    return identityCert.checkIssued(caRootCert) && identityCert.verify(caRootCert.publicKey);
  } catch (err) {
    console.warn(`⚠️  Could not validate certificate issuer (treating as untrusted): ${err.message}`);
    return false;
  }
}

// Returns the wallet identity only if it both exists AND was issued by the CA
// root the network currently trusts; otherwise returns null so the caller
// re-enrolls (overwriting the stale entry via wallet.put, as it already does).
async function getTrustedIdentity(wallet, identityName, caRootCertPem) {
  const identity = await wallet.get(identityName);
  if (!identity) return null;

  const certificate = identity.credentials && identity.credentials.certificate;
  if (!certificate || !isIdentitySignedByCurrentCA(certificate, caRootCertPem)) {
    console.warn(`⚠️  Wallet identity "${identityName}" exists but was NOT issued by the currently-trusted CA root`);
    console.warn('   (the network crypto material was likely regenerated since this identity was enrolled --');
    console.warn('   see docs/E2E_TEST_REPORT.md root-cause #1). Treating it as stale and re-enrolling...');
    return null;
  }
  return identity;
}

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

    // The connection profile's CA tlsCACerts.pem is the CA's own root cert --
    // for the test-network's fabric-ca setup, the CA serves TLS using its own
    // signing root (tls.certfile = ca-cert.pem), so this is the same root that
    // signs every identity it enrolls. Comparing wallet identities against it
    // lets us detect a regenerated CA without an extra network round-trip.
    const caCertEntry = ccp.certificateAuthorities['ca.org1.example.com'].tlsCACerts.pem;
    const caRootCertPem = Array.isArray(caCertEntry) ? caCertEntry[0] : caCertEntry;

    // Create wallet
    const wallet = await Wallets.newFileSystemWallet(WALLET_PATH);

    // Check if admin already enrolled (and still trusted by the current CA root)
    const adminIdentity = await getTrustedIdentity(wallet, 'admin', caRootCertPem);
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

    // Check if appUser already registered (and still trusted by the current CA root)
    const userIdentity = await getTrustedIdentity(wallet, 'appUser', caRootCertPem);
    if (!userIdentity) {
      console.log('📋 Registering appUser...');

      // Connect as admin to register new user. Re-fetch from the wallet rather
      // than reusing `adminIdentity` -- if admin was just re-enrolled above,
      // wallet.get() returns the freshly-stored (trusted) identity.
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
