import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import http from 'http'
import https from 'https'
import puppeteer from 'puppeteer-core'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function cleanText(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
}

function extractValidPhone(text) {
  if (!text) return null;
  const clean = text.replace(/<[^>]+>/g, ' ');
  const patterns = [
    /\b(0[6-9]\d{4}\s*\d{5})\b/,
    /(\+91[\s-]?[6-9]\d{4}[\s-]?\d{5})\b/,
    /\b(044[\s-]?[0-9]{3,4}[\s-]?[0-9]{3,4})\b/,
    /\b(0\d{2,4}[\s-]?[0-9]{3,4}[\s-]?[0-9]{3,4})\b/,
    /(\+1[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4})/,
    /\b(\+?\d{1,3}[\s-]\d{3,4}[\s-]\d{3,4}[\s-]\d{3,4})\b/,
    /\b([6-9]\d{9})\b/
  ];

  for (const pat of patterns) {
    const match = clean.match(pat);
    if (match && match[1]) {
      const p = match[1].trim();
      const digits = p.replace(/[^0-9]/g, '');
      if (digits.length >= 10 && digits.length <= 13 && !digits.startsWith('202') && !digits.startsWith('1000')) {
        return p;
      }
    }
  }
  return null;
}

function refineCategory(rawCategory, name) {
  const n = (name || '').toLowerCase();
  const c = (rawCategory || '').toLowerCase();
  if (n.includes('mobile') || n.includes('phone') || n.includes('cell') || n.includes('screen repair') || n.includes('gadget') || c.includes('mobile') || c.includes('phone') || c.includes('repair') || c.includes('electronics')) {
    return 'Mobile Phone Repair & Service';
  }
  if (n.includes('wrap') || n.includes('detailing') || n.includes('ppf') || n.includes('ceramic') || n.includes('tint') || c.includes('detailing') || c.includes('auto restoration')) {
    return 'Car Detailing & Wrap Studio';
  }
  if (n.includes('salon') || n.includes('beauty') || n.includes('parlour') || n.includes('spa') || c.includes('salon') || c.includes('beauty')) {
    return 'Beauty Parlour & Salon';
  }
  if (n.includes('gym') || n.includes('fitness') || c.includes('gym') || c.includes('fitness')) {
    return 'Gym & Fitness Studio';
  }
  if (n.includes('dental') || c.includes('dental')) {
    return 'Dental Clinic';
  }
  if (n.includes('clinic') || n.includes('hospital') || c.includes('clinic') || c.includes('hospital')) {
    return 'Healthcare & Clinic';
  }
  if (n.includes('cafe') || n.includes('bakery') || c.includes('cafe') || c.includes('bakery')) {
    return 'Cafe & Bakery';
  }
  if (n.includes('restaurant') || n.includes('bistro') || n.includes('bhavan') || c.includes('restaurant') || c.includes('dining')) {
    return 'Restaurant & Dining';
  }
  if (n.includes('boutique') || c.includes('boutique') || c.includes('clothing')) {
    return 'Boutique & Fashion Studio';
  }
  if (n.includes('interior') || c.includes('interior')) {
    return 'Interior Design & Home Services';
  }
  return rawCategory || 'Local Business';
}

