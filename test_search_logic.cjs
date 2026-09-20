const https = require('https');

function testSearch(q) {
  return new Promise(resolve => {
    const postData = `q=${encodeURIComponent(q)}`;
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
        const links = [];
        const regex = /<a[^>]+class="[^"]*result-url[^"]*"[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
        let match;
        while ((match = regex.exec(data)) !== null) {
          links.push(match[1].trim());
        }
        
        const ignoreDomains = [
          'justdial', 'zomato', 'swiggy', 'tripadvisor', 'facebook', 'instagram', 'yelp', 'foursquare', 'dineout', 'magicpin', 'eazydiner', 'google', 'map',
          'expressavenue', 'dinefine', 'restaurant-guru', 'vrchennai', 'worldorgs', 'yappe', 'linktr.ee', 'wikipedia'
        ];
        
        console.log('Query:', q);
        console.log('All links found with regex:', links);
        const bestLink = links.find(l => !ignoreDomains.some(d => l.toLowerCase().includes(d)));
        console.log('Best link selected:', bestLink);
        resolve(bestLink);
      });
    });
    
    searchReq.write(postData);
    searchReq.end();
  });
}

testSearch('Curry Box Chennai, Tamil Nadu official website');
