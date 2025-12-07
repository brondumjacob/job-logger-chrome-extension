/**
 * Workday Scraper
 */

export default {
  name: 'Workday',
  
  matches: (url) => url.includes('myworkdayjobs.com') || url.includes('wd5.myworkday'),
  
  scrape: (document) => {
    const data = {
      company: '',
      role: '',
      location: '',
      salary: '',
      workArrangement: '',
      source: 'Workday'
    };
    
    // Job title - Workday uses data-automation-id attributes
    const titleSelectors = [
      '[data-automation-id="jobPostingHeader"]',
      'h2[data-automation-id="jobTitle"]',
      '[data-automation-id="jobTitle"]',
      '.css-8z06vl', // Common Workday class
      'h1, h2'
    ];
    
    for (const selector of titleSelectors) {
      const el = document.querySelector(selector);
      if (el && el.textContent.trim().length > 3 && el.textContent.trim().length < 200) {
        data.role = el.textContent.trim();
        break;
      }
    }
    
    // Company name - extract from URL subdomain
    const hostname = window.location.hostname;
    const companyMatch = hostname.match(/([^.]+)\.myworkdayjobs/);
    if (companyMatch) {
      // Convert "acmecorp" to "Acmecorp" or handle camelCase
      let company = companyMatch[1];
      // Handle common patterns
      company = company.replace(/([a-z])([A-Z])/g, '$1 $2'); // camelCase to spaces
      company = company.charAt(0).toUpperCase() + company.slice(1);
      data.company = company;
    }
    
    // Location
    const locationSelectors = [
      '[data-automation-id="locations"]',
      '[data-automation-id="location"]',
      '.css-cygeeu',
      '[class*="location"]'
    ];
    
    for (const selector of locationSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        data.location = el.textContent.trim();
        break;
      }
    }
    
    // Work arrangement
    const pageText = document.body.innerText.toLowerCase();
    if (pageText.includes('remote')) {
      data.workArrangement = 'Remote';
    } else if (pageText.includes('hybrid')) {
      data.workArrangement = 'Hybrid';
    }
    
    return data;
  }
};
