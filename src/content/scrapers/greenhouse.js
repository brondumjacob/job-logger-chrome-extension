/**
 * Greenhouse Scraper
 */

export default {
  name: 'Greenhouse',
  
  matches: (url) => url.includes('greenhouse.io') || url.includes('boards.greenhouse.io'),
  
  scrape: (document) => {
    const data = {
      company: '',
      role: '',
      location: '',
      salary: '',
      workArrangement: '',
      source: 'Greenhouse'
    };
    
    // Job title
    const titleSelectors = [
      '.app-title',
      'h1.heading',
      '.job-title',
      'h1[class*="title"]'
    ];
    
    for (const selector of titleSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        data.role = el.textContent.trim();
        break;
      }
    }
    
    // Company name - try multiple approaches
    const companySelectors = [
      '.company-name',
      '#header .logo img',
      'a[class*="company"] img'
    ];
    
    for (const selector of companySelectors) {
      const el = document.querySelector(selector);
      if (el) {
        if (el.tagName === 'IMG' && el.alt) {
          data.company = el.alt;
        } else {
          data.company = el.textContent.trim();
        }
        break;
      }
    }
    
    // If no company found, try to extract from page title or URL
    if (!data.company) {
      const title = document.title;
      const match = title.match(/at (.+?) \|/) || title.match(/(.+?) Careers/) || title.match(/Jobs at (.+)/);
      if (match) {
        data.company = match[1].trim();
      } else {
        // Try URL pattern: boards.greenhouse.io/companyname
        const urlMatch = window.location.pathname.match(/\/([^/]+)/);
        if (urlMatch) {
          data.company = urlMatch[1].split('-').map(w => 
            w.charAt(0).toUpperCase() + w.slice(1)
          ).join(' ');
        }
      }
    }
    
    // Location
    const locationSelectors = [
      '.location',
      '.job-location',
      '[class*="location"]'
    ];
    
    for (const selector of locationSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        data.location = el.textContent.trim();
        break;
      }
    }
    
    return data;
  }
};
