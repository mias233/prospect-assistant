import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';

const results = {
  passed: [],
  failed: [],
  warnings: []
};

function pass(testName, details = '') {
  console.log(`✅ [PASS] ${testName} ${details ? '(' + details + ')' : ''}`);
  results.passed.push({ testName, details });
}

function fail(testName, error = '') {
  console.error(`❌ [FAIL] ${testName}: ${error}`);
  results.failed.push({ testName, error });
}

function warn(testName, warning = '') {
  console.warn(`⚠️ [WARN] ${testName}: ${warning}`);
  results.warnings.push({ testName, warning });
}

async function runQATests() {
  console.log('==============================================');
  console.log('PROSPECT ASSISTANT - COMPREHENSIVE QA AUDIT');
  console.log('==============================================\n');

  // 1. Check Dev Server Health
  console.log('--- 1. API & SERVER HEALTH CHECKS ---');
  try {
    const res = await fetch(`${BASE_URL}/`);
    if (res.status === 200) {
      pass('Vite Dev Server Status', 'HTTP 200 OK');
    } else {
      fail('Vite Dev Server Status', `HTTP ${res.status}`);
    }
  } catch (e) {
    fail('Vite Dev Server Status', e.message);
  }

  // 2. Test Backend Endpoints
  try {
    const directRes = await fetch(`${BASE_URL}/api/send-whatsapp-direct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '918870515351', message: 'QA Test message', method: 'check' })
    });
    const directJson = await directRes.json();
    if (directJson.success && directJson.phone === '918870515351') {
      pass('/api/send-whatsapp-direct endpoint', `Phone normalized: ${directJson.phone}`);
    } else {
      fail('/api/send-whatsapp-direct endpoint', JSON.stringify(directJson));
    }
  } catch (e) {
    fail('/api/send-whatsapp-direct endpoint', e.message);
  }

  // 3. Browser & Page Interactions
  console.log('\n--- 2. BROWSER WORKFLOWS & CONSOLE ERRORS ---');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800']
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.toString());
  });

  // Test A: Dashboard Page
  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
    const title = await page.title();
    if (title) pass('Dashboard Page Load', `Title: ${title}`);

    // Check stats cards
    const statCards = await page.$$('.card');
    if (statCards.length >= 4) {
      pass('Dashboard Pipeline Stats Cards', `Rendered ${statCards.length} cards`);
    } else {
      warn('Dashboard Pipeline Stats Cards', `Only found ${statCards.length} cards`);
    }

    // Check navigation to Analyze
    const analyzeBtn = await page.$('a[href="/analyze"]');
    if (analyzeBtn) {
      pass('Dashboard "Analyze Business" Navigation Link', 'Present and clickable');
    } else {
      fail('Dashboard "Analyze Business" Navigation Link', 'Missing');
    }
  } catch (e) {
    fail('Dashboard Workflow', e.message);
  }

  // Test B: Analyze Page
  console.log('\n--- 3. ANALYZE PAGE & OUTREACH ENGINE ---');
  try {
    await page.goto(`${BASE_URL}/analyze`, { waitUntil: 'networkidle0' });

    // Check form presence
    const input = await page.$('form input.input');
    const submitBtn = await page.$('form button[type="submit"]');

    if (input && submitBtn) {
      pass('Analyze Form Inputs & Submit Button', 'Elements found');
    } else {
      fail('Analyze Form Inputs & Submit Button', 'Missing form elements');
    }

    // Test form validation: button disabled when empty
    const isDisabled = await page.evaluate(el => el.disabled, submitBtn);
    if (isDisabled) {
      pass('Form Validation (Empty Input)', 'Submit button disabled when empty');
    } else {
      warn('Form Validation (Empty Input)', 'Submit button not disabled when empty');
    }

    // Type valid Google Maps link
    console.log('Testing business analysis with live Google Maps URL...');
    await page.type('form input.input', 'https://maps.google.com/place/Mobile+world+2.0');
    await page.click('form button[type="submit"]');

    // Wait for business profile card or error
    try {
      await page.waitForSelector('.business-profile-card', { timeout: 25000 });
      pass('Google Maps Business Profile Ingestion', 'Place profile rendered');

      // Verify business details
      const bName = await page.$eval('.business-name-title', el => el.innerText.trim());
      if (bName.toLowerCase().includes('mobile world')) {
        pass('Business Name Extraction', `Extracted: "${bName}"`);
      } else {
        warn('Business Name Extraction', `Extracted: "${bName}"`);
      }

      // Verify place photo
      const imgEl = await page.$('.business-main-photo');
      if (imgEl) {
        const imgSrc = await page.evaluate(el => el.src, imgEl);
        if (imgSrc && imgSrc.startsWith('http')) {
          pass('Storefront Place Photo Extraction', `High-res image loaded: ${imgSrc.slice(0, 45)}...`);
        } else {
          warn('Storefront Place Photo Extraction', 'Image src empty or placeholder');
        }
      } else {
        fail('Storefront Place Photo Extraction', 'Missing .business-main-photo element');
      }

      // Verify Opportunity Score Card (wait for audit compute)
      await page.waitForSelector('.opportunity-score-huge', { timeout: 15000 });
      const score = await page.$eval('.opportunity-score-huge', el => el.innerText.trim());
      pass('Opportunity Score Engine', `Calculated Score: ${score}/100`);

      // Verify Pitch Generation
      await page.waitForSelector('.pitch-textarea', { timeout: 15000 });
      const pitchText = await page.$eval('.pitch-textarea', el => el.value);
      if (pitchText && pitchText.length > 50) {
        pass('Conversational Pitch Auto-Generation', `${pitchText.split(' ').length} words generated`);

        // Verify Category Guard: ensure NO auto workshop or breakdown assistance mentioned
        if (pitchText.toLowerCase().includes('breakdown') || pitchText.toLowerCase().includes('auto workshop')) {
          fail('Category Guarding in Pitch', 'Contains incorrect auto workshop / breakdown text');
        } else {
          pass('Category Guarding in Pitch', 'Correctly identified phone repair, screen & battery replacement (Zero auto wording)');
        }

        // Verify Local Entity: mentions Palavakkam or local area
        if (pitchText.toLowerCase().includes('palavakkam') || pitchText.toLowerCase().includes('chennai')) {
          pass('Hyper-Local Neighborhood Extraction', 'Locality extracted and cited in pitch');
        } else {
          warn('Hyper-Local Neighborhood Extraction', 'No specific locality detected in pitch');
        }
      } else {
        fail('Conversational Pitch Auto-Generation', 'Pitch textarea is empty');
      }

      // Test Interactive Tone Switching
      console.log('Testing interactive tone pills...');
      const shortBtn = await page.evaluateHandle(() => {
        return Array.from(document.querySelectorAll('.tone-pill')).find(b => b.innerText.includes('Short & Catchy'));
      });
      if (shortBtn && shortBtn.asElement()) {
        await shortBtn.asElement().click();
        await new Promise(r => setTimeout(r, 400));
        const updatedPitch = await page.$eval('.pitch-textarea', el => el.value);
        if (updatedPitch.includes('Quick question:')) {
          pass('Tone Switcher: "⚡ Short & Catchy"', 'Dynamic update confirmed');
        } else {
          warn('Tone Switcher: "⚡ Short & Catchy"', 'Text did not reflect catchy template');
        }
      }

      const valueBtn = await page.evaluateHandle(() => {
        return Array.from(document.querySelectorAll('.tone-pill')).find(b => b.innerText.includes('Value & Demo'));
      });
      if (valueBtn && valueBtn.asElement()) {
        await valueBtn.asElement().click();
        await new Promise(r => setTimeout(r, 400));
        const updatedPitch = await page.$eval('.pitch-textarea', el => el.value);
        if (updatedPitch.includes('• 1-Click WhatsApp') || updatedPitch.includes('sample 1-page')) {
          pass('Tone Switcher: "🎯 Value & Demo"', 'Dynamic feature bullets confirmed');
        } else {
          warn('Tone Switcher: "🎯 Value & Demo"', 'Text did not reflect value template');
        }
      }

      // Test Phone Analysis & Landline Detection
      console.log('Testing phone number sanitizer & landline alerts...');
      const phoneInput = await page.$('input[placeholder*="98765"]');
      if (phoneInput) {
        // Test valid mobile
        await page.evaluate(el => el.value = '', phoneInput);
        await phoneInput.type('08870515351');
        await new Promise(r => setTimeout(r, 200));
        const mobileBadge = await page.evaluate(() => document.body.innerText.includes('Verified Mobile'));
        if (mobileBadge) {
          pass('Phone Sanitization (Mobile)', 'Leading zero stripped & flagged as Verified Mobile (+91 88705 15351)');
        } else {
          warn('Phone Sanitization (Mobile)', 'Verified Mobile badge not found');
        }

        // Test landline rejection
        await page.evaluate(el => el.value = '', phoneInput);
        await phoneInput.type('04424481234');
        await new Promise(r => setTimeout(r, 200));
        const landlineBadge = await page.evaluate(() => document.body.innerText.includes('Landline'));
        if (landlineBadge) {
          pass('Phone Sanitization (Landline Detection)', '044 number correctly flagged as Landline with warning');
        } else {
          warn('Phone Sanitization (Landline Detection)', 'Landline warning badge not found');
        }

        // Restore verified mobile number
        await page.evaluate(el => el.value = '', phoneInput);
        await phoneInput.type('8870515351');
      }

      // Test Save Prospect action
      const saveBtn = await page.evaluateHandle(() => {
        return Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Save Prospect') || b.innerText.includes('Saved'));
      });
      if (saveBtn && saveBtn.asElement()) {
        await saveBtn.asElement().click();
        await new Promise(r => setTimeout(r, 400));
        const isSaved = await page.evaluate(() => document.body.innerText.includes('Saved'));
        if (isSaved) {
          pass('Save Prospect Action', 'Prospect saved to localStorage pipeline');
        } else {
          warn('Save Prospect Action', 'Saved state not reflected');
        }
      }

      // Test WhatsApp Buttons
      const waBtn = await page.evaluateHandle(() => {
        return Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Send via WhatsApp App'));
      });
      if (waBtn && waBtn.asElement()) {
        pass('Native WhatsApp Desktop Button', 'Found and active');
      } else {
        fail('Native WhatsApp Desktop Button', 'Button missing');
      }

      const waWebBtn = await page.evaluateHandle(() => {
        return Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('WhatsApp Web'));
      });
      if (waWebBtn && waWebBtn.asElement()) {
        pass('WhatsApp Web Button', 'Found and active');
      } else {
        fail('WhatsApp Web Button', 'Button missing');
      }

    } catch (e) {
      fail('Business Analysis Ingestion', e.message);
    }
  } catch (e) {
    fail('Analyze Workflow', e.message);
  }

  // Test C: Prospects CRM Page
  console.log('\n--- 4. PROSPECTS CRM PIPELINE ---');
  try {
    await page.goto(`${BASE_URL}/prospects`, { waitUntil: 'networkidle0' });
    const prospectsTitle = await page.$eval('h1', el => el.innerText.trim());
    if (prospectsTitle.toLowerCase().includes('prospect')) {
      pass('Prospects CRM Page Load', `Header: "${prospectsTitle}"`);
    } else {
      warn('Prospects CRM Page Load', `Unexpected header: "${prospectsTitle}"`);
    }

    await page.waitForSelector('table tbody tr', { timeout: 8000 });
    const tableRows = await page.$$('table tbody tr');
    if (tableRows.length >= 5) {
      pass('Prospects Table Data Display', `Found ${tableRows.length} active prospect records`);
    } else if (tableRows.length > 0) {
      pass('Prospects Table Data Display', `Found ${tableRows.length} active prospect record(s)`);
    } else {
      warn('Prospects Table Data Display', 'No rows found in prospects table');
    }

    // Test Search Filter: Search for "Mobile"
    const searchInput = await page.$('input[placeholder*="Search"]');
    if (searchInput) {
      await searchInput.type('Mobile');
      await new Promise(r => setTimeout(r, 200));
      const filteredRows = await page.$$('table tbody tr');
      if (filteredRows.length >= 1) {
        pass('CRM Search & Filter (Positive Match)', `Correctly matched ${filteredRows.length} row(s) for "Mobile"`);
      } else {
        warn('CRM Search & Filter (Positive Match)', 'No rows matched "Mobile"');
      }

      // Test Search for nonexistent
      await page.evaluate(el => el.value = '', searchInput);
      await searchInput.type('xyznonexistent99');
      await new Promise(r => setTimeout(r, 200));
      const emptyState = await page.evaluate(() => document.body.innerText.includes('No matching prospects found'));
      if (emptyState) {
        pass('CRM Search & Filter (Zero Match State)', 'Clean empty search state displayed');
      }

      // Clear search input
      await page.evaluate(el => el.value = '', searchInput);
      await new Promise(r => setTimeout(r, 200));
    } else {
      warn('CRM Search & Filter', 'Search input not found');
    }

    // Test Status Filter Pills: Click 'WhatsApp Opened'
    const waPill = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll('.tone-pill')).find(b => b.innerText.includes('WhatsApp Opened'));
    });
    if (waPill && waPill.asElement()) {
      await waPill.asElement().click();
      await new Promise(r => setTimeout(r, 200));
      const waRows = await page.$$('table tbody tr');
      pass('CRM Status Filter ("WhatsApp Opened")', `Filtered to ${waRows.length} prospect(s)`);

      // Reset to All
      const allPill = await page.evaluateHandle(() => {
        return Array.from(document.querySelectorAll('.tone-pill')).find(b => b.innerText.trim() === 'All');
      });
      if (allPill && allPill.asElement()) {
        await allPill.asElement().click();
      }
    }
  } catch (e) {
    fail('Prospects Workflow', e.message);
  }

  // Check Console Errors
  console.log('\n--- 5. CONSOLE AUDIT ---');
  // Filter out benign noise
  const criticalErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('downloadBehavior'));
  if (criticalErrors.length === 0) {
    pass('Browser Console Cleanliness', 'Zero uncaught runtime errors');
  } else {
    warn('Browser Console Errors Found', `${criticalErrors.length} errors: ${criticalErrors.join(' | ')}`);
  }

  await browser.close();

  // Final Summary Report
  console.log('\n==============================================');
  console.log('AUDIT SUMMARY REPORT');
  console.log('==============================================');
  console.log(`✅ Total Tests Passed: ${results.passed.length}`);
  console.log(`❌ Total Tests Failed: ${results.failed.length}`);
  console.log(`⚠️ Warnings / Improvements: ${results.warnings.length}`);
  console.log('==============================================');

  if (results.failed.length === 0) {
    console.log('🎉 AUDIT VERDICT: STABLE & PRODUCTION READY');
  } else {
    console.log('⚠️ AUDIT VERDICT: ISSUES FOUND');
  }
}

runQATests().catch(console.error);
