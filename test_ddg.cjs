const https = require('https');

const queries = [
  'Curry Box website',
  'Curry Box Chennai',
  'Curry Box restaurant',
  'currybox'
];

async function search(q) {
  return new Promise((resolve) => {
    const postData = 'q=' + encodeURIComponent(q);
    const options = {
      hostname: 'lite.duckduckgo.com',
      port: 443,
      path: '/lite/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const regex = /href="([^"]+)"/gi;
        let match;
        const links = [];
        while ((match = regex.exec(data)) !== null) {
          if (match[1].startsWith('http')) {
            links.push(match[1]);
          }
        }
        resolve({ q, links });
      });
    });
    req.write(postData);
    req.end();
  });
}

async function run() {
  for (const q of queries) {
    const res = await search(q);
    console.log(`\n=== Query: "${res.q}" ===`);
    console.log(res.links.slice(0, 10).join('\n'));
  }
}

run();
