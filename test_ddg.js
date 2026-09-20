const https = require('https');

const postData = 'q=' + encodeURIComponent('Curry Box Chennai official website');
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
    console.log('HTML Length:', data.length);
    // Find all hrefs
    const regex = /href="([^"]+)"/gi;
    let match;
    const links = [];
    while ((match = regex.exec(data)) !== null) {
      links.push(match[1]);
    }
    console.log('All hrefs found:', links);
  });
});

req.write(postData);
req.end();
