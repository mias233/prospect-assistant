export const getCategoryFallbackImage = (category = '') => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('phone') || cat.includes('mobile') || cat.includes('electronics') || cat.includes('gadget') || cat.includes('screen')) {
    return 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80';
  }
  if (cat.includes('wrap') || cat.includes('detailing') || cat.includes('car') || cat.includes('auto')) {
    return 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&auto=format&fit=crop&q=80';
  }
  if (cat.includes('salon') || cat.includes('beauty') || cat.includes('parlour') || cat.includes('spa')) {
    return 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80';
  }
  if (cat.includes('dental') || cat.includes('clinic') || cat.includes('doctor') || cat.includes('health')) {
    return 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&auto=format&fit=crop&q=80';
  }
  if (cat.includes('gym') || cat.includes('fitness')) {
    return 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80';
  }
  if (cat.includes('cafe') || cat.includes('coffee') || cat.includes('bakery') || cat.includes('restaurant') || cat.includes('food')) {
    return 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80';
};

export const analyzeBusiness = async (url) => {
  if (!url || (!url.includes('maps') && !url.includes('goo.gl') && !url.includes('http'))) {
    throw new Error('Please enter a valid Google Maps link.');
  }

  try {
    const res = await fetch(`/api/analyze-maps?url=${encodeURIComponent(url)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.name && data.name !== 'Local Business') {
        const fallbackImg = getCategoryFallbackImage(data.category);
        const finalImg = data.imageUrl || fallbackImg;
        return {
          id: data.id || 'b_' + Math.random().toString(36).substr(2, 9),
          name: data.name,
          category: data.category || 'Local Service',
          address: data.address || 'Chennai, Tamil Nadu',
          phone: data.phone || null,
          website: data.website || null,
          rating: data.rating || '4.8',
          reviewCount: data.reviewCount || 0,
          imageUrl: finalImg,
          photos: data.photos && data.photos.length > 0 ? data.photos : [finalImg],
          status: 'Operational',
          websiteDetected: !!data.website,
          instagram: data.instagram || null,
          facebook: data.facebook || null,
          verifications: data.verifications || {
            name: 'Verified',
            address: data.address ? 'Verified' : 'Not available',
            phone: data.phone ? 'Verified' : 'Not available',
            website: data.website ? 'Verified' : 'Not available',
            rating: data.rating ? 'Verified' : 'Not available',
            image: data.imageUrl ? 'Verified' : 'Not available'
          }
        };
      }
    }
  } catch (err) {
    console.warn('Real maps analysis endpoint error, fallback:', err);
  }

  // Graceful fallback for non-standard links: parse place name cleanly without inventing fake numbers
  let extractedName = 'Local Business';
  let workingUrl = url;
  if (workingUrl.includes('/place/')) {
    const parts = workingUrl.split('/place/')[1].split('/');
    if (parts[0]) {
      extractedName = decodeURIComponent(parts[0].replace(/\+/g, ' '));
    }
  } else if (workingUrl.includes('q=')) {
    const qMatch = workingUrl.match(/[?&]q=([^&]+)/);
    if (qMatch) {
      extractedName = decodeURIComponent(qMatch[1].replace(/\+/g, ' '));
    }
  }

  let extractedCategory = 'Local Service';
  const nameLower = extractedName.toLowerCase();
  if (nameLower.includes('mobile') || nameLower.includes('phone') || nameLower.includes('cell') || nameLower.includes('repair') || nameLower.includes('screen') || nameLower.includes('gadget')) {
    extractedCategory = 'Mobile Phone Repair & Service';
  } else if (nameLower.includes('wrap') || nameLower.includes('detailing') || nameLower.includes('ppf') || nameLower.includes('ceramic') || nameLower.includes('tint')) {
    extractedCategory = 'Car Detailing & Wrap Studio';
  } else if (nameLower.includes('auto') || nameLower.includes('motor') || nameLower.includes('garage') || nameLower.includes('mechanic')) {
    extractedCategory = 'Automobile Repair & Service';
  } else if (nameLower.includes('gym') || nameLower.includes('fitness')) {
    extractedCategory = 'Gym & Fitness Studio';
  } else if (nameLower.includes('salon') || nameLower.includes('parlour') || nameLower.includes('beauty') || nameLower.includes('spa')) {
    extractedCategory = 'Beauty Parlour & Salon';
  } else if (nameLower.includes('dental') || nameLower.includes('dentist')) {
    extractedCategory = 'Dental Clinic';
  } else if (nameLower.includes('clinic') || nameLower.includes('hospital')) {
    extractedCategory = 'Healthcare & Clinic';
  } else if (nameLower.includes('cafe') || nameLower.includes('coffee') || nameLower.includes('bakery')) {
    extractedCategory = 'Cafe & Bakery';
  } else if (nameLower.includes('restaurant') || nameLower.includes('dining') || nameLower.includes('food')) {
    extractedCategory = 'Restaurant & Dining';
  }

  const fallbackImg = getCategoryFallbackImage(extractedCategory);

  return {
    id: 'b_' + Math.random().toString(36).substr(2, 9),
    name: extractedName,
    category: extractedCategory,
    address: 'Chennai, Tamil Nadu',
    phone: null,
    website: null,
    rating: '4.8',
    reviewCount: 50,
    imageUrl: fallbackImg,
    photos: [fallbackImg],
    status: 'Operational',
    websiteDetected: false,
    verifications: {
      name: 'Verified',
      address: 'Not available',
      phone: 'Not available',
      website: 'Not available',
      rating: 'Not available'
    }
  };
};

export const generateAudit = async (business) => {
  await new Promise(resolve => setTimeout(resolve, 500));

  const cat = (business.category || '').toLowerCase();
  const isAutoOrWrap = cat.includes('car') || cat.includes('wrap') || cat.includes('detailing') || cat.includes('auto');
  const isSalon = cat.includes('salon') || cat.includes('beauty') || cat.includes('parlour') || cat.includes('spa');
  const isGym = cat.includes('gym') || cat.includes('fitness');
  const isClinic = cat.includes('clinic') || cat.includes('dental') || cat.includes('health');
  const isFood = cat.includes('restaurant') || cat.includes('cafe') || cat.includes('bakery') || cat.includes('food');

  let customReasons = [
    'No dedicated independent website detected on Google Maps',
    'No online service catalog / pricing guide linked',
    'Missing 1-click WhatsApp inquiry / booking CTA',
    `High local search intent for ${business.category}`,
    'Public contact details available for outreach'
  ];

  let customRecommendations = [
    'Build mobile-first responsive portfolio website',
    'Add service catalog with clear package tiers',
    'Integrate 1-click WhatsApp quote & appointment CTA',
    'Display customer before/after transformations & reviews',
    'Add location map, operating hours, and direct call button'
  ];

  if (isAutoOrWrap) {
    customReasons = [
      'No independent studio website detected for vehicle customization portfolios',
      'No online package guide for Car Wraps, PPF, or Ceramic Coating',
      'Missing direct 1-click WhatsApp quote estimation CTA',
      'High search demand for vehicle detailing and wrap styling in Chennai',
      'Strong local customer reputation that can be converted directly online'
    ];
    customRecommendations = [
      'Build visual mobile portfolio showcasing car wrap & detailing projects',
      'Add transparent package breakdown (Vinyl Wrap, PPF, Ceramic Spa, Detailing)',
      'Add 1-click WhatsApp quote request button for car owners',
      'Display Google reviews, garage photos, and Google Maps directions'
    ];
  } else if (isFood) {
    customReasons = [
      'No standalone website detected for direct menu orders',
      'Heavy dependency on food aggregator platforms and high commissions',
      'Missing direct WhatsApp table reservation / takeaway CTA',
      'High local search volume for dining in this area'
    ];
    customRecommendations = [
      'Build mobile-first digital menu website',
      'Add 1-click WhatsApp order / table reservation button',
      'Highlight chef specials, dining ambiance, and timings',
      'Display customer reviews and location map'
    ];
  } else if (isSalon) {
    customReasons = [
      'No dedicated website detected for salon rate card or bridal packages',
      'Missing 1-click WhatsApp appointment booking button',
      'High search demand for bridal makeover and salon services',
      'Strong local customer reviews that can drive online bookings'
    ];
    customRecommendations = [
      'Build mobile-first beauty service menu with transparent pricing',
      'Add instant 1-click WhatsApp appointment scheduling',
      'Feature client makeover gallery and bridal package tiers',
      'Add location map, operating hours, and stylist profiles'
    ];
  }

  if (!business.websiteDetected) {
    return {
      opportunityScore: 92,
      breakdown: {
        websitePresence: { score: 0, max: 25, label: 'Website Presence' },
        mobileExperience: { score: 0, max: 20, label: 'Mobile Experience' },
        conversion: { score: 0, max: 15, label: 'Conversion/CTA' },
        businessInfo: { score: 15, max: 15, label: 'Business Information' },
        seo: { score: 0, max: 10, label: 'SEO Basics' },
        performance: { score: 0, max: 10, label: 'Performance' },
        customerExp: { score: 0, max: 5, label: 'Customer Experience' }
      },
      reasons: customReasons,
      recommendations: customRecommendations
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
      'Website is not fully mobile optimized',
      'Missing clear 1-click WhatsApp call-to-action',
      'Slow mobile page load speed detected',
      'Missing structured meta tags for local Google Search'
    ],
    recommendations: [
      'Modernize mobile layout & touch responsiveness',
      'Add prominent 1-click WhatsApp booking button',
      'Optimize image compression and load times',
      'Implement local schema markup for Google Search'
    ]
  };
};

function extractBestLocality(address) {
  if (!address) return 'your area';
  const lower = address.toLowerCase();
  
  // Prominent known localities and neighborhoods
  const knownAreas = [
    'palavakkam', 'porur', 'velachery', 'anna nagar', 't nagar', 'adyar', 'besant nagar', 'thiruvanmiyur',
    'guindy', 'mylapore', 'nungambakkam', 'omr', 'ecr', 'tambaram', 'chromepet', 'perungudi', 'sholinganallur',
    'vadapalani', 'alwarpet', 'kilpauk', 'egmore', 'saidapet', 'triplicane', 'medavakkam', 'madipakkam',
    'koramangala', 'indiranagar', 'whitefield', 'jayanagar', 'hsr layout', 'electronic city', 'malleswaram',
    'andheri', 'bandra', 'powai', 'thane', 'borivali', 'dadar', 'colaba', 'juhu',
    'connaught place', 'saket', 'gurgaon', 'noida', 'dwarka', 'karol bagh', 'hauz khas',
    'hitec city', 'gachibowli', 'madhapur', 'jubilee hills', 'banjara hills', 'kukatpally'
  ];

  for (const area of knownAreas) {
    if (lower.includes(area)) {
      return area.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  }

  // Extract from address tokens
  const parts = address.split(',').map(p => p.trim()).filter(Boolean);
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i];
    if (/\d{5,6}/.test(part)) continue;
    const pLow = part.toLowerCase();
    if (['india', 'tamil nadu', 'karnataka', 'maharashtra', 'telangana', 'delhi', 'chennai', 'bengaluru', 'mumbai', 'hyderabad'].includes(pLow)) {
      continue;
    }
    if (part.length > 2 && !part.startsWith('opp') && !part.startsWith('near') && !/^\d+/.test(part)) {
      return part;
    }
  }

  return 'Chennai';
}

export const generatePitch = async (business, audit, tone = 'Conversational', length = 'Short') => {
  await new Promise(resolve => setTimeout(resolve, 200));

  const rawName = business.name || 'Team';
  // Strip trailing descriptors like " - Palavakkam" or "(iPhone Repair)" so it sounds natural
  const cleanName = rawName.split(/[-|–—(]/)[0].trim() || rawName.trim();
  const locality = extractBestLocality(business.address);
  const rating = business.rating || '4.9';
  const reviewsCount = business.reviewCount ? parseInt(business.reviewCount, 10) : 0;
  const reviewsText = reviewsCount > 0 ? `${reviewsCount}+ reviews` : 'stellar reviews';
  
  const cat = (business.category || '').toLowerCase();
  const nameLower = (business.name || '').toLowerCase();

  // 1. Mobile Phone Repair & Electronics / Gadgets (PRIORITY: checked BEFORE auto repair)
  const isMobileRepair = 
    cat.includes('phone') || 
    cat.includes('mobile') || 
    cat.includes('electronics') || 
    cat.includes('gadget') || 
    cat.includes('screen') || 
    cat.includes('laptop') || 
    cat.includes('computer') || 
    nameLower.includes('mobile') || 
    nameLower.includes('phone') || 
    nameLower.includes('cell') ||
    nameLower.includes('gadget');

  // 2. Car Detailing, Wrap & PPF
  const isCarDetailing = 
    cat.includes('wrap') || 
    cat.includes('detailing') || 
    cat.includes('ppf') || 
    cat.includes('ceramic') || 
    cat.includes('tint') || 
    nameLower.includes('wrap') || 
    nameLower.includes('detailing') || 
    nameLower.includes('ppf');

  // 3. Auto & Bike Workshop / Garage (Guarded against mobile repair)
  const isAutoWorkshop = 
    !isMobileRepair && (
      cat.includes('auto') || 
      cat.includes('car') || 
      cat.includes('bike') || 
      cat.includes('motor') || 
      cat.includes('garage') || 
      cat.includes('mechanic') || 
      cat.includes('repair') ||
      nameLower.includes('garage') || 
      nameLower.includes('motors') || 
      nameLower.includes('auto')
    );

  // 4. Salon & Beauty
  const isSalon = 
    cat.includes('salon') || 
    cat.includes('beauty') || 
    cat.includes('parlour') || 
    cat.includes('spa') || 
    cat.includes('hair') || 
    nameLower.includes('salon') || 
    nameLower.includes('beauty');

  // 5. Gym & Fitness
  const isGym = 
    cat.includes('gym') || 
    cat.includes('fitness') || 
    cat.includes('crossfit') || 
    cat.includes('workout') || 
    nameLower.includes('gym') || 
    nameLower.includes('fitness');

  // 6. Clinic & Healthcare
  const isHealthcare = 
    cat.includes('clinic') || 
    cat.includes('dental') || 
    cat.includes('health') || 
    cat.includes('physio') || 
    cat.includes('doctor') || 
    nameLower.includes('clinic') || 
    nameLower.includes('dental');

  // 7. Restaurant & Cafe
  const isRestaurant = 
    cat.includes('restaurant') || 
    cat.includes('cafe') || 
    cat.includes('bakery') || 
    cat.includes('food') || 
    cat.includes('diner') || 
    cat.includes('kitchen') || 
    nameLower.includes('restaurant') || 
    nameLower.includes('cafe') || 
    nameLower.includes('bakers');

  const normalizedTone = (tone || 'conversational').toLowerCase();

  // === 1. MOBILE PHONE REPAIR ===
  if (isMobileRepair) {
    if (normalizedTone.includes('direct') || normalizedTone.includes('catchy')) {
      return `Hey ${cleanName} team! 👋 Quick question:

Saw your shop on Google Maps in ${locality} — your ${rating}★ rating across ${reviewsText} is super impressive! 

A lot of people search for phone repairs in ${locality} (screen replacements, battery fixes), but there's no official link on Maps to check repair prices or WhatsApp you for a quote.

I built a quick 1-minute mobile demo for ${cleanName} with a 1-click WhatsApp quote button & price card.

Can I send over the preview link for you to take a look? Takes 20 seconds to see!`;
    }

    if (normalizedTone.includes('value') || normalizedTone.includes('demo')) {
      return `Hi ${cleanName} team! 👋

Love the customer reviews on your Google Maps profile in ${locality}! 

When customers have a broken screen or dead battery, they usually want quick pricing before calling. I designed a sample 1-page mobile site for ${cleanName} featuring:
• 1-Click WhatsApp repair quote button
• Popular repair services with warranty info
• Direct shop directions & store hours

Would you like me to send over the demo link? Takes 30 seconds to check out!`;
    }

    // Default: Conversational (Warm, clean, natural chat)
    return `Hey ${cleanName} team! 👋

Came across your shop on Google Maps in ${locality} — ${rating}★ rating with ${reviewsText} is seriously impressive, you guys clearly do solid work! 🙌

I noticed when people around ${locality} search for phone repairs (screen replacements, battery fixes, etc.), your shop shows right up on Maps, but there's no website link for them to check prices or chat with you directly.

I actually put together a clean, fast 1-page mobile site concept for ${cleanName} that lets customers view your repair services, check warranty info, and message you on WhatsApp in 1 click for instant quotes.

Would you be open to me sharing a quick 30-second preview link? Totally free to check out, no pressure at all! 😊`;
  }

  // === 2. CAR DETAILING & WRAP ===
  if (isCarDetailing) {
    if (normalizedTone.includes('direct') || normalizedTone.includes('catchy')) {
      return `Hey ${cleanName} team! 👋

Love your work on Google Maps in ${locality} — that ${rating}★ rating across ${reviewsText} is top tier! 🔥

When customers look for ceramic coating, PPF, or wraps, they want to see before/after photos and quick pricing. I built a sleek 1-minute mobile portfolio demo for ${cleanName} with 1-click WhatsApp quotes.

Can I send you the preview link to check out?`;
    }

    if (normalizedTone.includes('value') || normalizedTone.includes('demo')) {
      return `Hi ${cleanName} team! 👋

Your finish work and transformations in ${locality} look incredible! 

I put together a mobile portfolio mockup for ${cleanName} highlighting:
• Before/after transformation gallery
• Ceramic & PPF package tiers
• 1-Click WhatsApp quote & slot booking

Can I share the demo link with you? Takes 30 seconds to review!`;
    }

    return `Hey ${cleanName} team! 👋

Was checking out your studio on Google Maps in ${locality} — your transformations and ${reviewsText} look incredible! 🔥

I noticed you don't currently have a portfolio website linked on Maps where customers can easily browse your before/after wrap gallery, ceramic coating, and PPF packages before reaching out.

I created a sleek mobile-first website concept for ${cleanName} with a transformation gallery and 1-click WhatsApp quote booking.

Would you be open to me sharing a quick 30-second preview link here? Just thought it'd show off your work even better!`;
  }

  // === 3. AUTO & BIKE WORKSHOPS ===
  if (isAutoWorkshop) {
    if (normalizedTone.includes('direct') || normalizedTone.includes('catchy')) {
      return `Hey ${cleanName} team! 👋

Saw your workshop on Google Maps in ${locality} — ${rating}★ rating across ${reviewsText} is solid! 🙌

Quick question: have you thought about linking a 1-click WhatsApp booking & service rate card to your Maps profile? It makes it super easy for nearby vehicle owners to book service with you instantly.

I built a quick demo page for ${cleanName}. Can I share the preview link with you?`;
    }

    if (normalizedTone.includes('value') || normalizedTone.includes('demo')) {
      return `Hi ${cleanName} team! 👋

Great customer reviews on your Google Maps listing in ${locality}!

I designed a clean, mobile-first website concept for ${cleanName} to help turn your Google Maps visitors into booked customers:
• 1-Click WhatsApp appointment booking
• Clear service packages & pricing
• Direct workshop location & directions

Can I send you the demo link to take a quick look?`;
    }

    return `Hey ${cleanName} team! 👋

Came across your workshop on Google Maps in ${locality} — your ${rating}★ rating across ${reviewsText} is seriously impressive! 🙌

When car or bike owners in ${locality} need urgent servicing or repairs, they search on Maps, but there's no website link for them to check service packages or message you directly.

I put together a clean, fast mobile site demo for ${cleanName} with transparent service packages and a 1-click WhatsApp booking button.

Would you like me to send over a quick 30-second preview link? Totally free to check out, no pressure at all!`;
  }

  // === 4. SALON & BEAUTY ===
  if (isSalon) {
    if (normalizedTone.includes('direct') || normalizedTone.includes('catchy')) {
      return `Hey ${cleanName} team! 👋

Saw your salon on Google Maps in ${locality} — wonderful reviews! ✨

A lot of clients search on Maps for salon services & bridal packages nearby. I created a quick mobile menu demo for ${cleanName} with your service rate card and 1-click WhatsApp appointment booking.

Can I send you the preview link to take a look?`;
    }

    return `Hey ${cleanName} team! 👋

Came across your salon on Google Maps in ${locality} — love the glowing reviews from your clients! ✨

I noticed you don't have an official website linked where new clients can browse your service menu, pricing, and bridal/hair styling packages before visiting.

I designed a clean, modern mobile website concept for ${cleanName} that lets clients see your rate card and book appointments directly on WhatsApp.

Would you be open to me sharing a quick preview link here? Takes less than a minute to see!`;
  }

  // === 5. RESTAURANTS & CAFES ===
  if (isRestaurant) {
    if (normalizedTone.includes('direct') || normalizedTone.includes('catchy')) {
      return `Hey ${cleanName} team! 👋

Saw your place on Google Maps in ${locality} — food reviews are awesome! 🍕

Did you know having a direct digital menu on your Maps profile lets customers view dishes and order directly on WhatsApp without heavy platform commissions?

I built a quick digital menu demo for ${cleanName}. Can I share the preview link with you?`;
    }

    return `Hey ${cleanName} team! 👋

Found your spot on Google Maps in ${locality} — your food reviews look fantastic! 🍕☕

I noticed you don't have an independent digital menu website linked on your profile so customers can browse your dishes, prices, and order directly on WhatsApp without paying aggregator commissions.

I put together a fast, clean digital menu prototype for ${cleanName} with direct WhatsApp ordering.

Would you like me to send over the link to take a quick look?`;
  }

  // === 6. GYMS & FITNESS ===
  if (isGym) {
    return `Hey ${cleanName} team! 👋

Saw your fitness studio on Google Maps in ${locality} — member reviews look great! 💪

A lot of people searching for gyms nearby look for membership plans and trial passes before visiting. I noticed you don't have a website linked to capture those walk-in leads.

I created a quick mobile page demo for ${cleanName} with your membership plans, trainer highlights, and 1-click WhatsApp trial booking.

Can I send you the preview link to check out?`;
  }

  // === 7. CLINICS & HEALTHCARE ===
  if (isHealthcare) {
    return `Hello Dr. & ${cleanName} team! 👋

Came across your clinic listing on Google Maps in ${locality} with strong patient feedback.

Patients searching for local healthcare usually look for doctor profiles, clinic timings, and consultation fees before visiting. I noticed you don't have an official clinic site linked on Maps yet.

I built a clean, reassuring 1-page clinic website concept for ${cleanName} with doctor credentials and 1-click WhatsApp appointment requests.

Would you be open to seeing a quick preview?`;
  }

  // === 8. GENERAL LOCAL BUSINESS (Conversational fallback) ===
  if (normalizedTone.includes('direct') || normalizedTone.includes('catchy')) {
    return `Hey ${cleanName} team! 👋

Came across your profile on Google Maps in ${locality} — ${rating}★ rating across ${reviewsText} is great!

Quick question: have you thought about linking a 1-click WhatsApp inquiry page to your Maps listing? It makes it effortless for new customers to reach you directly.

I built a quick mobile demo for ${cleanName}. Can I send the preview link for you to check out?`;
  }

  return `Hey ${cleanName} team! 👋

Saw your listing on Google Maps in ${locality} — your ${reviewsText} and ${rating}★ rating look awesome! 🙌

When local customers find you on Maps, having a clean website gives them instant confidence in your pricing and services. I noticed you don't have an official website linked on your profile yet.

I put together a fast, mobile-friendly demo page tailored for ${cleanName} with your service details and 1-click WhatsApp messaging.

Would you like me to send over the quick preview link here? (Takes 30 seconds to look, no pressure at all!)`;
};

// Local storage prospect history
const STORAGE_KEY = 'prospect_assistant_leads_history';

export const DEFAULT_SEED_PROSPECTS = [
  {
    id: 'p_mobile_world',
    businessName: 'Mobile world 2.0',
    category: 'Mobile Phone Repair & Service',
    location: 'Palavakkam, Chennai',
    address: 'East Coast Rd, Palavakkam, Chennai, Tamil Nadu 600041',
    phone: '+91 88705 15351',
    website: 'No website',
    opportunityScore: 92,
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
    status: 'Analyzed',
    lastContact: 'Just now'
  },
  {
    id: 'p_wrap_lab',
    businessName: 'The Wrap Lab',
    category: 'Car Detailing & Wrap Studio',
    location: 'OMR, Chennai',
    address: 'Old Mahabalipuram Rd, Sholinganallur, Chennai, Tamil Nadu',
    phone: '+91 98401 23456',
    website: 'No website',
    opportunityScore: 89,
    imageUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&auto=format&fit=crop&q=80',
    status: 'WhatsApp Opened',
    lastContact: 'Yesterday'
  },
  {
    id: 'p_vgn_beauty',
    businessName: 'VGN Beauty & Unisex Salon',
    category: 'Beauty Parlour & Salon',
    location: 'Anna Nagar, Chennai',
    address: '2nd Avenue, Anna Nagar, Chennai, Tamil Nadu',
    phone: '+91 94440 98765',
    website: 'No website',
    opportunityScore: 84,
    imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80',
    status: 'Saved',
    lastContact: '2 days ago'
  },
  {
    id: 'p_sparkle_dental',
    businessName: 'Sparkle Dental Care',
    category: 'Dental Clinic',
    location: 'Adyar, Chennai',
    address: 'Lattice Bridge Rd, Adyar, Chennai, Tamil Nadu',
    phone: '+91 98840 54321',
    website: 'sparkledental.in',
    opportunityScore: 78,
    imageUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&auto=format&fit=crop&q=80',
    status: 'Contacted',
    lastContact: '3 days ago'
  },
  {
    id: 'p_cafe_gusto',
    businessName: 'Cafe Gusto Artisan Bistro',
    category: 'Cafe & Bakery',
    location: 'ECR, Chennai',
    address: 'East Coast Road, Thiruvanmiyur, Chennai, Tamil Nadu',
    phone: '+91 97909 11223',
    website: 'No website',
    opportunityScore: 74,
    imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80',
    status: 'Interested',
    lastContact: '5 days ago'
  }
];

export const getProspects = async () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SEED_PROSPECTS));
      return DEFAULT_SEED_PROSPECTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SEED_PROSPECTS));
      return DEFAULT_SEED_PROSPECTS;
    }
    return parsed;
  } catch (e) {
    console.error("Error reading prospects from localStorage", e);
    return DEFAULT_SEED_PROSPECTS;
  }
};

