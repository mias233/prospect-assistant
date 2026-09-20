const https = require('https');

const postData = 'q=Curry+Box+Chennai+official+website';
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
  res.on('data', d => data += d);
  res.on('end', () => {
    // console.log(data.slice(0, 500));
    const regex = /<a[^>]+href="([^"]+)"[^>]*>/gi;
    let match;
    while((match = regex.exec(data)) !== null) {
      if (match[1].startsWith('http') && !match[1].includes('duckduckgo')) {
        console.log(match[1]);
      }
    }
  });
});
req.end(postData);
