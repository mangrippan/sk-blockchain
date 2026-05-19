'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

function httpRequest(options, body) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error(`Invalid JSON: ${data}`));
                }
            });
        });
        req.on('error', reject);
        if (body) {
            if (typeof body === 'string') req.write(body);
            else req.write(JSON.stringify(body));
        }
        req.end();
    });
}

function httpMultipart(options, fields, file) {
    return new Promise((resolve, reject) => {
        const boundary = '----FormBoundary' + Date.now().toString(16);
        let body = '';
        
        // Add fields
        for (const [key, value] of Object.entries(fields)) {
            body += `--${boundary}\r\n`;
            body += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
            body += `${value}\r\n`;
        }
        
        // Add file
        body += `--${boundary}\r\n`;
        body += `Content-Disposition: form-data; name="file"; filename="${file.name}"\r\n`;
        body += `Content-Type: ${file.type}\r\n\r\n`;
        
        const ending = `\r\n--${boundary}--\r\n`;
        
        options.headers = options.headers || {};
        options.headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`;
        
        const bodyBuffer = Buffer.concat([
            Buffer.from(body),
            file.data,
            Buffer.from(ending)
        ]);
        
        options.headers['Content-Length'] = bodyBuffer.length;
        
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error(`Invalid JSON: ${data}`));
                }
            });
        });
        req.on('error', reject);
        req.write(bodyBuffer);
        req.end();
    });
}

async function main() {
    console.log('=== API Integration Test ===\n');

    // Step 1: Login
    console.log('1. Logging in...');
    const loginRes = await httpRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, { email: 'budi.santoso@prima.ipb', password: 'admin123' });

    const token = loginRes.token || (loginRes.data && loginRes.data.token);
    if (!token) {
        console.error('Login failed:', JSON.stringify(loginRes, null, 2));
        process.exit(1);
    }
    console.log('   ✅ Login successful\n');

    // Step 2: Create kegiatan with file
    console.log('2. Creating kegiatan with file...');
    
    // Create a small dummy PDF-like file
    const dummyPdf = Buffer.from('%PDF-1.4 dummy test file content for blockchain verification ' + Date.now());
    
    const kegiatanRes = await httpMultipart({
        hostname: 'localhost',
        port: 3000,
        path: '/api/v1/kegiatan',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    }, {
        ref_kegiatan_id: '1',
        judul: 'Test Blockchain Recording ' + Date.now(),
        tanggal_mulai: '2026-01-01',
        tanggal_selesai: '2026-01-02',
        deskripsi: 'Testing blockchain integration'
    }, {
        name: 'test-document.pdf',
        type: 'application/pdf',
        data: dummyPdf
    });

    console.log('   Response:', JSON.stringify(kegiatanRes, null, 2));
    
    const data = kegiatanRes.data || kegiatanRes;
    if (data.id) {
        console.log('\n   Kegiatan ID:', data.id);
        console.log('   tx_id_fabric:', data.tx_id_fabric || 'NULL ❌');
        if (data.tx_id_fabric) {
            console.log('\n   🎉 BLOCKCHAIN RECORDING SUCCESSFUL!');
        } else {
            console.log('\n   ⚠️  Blockchain still not recording');
        }
    }
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