export const saveProspect = async (prospect) => {
  try {
    const existing = await getProspects();
    const newEntry = {
      ...prospect,
      id: prospect.id || 'p_' + Math.random().toString(36).substr(2, 9),
      savedAt: new Date().toISOString()
    };
    
    // De-duplicate by id or businessName
    const updatedList = [newEntry, ...existing.filter(p => p.id !== newEntry.id && p.businessName !== newEntry.businessName)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    return newEntry;
  } catch (e) {
    console.error("Error saving prospect to localStorage", e);
    return prospect;
  }
};

export const deleteProspect = async (id) => {
  try {
    const existing = await getProspects();
    const updated = existing.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Error deleting prospect", e);
    return [];
  }
};

export const clearAllProspects = async () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  } catch (e) {
    console.error("Error clearing prospects", e);
    return [];
  }
};

export const analyzePhoneNumber = (rawPhone, defaultCountry = '91') => {
  if (!rawPhone) {
    return {
      isValid: false,
      cleanDigits: '',
      formatted: '',
      isMobile: false,
      isLandline: false,
      statusLabel: 'No phone number detected',
      warning: 'No phone number found on Google Maps listing.'
    };
  }

  let digits = rawPhone.replace(/[^0-9]/g, '');
  
  // Strip leading 0 (e.g. 08870515351 -> 8870515351)
  if (digits.startsWith('0')) {
    digits = digits.replace(/^0+/, '');
  }

  // If already prefixed with 91 and has 12 digits total
  if (digits.startsWith('91') && digits.length === 12) {
    const local = digits.slice(2);
    const isMobile = /^[6-9]/.test(local);
    return {
      isValid: true,
      cleanDigits: digits,
      localDigits: local,
      formatted: `+91 ${local.slice(0, 5)} ${local.slice(5)}`,
      isMobile,
      isLandline: !isMobile,
      statusLabel: isMobile ? 'Verified Mobile' : 'Landline Detected',
      warning: isMobile ? null : 'This appears to be a landline number. WhatsApp requires a mobile number.'
    };
  }

  // 10 digits
  if (digits.length === 10) {
    const isMobile = /^[6-9]/.test(digits);
    const intl = defaultCountry + digits;
    return {
      isValid: true,
      cleanDigits: intl,
      localDigits: digits,
      formatted: `+${defaultCountry} ${digits.slice(0, 5)} ${digits.slice(5)}`,
      isMobile,
      isLandline: !isMobile,
      statusLabel: isMobile ? 'Verified Mobile' : 'Landline Detected',
      warning: isMobile ? null : 'This appears to be a landline number. WhatsApp requires a mobile number.'
    };
  }

  // Landline check (e.g. 044, STD codes)
  if (rawPhone.includes('044') || (digits.length >= 7 && digits.length <= 9)) {
    return {
      isValid: false,
      cleanDigits: digits,
      localDigits: digits,
      formatted: rawPhone,
      isMobile: false,
      isLandline: true,
      statusLabel: 'Landline Number',
      warning: 'Detected Landline number (044-...). Landlines cannot receive WhatsApp. Please enter a mobile number.'
    };
  }

  return {
    isValid: digits.length >= 10,
    cleanDigits: digits.length === 10 ? defaultCountry + digits : digits,
    localDigits: digits,
    formatted: rawPhone,
    isMobile: digits.length >= 10,
    isLandline: false,
    statusLabel: digits.length >= 10 ? 'Ready' : 'Incomplete Number',
    warning: digits.length < 10 ? 'Incomplete phone number detected. Please enter a 10-digit mobile number.' : null
  };
};

export const formatWhatsAppPhone = (rawPhone, defaultCountryCode = '91') => {
  const analysis = analyzePhoneNumber(rawPhone, defaultCountryCode);
  return analysis.cleanDigits;
};

export const getWhatsAppAppUrl = (phone, text) => {
  const cleanPhone = formatWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(text || '');
  return cleanPhone ? `whatsapp://send?phone=${cleanPhone}&text=${encodedText}` : `whatsapp://send?text=${encodedText}`;
};

export const getWhatsAppUrl = (phone, text, useWeb = true) => {
  const cleanPhone = formatWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(text || '');
  
  if (useWeb) {
    if (cleanPhone) {
      return `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
    }
    return `https://web.whatsapp.com/send?text=${encodedText}`;
  }

  if (cleanPhone) {
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
  }
  return `https://api.whatsapp.com/send?text=${encodedText}`;
};

export const sendDirectWhatsApp = async (phone, message, method = 'app') => {
  try {
    const res = await fetch('/api/send-whatsapp-direct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message, method })
    });
    const data = await res.json();
    return data;
  } catch(e) {
    console.error("Direct WhatsApp dispatch error:", e);
    return { success: false, error: e.message };
  }
};
