const https = require('https');
const http = require('http');

const testUrls = [
  'https://www.currybox.in',
  'https://currybox.in',
  'https://www.currybox.com',
  'https://currybox.com',
  'https://curryboxme.com',
  'https://www.curryboxchennai.com'
];

testUrls.forEach(url => {
  const client = url.startsWith('https') ? https : http;
  const req = client.get(url, { timeout: 3000 }, (res) => {
    console.log(url, '=> Status:', res.statusCode);
  });
  req.on('error', (e) => {
    console.log(url, '=> Error:', e.message);
  });
  req.on('timeout', () => {
    req.destroy();
    console.log(url, '=> Timeout');
  });
});
