const https = require('https');

const postData = `q=${encodeURIComponent('Curry Box Chennai official website')}`;
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

const searchReq = https.request(options, (searchRes) => {
  let data = '';
  searchRes.on('data', chunk => data += chunk);
  searchRes.on('end', () => {
    const tableIndex = data.indexOf('<table');
    console.log(data.substring(tableIndex, tableIndex + 4000));
  });
});

searchReq.write(postData);
searchReq.end();
