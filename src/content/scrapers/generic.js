/**
 * Generic Scraper (Fallback)
 * Attempts to extract job data from any page using common patterns
 */

export default {
  name: 'Generic',
  
  matches: () => true, // Always matches as fallback
  
  scrape: (document) => {
    const data = {
      company: '',
      role: '',
      location: '',
      salary: '',
      workArrangement: '',
      source: 'Direct Application'
    };
    
    // Try to find job title from common patterns
    const titleSelectors = [
      'h1.job-title',
      'h1.position-title',
      'h1[class*="job"]',
      'h1[class*="title"]',
      'h1[class*="position"]',
      '.job-title h1',
      '.position-title h1',
      'article h1',
      'main h1',
      '[role="main"] h1',
      'h1'
    ];
    
    for (const selector of titleSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        const text = el.textContent.trim();
        // Filter out obviously wrong titles
        if (text.length > 3 && text.length < 200 && 
            !text.toLowerCase().includes('careers') &&
            !text.toLowerCase().includes('jobs at')) {
          data.role = text;
          break;
        }
      }
    }
    
    // Try to extract company from meta tags
    const metaSelectors = [
      'meta[property="og:site_name"]',
      'meta[name="author"]',
      'meta[name="application-name"]'
    ];
    
    for (const selector of metaSelectors) {
      const el = document.querySelector(selector);
      if (el && el.content) {
        data.company = el.content;
        break;
      }
    }
    
    // If no meta tag, try extracting from domain
    if (!data.company) {
      const domain = window.location.hostname
        .replace('www.', '')
        .replace('careers.', '')
        .replace('jobs.', '');
      const companyFromDomain = domain.split('.')[0];
      // Capitalize and clean up
      data.company = companyFromDomain
        .replace(/-/g, ' ')
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }
    
    // Try to find location from common patterns
    const locationSelectors = [
      '.location',
      '.job-location',
      '[class*="location"]',
      '[data-testid*="location"]'
    ];
    
    for (const selector of locationSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        const text = el.textContent.trim();
        // Basic validation - looks like a location
        if (text.length < 100 && (text.match(/[A-Za-z]+,\s*[A-Z]{2}/) || text.match(/[A-Za-z\s]+,\s*[A-Za-z]+/))) {
          data.location = text;
          break;
        }
      }
    }
    
    // Try regex patterns on body text for location
    if (!data.location) {
      const bodyText = document.body.innerText.substring(0, 5000); // First 5000 chars
      const locationMatch = bodyText.match(/Location[:\s]+([A-Za-z\s]+,\s*[A-Z]{2})/i) ||
                           bodyText.match(/Based in[:\s]+([A-Za-z\s]+,\s*[A-Z]{2})/i);
      if (locationMatch) {
        data.location = locationMatch[1].trim();
      }
    }
    
    // Check for work arrangement keywords
    const pageText = document.body.innerText.toLowerCase().substring(0, 10000);
    if (pageText.includes('fully remote') || pageText.includes('100% remote')) {
      data.workArrangement = 'Remote';
    } else if (pageText.includes('hybrid')) {
      data.workArrangement = 'Hybrid';
    } else if (pageText.includes('on-site') || pageText.includes('onsite') || pageText.includes('in-office')) {
      data.workArrangement = 'On-site';
    }
    
    // Try to find salary
    const salaryMatch = pageText.match(/\$[\d,]+(?:\s*-\s*\$[\d,]+)?(?:\s*(?:per year|annually|\/year|\/yr))?/i);
    if (salaryMatch) {
      data.salary = salaryMatch[0];
    }
    
    return data;
  }
};
