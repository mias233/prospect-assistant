import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import http from 'http'
import https from 'https'

function resolveUrlPlugin() {
  return {
    name: 'resolve-url',
    configureServer(server) {
      server.middlewares.use('/api/resolve-url', (req, res) => {
        const urlParams = new URL(req.url, `http://${req.headers.host}`);
        const targetUrl = urlParams.searchParams.get('url');
        
        if (!targetUrl) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Missing url parameter' }));
          return;
        }

        const client = targetUrl.startsWith('https') ? https : http;
        
        client.get(targetUrl, (response) => {
          const expandedUrl = response.headers.location || targetUrl;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ expandedUrl }));
        }).on('error', (e) => {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: e.message }));
        });
      });

      // Add search proxy
      server.middlewares.use('/api/search', async (req, res) => {
        if (req.method === 'GET') {
          const urlParams = new URL(req.url, `http://${req.headers.host}`);
          const q = urlParams.searchParams.get('q') || '';
          const name = urlParams.searchParams.get('name') || '';
          const city = urlParams.searchParams.get('city') || '';
          
          res.setHeader('Content-Type', 'application/json');

          const checkDomain = (hostname) => {
            return new Promise((resolve) => {
              const client = hostname.startsWith('https') ? https : http;
              const reqClient = client.get(hostname, { timeout: 2500 }, (r) => {
                if (r.statusCode >= 200 && r.statusCode < 400) {
                  resolve(hostname);
                } else {
                  resolve(null);
                }
              });
              reqClient.on('error', () => resolve(null));
              reqClient.on('timeout', () => { reqClient.destroy(); resolve(null); });
            });
          };

          // 1. Direct domain check for the business name
          const cleanName = (name || q).toLowerCase().replace(/[^a-z0-9]/g, '');
          if (cleanName && cleanName.length > 2) {
            const candidateDomains = [
              `https://${cleanName}.in`,
              `https://www.${cleanName}.in`,
              `https://${cleanName}.com`,
              `https://www.${cleanName}.com`,
              `https://${cleanName}.co.in`
            ];

            for (const domain of candidateDomains) {
              const liveDomain = await checkDomain(domain);
              if (liveDomain) {
                return res.end(JSON.stringify({ website: liveDomain, source: 'direct' }));
              }
            }
          }

          // 2. DuckDuckGo search fallback
          const searchQuery = q || `${name} ${city} website`;
          const postData = `q=${encodeURIComponent(searchQuery)}`;
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
              try {
                // Parse duckduckgo lite HTML for all external http links
                const links = [];
                const regex = /href="([^"]+)"/gi;
                let match;
                while ((match = regex.exec(data)) !== null) {
                  const url = match[1];
                  if (url.startsWith('http') && !url.includes('duckduckgo.com')) {
                    links.push(url);
                  }
                }
                
                // Filter out common aggregators and social directories
                const ignoreDomains = [
                  'justdial', 'zomato', 'swiggy', 'tripadvisor', 'facebook', 'instagram', 'twitter', 'linkedin', 'youtube',
                  'yelp', 'foursquare', 'dineout', 'magicpin', 'eazydiner', 'expressavenue', 'dinefine', 'restaurant-guru',
                  'vrchennai', 'worldorgs', 'yappe', 'linktr.ee', 'wikipedia', 'google', 'bing', 'mapmyindia', 'indiamart', 'tradeindia'
                ];
                
                const bestLink = links.find(l => !ignoreDomains.some(d => l.toLowerCase().includes(d)));
                
                res.end(JSON.stringify({ website: bestLink || null, allLinks: links, source: 'ddg' }));
              } catch (e) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: e.message }));
              }
            });
          });
          
          searchReq.on('error', e => {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          });
          
          searchReq.write(postData);
          searchReq.end();
        }
      });
    }
  }
}

export default defineConfig({
  plugins: [react(), resolveUrlPlugin()],
})