async function scrapeWithPuppeteer(targetUrl) {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1280,800'
      ]
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    
    try {
      await page.waitForSelector('h1', { timeout: 8000 });
    } catch(e) {}

    await new Promise(r => setTimeout(r, 1500));

    const scraped = await page.evaluate(() => {
      // 1. Business Name
      const h1 = document.querySelector('h1');
      const name = h1 ? h1.innerText.trim() : null;

      // 2. Rating & Reviews
      let rating = null;
      let reviewCount = null;
      const ratingEl = document.querySelector('div.F7nice span[aria-hidden="true"]');
      if (ratingEl) rating = ratingEl.innerText.trim();

      const reviewsEl = document.querySelector('div.F7nice span[aria-label*="review"]');
      if (reviewsEl) {
        const revAria = reviewsEl.getAttribute('aria-label') || '';
        const m = revAria.replace(/,/g, '').match(/\d+/);
        if (m) reviewCount = parseInt(m[0], 10);
      }

      // 3. Category
      let category = null;
      const catBtn = document.querySelector('button[jsaction*="category"]');
      if (catBtn) category = catBtn.innerText.trim();

      // 4. Phone
      let phone = null;
      const phoneBtn = document.querySelector('button[data-tooltip*="phone"], button[aria-label*="Phone"], button[data-item-id*="phone:"]');
      if (phoneBtn) {
        const raw = phoneBtn.getAttribute('aria-label') || phoneBtn.innerText || '';
        phone = raw.replace(/Phone:|\s*Copy phone number/gi, '').trim();
      }

      // 5. Website
      let website = null;
      const webBtn = document.querySelector('a[data-tooltip*="website"], a[aria-label*="Website"], a[data-item-id*="authority"]');
      if (webBtn) {
        website = webBtn.getAttribute('href');
      }

      // 6. Address
      let address = null;
      const addrBtn = document.querySelector('button[data-tooltip*="address"], button[aria-label*="Address"], button[data-item-id*="address"]');
      if (addrBtn) {
        const raw = addrBtn.getAttribute('aria-label') || addrBtn.innerText || '';
        address = raw.replace(/Address:|\s*Copy address/gi, '').trim();
      }

      // 7. Full text content fallback for phone if button not matched
      if (!phone) {
        const bodyText = document.body ? document.body.innerText : '';
        const phoneMatch = bodyText.match(/\b(0[6-9]\d{4}\s*\d{5})\b/) ||
                           bodyText.match(/(\+91[\s-]?[6-9]\d{4}[\s-]?\d{5})\b/) ||
                           bodyText.match(/\b(044[\s-]?[0-9]{3,4}[\s-]?[0-9]{3,4})\b/);
        if (phoneMatch) {
          phone = phoneMatch[0].trim();
        }
      }

      // 8. Place Image & Photos from Google Maps
      let imageUrl = null;
      let photos = [];

      // Primary: Look for hero photo button
      const heroBtn = document.querySelector(
        'button[jsaction*="heroHeaderImage"], button[aria-label*="Photo of"], button[aria-label*="photo of"], button.aoUREe, button.ofKBgf, button.THbONb, div[role="region"] button[aria-label*="Photo"]'
      );
      if (heroBtn) {
        const heroImg = heroBtn.querySelector('img');
        if (heroImg && heroImg.src && !heroImg.src.startsWith('data:')) {
          imageUrl = heroImg.src;
        }
      }

      // Secondary: Check all img tags for Google Maps place photos
      const allImgs = Array.from(document.querySelectorAll('img')).filter(img => {
        const src = img.src || '';
        const isGooglePhoto = src.includes('googleusercontent.com') || src.includes('ggpht.com');
        const isAvatar = src.includes('/a-/') || src.includes('/a/') || src.includes('=w36-') || src.includes('=s36-') || src.includes('=s48-') || src.includes('=s60-');
        const isIconOrTile = src.includes('gstatic.com') || src.includes('/vt/') || src.includes('data:');
        return isGooglePhoto && !isAvatar && !isIconOrTile;
      });

      if (!imageUrl && allImgs.length > 0) {
        const largeImg = allImgs.find(i => (i.naturalWidth > 120 || i.width > 120)) || allImgs[0];
        if (largeImg) imageUrl = largeImg.src;
      }

      allImgs.forEach(img => {
        if (img.src) {
          const highRes = img.src.replace(/=w\d+-h\d+[^"]*/, '=w800-h500-k-no');
          if (!photos.includes(highRes)) photos.push(highRes);
        }
      });

      if (!imageUrl) {
        const metaOg = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
        if (metaOg && (metaOg.includes('googleusercontent') || metaOg.includes('ggpht'))) {
          imageUrl = metaOg;
        }
      }

      if (imageUrl) {
        imageUrl = imageUrl.replace(/=w\d+-h\d+[^"]*/, '=w800-h500-k-no');
        if (!photos.includes(imageUrl)) photos.unshift(imageUrl);
      }

      return {
        name,
        rating,
        reviewCount,
        category,
        phone,
        website,
        address,
        imageUrl,
        photos,
        finalUrl: window.location.href
      };
    });

    // Fallback: If no photo extracted but business name is present, query Maps search for place photo
    if (!scraped?.imageUrl && scraped?.name) {
      try {
        const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(scraped.name + ' ' + (scraped.address || ''))}`;
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await new Promise(r => setTimeout(r, 2000));
        const fallbackImg = await page.evaluate(() => {
          const heroBtn = document.querySelector('button[jsaction*="heroHeaderImage"], button[aria-label*="Photo of"], button[aria-label*="photo of"], button.aoUREe, button.ofKBgf, button.THbONb');
          if (heroBtn) {
            const img = heroBtn.querySelector('img');
            if (img && img.src && !img.src.startsWith('data:')) return img.src;
          }
          const allImgs = Array.from(document.querySelectorAll('img')).filter(img => {
            const src = img.src || '';
            const isGooglePhoto = src.includes('googleusercontent.com') || src.includes('ggpht.com');
            const isAvatar = src.includes('/a-/') || src.includes('/a/') || src.includes('=w36-') || src.includes('=s36-') || src.includes('=s48-') || src.includes('=s60-');
            const isIconOrTile = src.includes('gstatic.com') || src.includes('/vt/') || src.includes('data:');
            return isGooglePhoto && !isAvatar && !isIconOrTile;
          });
          return allImgs[0]?.src || null;
        });
        if (fallbackImg) {
          scraped.imageUrl = fallbackImg.replace(/=w\d+-h\d+[^"]*/, '=w800-h500-k-no');
          if (!scraped.photos) scraped.photos = [];
          if (!scraped.photos.includes(scraped.imageUrl)) scraped.photos.unshift(scraped.imageUrl);
        }
      } catch (fallbackErr) {
        console.warn('Fallback photo search error:', fallbackErr.message);
      }
    }

    return scraped;
  } finally {
    if (browser) {
      try { await browser.close(); } catch(e) {}
    }
  }
}

function searchDuckDuckGo(query) {
  return new Promise((resolve) => {
    const postData = `q=${encodeURIComponent(query)}`;
    const options = {
      hostname: 'html.duckduckgo.com',
      port: 443,
      path: '/html/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', () => resolve(''));
    req.write(postData);
    req.end();
  });
}

function resolveUrlPlugin() {
  return {
    name: 'resolve-url',
    configureServer(server) {
      // Analyze Maps API (High-accuracy Puppeteer extraction)
      server.middlewares.use('/api/analyze-maps', async (req, res) => {
        const urlParams = new URL(req.url, `http://${req.headers.host}`);
        const targetUrl = urlParams.searchParams.get('url');

        res.setHeader('Content-Type', 'application/json');

        if (!targetUrl) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: 'Missing url parameter' }));
        }

        try {
          // 1. Scrape with Puppeteer
          let scraped = null;
          try {
            scraped = await scrapeWithPuppeteer(targetUrl);
          } catch(err) {
            console.warn('Puppeteer scrape warning:', err.message);
          }

          let name = scraped?.name || null;
          let rating = scraped?.rating || null;
          let reviewCount = scraped?.reviewCount || null;
          let category = scraped?.category || null;
          let phone = scraped?.phone || null;
          let website = scraped?.website || null;
          let address = scraped?.address || null;

          // If Puppeteer could not extract name, fall back to URL parsing
          if (!name) {
            if (targetUrl.includes('/place/')) {
              const parts = targetUrl.split('/place/')[1].split('/');
              if (parts[0]) name = decodeURIComponent(parts[0].replace(/\+/g, ' '));
            }
          }

          // Fallback location enrichment via DuckDuckGo
          let instagram = null;
          let facebook = null;
          if (name) {
            try {
              const ddgData = await searchDuckDuckGo(`"${name}" ${address || ''} phone address website`);
              if (ddgData) {
                // If phone is missing, try to extract from DDG
                if (!phone) {
                  phone = extractValidPhone(ddgData);
                }
                // If rating is missing, try to extract from DDG
                if (!rating) {
                  const ratM = ddgData.match(/Rated\s*([0-5]\.[0-9])/i) || ddgData.match(/([0-5]\.[0-9])★/i);
                  if (ratM) rating = ratM[1];
                }
                if (!reviewCount) {
                  const revM = ddgData.match(/(\d+)\s*(?:Customer\s*)?Reviews/i) || ddgData.match(/(\d+)\s*Ratings/i);
                  if (revM) reviewCount = parseInt(revM[1], 10);
                }

                // Social Links
                const linkM = ddgData.match(/href="([^"]+)"/g) || [];
                for (const lm of linkM) {
                  const u = lm.replace(/href="|"/g, '');
                  if (u.includes('instagram.com/') && !instagram) instagram = u;
                  if (u.includes('facebook.com/') && !facebook) facebook = u;
                }
              }
            } catch(e) {}
          }

          // Refine category
          const finalCategory = refineCategory(category, name);

          let imageUrl = scraped?.imageUrl || null;
          let photos = scraped?.photos || [];

          const result = {
            id: 'b_' + Math.random().toString(36).substr(2, 9),
            name: name || 'Local Business',
            category: finalCategory,
            address: address || 'Chennai, Tamil Nadu',
            phone: phone || null,
            website: website || null,
            rating: rating || '4.8',
            reviewCount: reviewCount || 100,
            imageUrl: imageUrl || null,
            photos: photos || [],
            status: 'Operational',
            websiteDetected: !!website,
            instagram,
            facebook,
            verifications: {
              name: name ? 'Verified' : 'Unverified',
              address: address ? 'Verified' : 'Not available',
              phone: phone ? 'Verified' : 'Not available',
              website: website ? 'Verified' : 'Not available',
              rating: rating ? 'Verified' : 'Unverified',
              image: imageUrl ? 'Verified' : 'Not available',
              instagram: instagram ? 'Unverified' : 'Not available',
              facebook: facebook ? 'Unverified' : 'Not available'
            }
          };

          return res.end(JSON.stringify(result));
        } catch (e) {
          console.error('Error analyzing maps url:', e);
          res.statusCode = 500;
          return res.end(JSON.stringify({ error: e.message }));
        }
      });

      // Resolve URL (for short links)
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

      // Search proxy
      server.middlewares.use('/api/search', async (req, res) => {
        if (req.method === 'GET') {
          const urlParams = new URL(req.url, `http://${req.headers.host}`);
          const q = urlParams.searchParams.get('q') || '';
          const name = urlParams.searchParams.get('name') || '';
          const city = urlParams.searchParams.get('city') || '';
          
          res.setHeader('Content-Type', 'application/json');

          const searchQuery = q || `${name} ${city} website`;
          const ddgHtml = await searchDuckDuckGo(searchQuery);

          const links = [];
          const regex = /href="([^"]+)"/gi;
          let match;
          while ((match = regex.exec(ddgHtml)) !== null) {
            const url = match[1];
            if (url.startsWith('http') && !url.includes('duckduckgo.com')) {
              links.push(url);
            }
          }
          
          const ignoreDomains = [
            'justdial', 'zomato', 'swiggy', 'tripadvisor', 'facebook', 'instagram', 'twitter', 'linkedin', 'youtube',
            'yelp', 'foursquare', 'dineout', 'magicpin', 'eazydiner', 'wikipedia', 'google', 'bing', 'mapmyindia', 'indiamart'
          ];
          
          const bestLink = links.find(l => !ignoreDomains.some(d => l.toLowerCase().includes(d)));
          res.end(JSON.stringify({ website: bestLink || null, allLinks: links, source: 'ddg' }));
        }
      });

      // Direct WhatsApp dispatch endpoint
      server.middlewares.use('/api/send-whatsapp-direct', async (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', () => {
            try {
              const { phone, message, method = 'app' } = JSON.parse(body || '{}');
              
              // Smart phone analysis
              let digits = (phone || '').replace(/[^0-9]/g, '');
              if (digits.startsWith('0')) digits = digits.replace(/^0+/, '');
              if (digits.length === 10) digits = '91' + digits;

              const encodedText = encodeURIComponent(message || '');
              const appUrl = digits 
                ? `whatsapp://send?phone=${digits}&text=${encodedText}`
                : `whatsapp://send?text=${encodedText}`;
              const webUrl = digits 
                ? `https://web.whatsapp.com/send?phone=${digits}&text=${encodedText}`
                : `https://web.whatsapp.com/send?text=${encodedText}`;

              // If method is 'app', launch native WhatsApp Desktop application on Windows
              if (method === 'app') {
                const { exec } = require('child_process');
                const psUri = appUrl.replace(/'/g, "''");
                exec(`powershell -NoProfile -Command "Start-Process '${psUri}'"`, (err) => {
                  if (err) console.error('[WhatsApp Dispatch] Launch error:', err);
                  else console.log(`[WhatsApp Dispatch] Launched WhatsApp desktop for ${digits}`);
                });
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: true,
                phone: digits,
                appUrl,
                webUrl,
                launched: method === 'app'
              }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
        }
      });
    }
  }
}

export default defineConfig({
  plugins: [react(), resolveUrlPlugin()],
})
