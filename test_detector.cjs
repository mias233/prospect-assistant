const https = require('https');
const http = require('http');

function searchDDGLite(q) {
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

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const links = [];
        // Match links in result-link standard
        const regex = /href="([^"]+)"/gi;
        let match;
        while ((match = regex.exec(data)) !== null) {
          const url = match[1];
          if (url.startsWith('http') && !url.includes('duckduckgo.com')) {
            links.push(url);
          }
        }

        // Also check if any text/snippet mentions a domain like xxx.in or xxx.com
        const domainRegex = /\b([a-z0-9-]+\.(?:in|com|co\.in|org|net))\b/gi;
        let domainMatch;
        while ((domainMatch = domainRegex.exec(data)) !== null) {
          const foundDomain = domainMatch[1].toLowerCase();
          if (!['duckduckgo.com', 'w3.org', 'schema.org', 'zomato.com', 'swiggy.com', 'facebook.com', 'instagram.com', 'justdial.com'].includes(foundDomain)) {
            // Found a domain mentioned in search results!
            links.push(`https://www.${foundDomain}`);
          }
        }

        resolve(links);
      });
    });
    req.on('error', () => resolve([]));
    req.write(postData);
    req.end();
  });
}

function checkDomainExists(hostname) {
  return new Promise(resolve => {
    const req = https.get(`https://${hostname}`, { timeout: 3000 }, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        resolve(`https://${hostname}`);
      } else {
        resolve(null);
      }
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

async function detectWebsite(businessName, city) {
  const ignoreDomains = [
    'justdial', 'zomato', 'swiggy', 'tripadvisor', 'facebook', 'instagram', 'youtube', 'twitter', 'linkedin',
    'yelp', 'foursquare', 'dineout', 'magicpin', 'eazydiner', 'google', 'bing', 'mapmyindia',
    'expressavenue', 'dinefine', 'restaurant-guru', 'vrchennai', 'worldorgs', 'yappe', 'linktr.ee', 'wikipedia'
  ];

  console.log(`Detecting website for "${businessName}" in "${city}"...`);

  // Try direct domain variations first (e.g. currybox.in, currybox.com)
  const cleanName = businessName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const candidateDomains = [
    `${cleanName}.in`,
    `www.${cleanName}.in`,
    `${cleanName}.com`,
    `www.${cleanName}.com`
  ];

  for (const domain of candidateDomains) {
    const exists = await checkDomainExists(domain);
    if (exists) {
      console.log(`FOUND via direct domain check: ${exists}`);
      return exists;
    }
  }

  // Try multiple DDG search queries
  const queries = [
    `${businessName} official website`,
    `${businessName} ${city} website`,
    `${businessName} ${city}`,
    `${businessName} website`
  ];

  for (const q of queries) {
    const links = await searchDDGLite(q);
    const validLink = links.find(l => !ignoreDomains.some(d => l.toLowerCase().includes(d)));
    if (validLink) {
      console.log(`FOUND via search query "${q}": ${validLink}`);
      return validLink;
    }
  }

  console.log('No website detected.');
  return null;
}

detectWebsite('Curry Box', 'Chennai');
