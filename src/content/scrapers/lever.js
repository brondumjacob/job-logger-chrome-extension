/**
 * Lever Scraper
 */

export default {
  name: 'Lever',
  
  matches: (url) => url.includes('lever.co') || url.includes('jobs.lever.co'),
  
  scrape: (document) => {
    const data = {
      company: '',
      role: '',
      location: '',
      salary: '',
      workArrangement: '',
      source: 'Lever'
    };
    
    // Job title
    const titleSelectors = [
      '.posting-headline h2',
      'h2',
      '.posting-title'
    ];
    
    for (const selector of titleSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        data.role = el.textContent.trim();
        break;
      }
    }
    
    // Company name - try logo alt text first
    const logoEl = document.querySelector('.main-header-logo img');
    if (logoEl && logoEl.alt) {
      data.company = logoEl.alt;
    } else {
      // Try URL pattern: jobs.lever.co/companyname
      const urlMatch = window.location.pathname.match(/\/([^/]+)/);
      if (urlMatch) {
        data.company = urlMatch[1].split('-').map(w => 
          w.charAt(0).toUpperCase() + w.slice(1)
        ).join(' ');
      }
    }
    
    // Location and work type from categories
    const categories = document.querySelectorAll('.posting-categories .sort-by-commitment, .posting-categories .sort-by-location, .posting-categories .posting-category');
    categories.forEach(el => {
      const text = el.textContent.trim();
      
      // Check for work arrangement
      if (text.match(/remote|hybrid|on-?site/i)) {
        if (text.toLowerCase().includes('remote')) data.workArrangement = 'Remote';
        else if (text.toLowerCase().includes('hybrid')) data.workArrangement = 'Hybrid';
        else if (text.match(/on-?site/i)) data.workArrangement = 'On-site';
      }
      // Check for location (City, State or City, Country format)
      else if (text.match(/[A-Za-z\s]+,\s*[A-Z]{2}/) || text.match(/[A-Za-z\s]+,\s*[A-Za-z]+/)) {
        if (!data.location) data.location = text;
      }
    });
    
    // Also try dedicated location element
    if (!data.location) {
      const locationEl = document.querySelector('.location, .posting-location');
      if (locationEl) {
        data.location = locationEl.textContent.trim();
      }
    }
    
    return data;
  }
};
