// Mock Services for Phase 1 MVP

export const analyzeBusiness = async (url) => {
  if (!url.includes('maps') && !url.includes('goo.gl')) {
    throw new Error('Invalid Google Maps URL');
  }
  
  let workingUrl = url;

  // Resolve short URL via local proxy
  if (url.includes('goo.gl')) {
    try {
      const res = await fetch(`/api/resolve-url?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (data.expandedUrl) {
        workingUrl = data.expandedUrl;
      }
    } catch (e) {
      console.warn("Could not resolve short url", e);
    }
  }

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Basic mock parsing to make it feel "real"
  let extractedName = 'Local Business';
  let extractedLocation = 'Bengaluru, Karnataka 560001';
  let extractedCategory = 'Local Service';

  if (workingUrl.includes('/place/')) {
    const parts = workingUrl.split('/place/')[1].split('/');
    if (parts[0]) {
       extractedName = decodeURIComponent(parts[0].replace(/\+/g, ' '));
    }
    if (parts[1] && parts[1].includes('@')) {
       // Extracted coordinates
       const coords = parts[1].replace('@', '').split(',');
       if (coords.length >= 2) {
         try {
           const lat = coords[0];
           const lon = coords[1];
           const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
           const geoData = await geoRes.json();
           if (geoData && geoData.address) {
             const city = geoData.address.city || geoData.address.town || geoData.address.state_district || 'Unknown City';
             const state = geoData.address.state || 'Unknown State';
             extractedLocation = `${city}, ${state}`;
           }
         } catch(e) {
           console.warn("Geocoding failed", e);
           extractedLocation = 'Location parsed from coordinates';
         }
       }
    }
  } else if (workingUrl.includes('q=')) {
    const qMatch = workingUrl.match(/[?&]q=([^&]+)/);
    if (qMatch) {
       extractedName = decodeURIComponent(qMatch[1].replace(/\+/g, ' '));
    }
  }

  // Heuristic for category based on name
  const nameLower = extractedName.toLowerCase();
  if (nameLower.includes('gym') || nameLower.includes('fitness')) extractedCategory = 'Fitness';
  else if (nameLower.includes('salon') || nameLower.includes('hair') || nameLower.includes('spa')) extractedCategory = 'Salon';
  else if (nameLower.includes('hotel') || nameLower.includes('resort') || nameLower.includes('motel')) extractedCategory = 'Hotel';
  else if (nameLower.includes('store') || nameLower.includes('shop') || nameLower.includes('supermarket') || nameLower.includes('mart')) extractedCategory = 'Retail';
  else if (nameLower.includes('clinic') || nameLower.includes('dental') || nameLower.includes('hospital')) extractedCategory = 'Clinic';
  else if (nameLower.includes('cafe') || nameLower.includes('coffee') || nameLower.includes('roasters')) extractedCategory = 'Cafe';
  else if (nameLower.includes('restaurant') || nameLower.includes('diner') || nameLower.includes('food') || nameLower.includes('curry')) extractedCategory = 'Restaurant';

  // Perform a real web search to see if they have a website
  let detectedWebsite = null;
  try {
    const searchRes = await fetch(`/api/search?q=${encodeURIComponent(extractedName + ' ' + extractedLocation + ' official website')}&name=${encodeURIComponent(extractedName)}&city=${encodeURIComponent(extractedLocation)}`);
    const searchData = await searchRes.json();
    if (searchData && searchData.website) {
       // Found a likely official website
       const urlObj = new URL(searchData.website);
       detectedWebsite = urlObj.hostname.replace(/^www\./, ''); // e.g., currybox.in
    }
  } catch(e) {
    console.warn("Web search failed", e);
  }

  // Return realistic mock data
  return {
    id: 'b_' + Math.random().toString(36).substr(2, 9),
    name: extractedName,
    category: extractedCategory,
    address: `123 Main St, ${extractedLocation}`,
    phone: '+91 ' + Math.floor(1000000000 + Math.random() * 9000000000),
    website: detectedWebsite,
    rating: (Math.random() * (5 - 3.5) + 3.5).toFixed(1),
    reviewCount: Math.floor(Math.random() * 500) + 10,
    status: 'Operational',
    websiteDetected: !!detectedWebsite
  };
};

export const generateAudit = async (business) => {
  await new Promise(resolve => setTimeout(resolve, 1200));

  if (!business.websiteDetected) {
    return {
      opportunityScore: 91,
      breakdown: {
        websitePresence: { score: 0, max: 25, label: 'Website Presence' },
        mobileExperience: { score: 0, max: 20, label: 'Mobile Experience' },
        conversion: { score: 0, max: 15, label: 'Conversion/CTA' },
        businessInfo: { score: 15, max: 15, label: 'Business Information' },
        seo: { score: 0, max: 10, label: 'SEO Basics' },
        performance: { score: 0, max: 10, label: 'Performance' },
        customerExp: { score: 0, max: 5, label: 'Customer Experience' }
      },
      reasons: [
        'No dedicated website detected',
        'No online menu detected',
        'No obvious booking CTA',
        'Strong local business presence',
        'Contact information available'
      ],
      recommendations: [
        'Mobile-first design',
        'Menu section',
        'WhatsApp/contact CTA',
        'Location & directions',
        'Photo gallery',
        'Reservation/enquiry form',
        'Business information',
        'Basic SEO setup'
      ]
    };
  }

  return {
    opportunityScore: 65,
    breakdown: {
      websitePresence: { score: 25, max: 25, label: 'Website Presence' },
      mobileExperience: { score: 10, max: 20, label: 'Mobile Experience' },
      conversion: { score: 5, max: 15, label: 'Conversion/CTA' },
      businessInfo: { score: 10, max: 15, label: 'Business Information' },
      seo: { score: 5, max: 10, label: 'SEO Basics' },
      performance: { score: 5, max: 10, label: 'Performance' },
      customerExp: { score: 5, max: 5, label: 'Customer Experience' }
    },
    reasons: [
      'Website is not fully mobile responsive',
      'Missing clear call-to-action for reservations',
      'Slow page load time detected',
      'Missing meta descriptions on key pages'
    ],
    recommendations: [
      'Modernize mobile layout',
      'Add prominent Book Table button',
      'Optimize image loading',
      'Implement structured data for local SEO'
    ]
  };
};

export const generatePitch = async (business, audit, tone = 'Friendly', length = 'Short') => {
  await new Promise(resolve => setTimeout(resolve, 1500));

  return `Hi ${business.name} team, I came across your restaurant while looking at local businesses in ${business.address.split(',')[1].trim()}. I noticed you have a strong local presence, and I think a simple modern website could make it easier for customers to view your menu, find your location and contact you. I build fast, mobile-friendly websites for local businesses and can usually create an initial version within a day. If you're interested, I can show you a quick demo.`;
};

// Simple local db mock
let prospectsDB = [
  {
    id: '1',
    businessName: 'ABC Restaurant',
    category: 'Restaurant',
    location: 'Bengaluru',
    website: 'No website',
    opportunityScore: 91,
    status: 'Contacted',
    lastContact: '2 days ago'
  },
  {
    id: '2',
    businessName: 'XYZ Salon',
    category: 'Salon',
    location: 'Bengaluru',
    website: 'Old website',
    opportunityScore: 78,
    status: 'Interested',
    lastContact: 'Yesterday'
  },
  {
    id: '3',
    businessName: '123 Gym',
    category: 'Fitness',
    location: 'Bengaluru',
    website: 'No website',
    opportunityScore: 86,
    status: 'New',
    lastContact: '-'
  }
];

export const getProspects = async () => {
  return [...prospectsDB];
};

export const saveProspect = async (prospect) => {
  const newProspect = {
    ...prospect,
    id: Math.random().toString(36).substr(2, 9),
    status: 'Analyzed',
    lastContact: '-'
  };
  prospectsDB = [newProspect, ...prospectsDB];
  return newProspect;
};
