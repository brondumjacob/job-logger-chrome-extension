/**
 * Glassdoor Scraper
 */

export default {
  name: 'Glassdoor',
  
  matches: (url) => url.includes('glassdoor.com/job-listing'),
  
  scrape: (document) => {
    const data = {
      company: '',
      role: '',
      location: '',
      salary: '',
      workArrangement: '',
      source: 'Glassdoor'
    };
    
    // Job title
    const titleSelectors = [
      '[data-test="jobTitle"]',
      '.css-1vg6q84',
      '.e1tk4kwz4',
      'h1[class*="title"]'
    ];
    
    for (const selector of titleSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        data.role = el.textContent.trim();
        break;
      }
    }
    
    // Company name
    const companySelectors = [
      '[data-test="employer-name"]',
      '.css-87uc0g',
      '.e1tk4kwz1',
      '[class*="employer"]'
    ];
    
    for (const selector of companySelectors) {
      const el = document.querySelector(selector);
      if (el) {
        data.company = el.textContent.trim();
        break;
      }
    }
    
    // Location
    const locationSelectors = [
      '[data-test="location"]',
      '.css-56kyx5',
      '.e1tk4kwz2',
      '[class*="location"]'
    ];
    
    for (const selector of locationSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        data.location = el.textContent.trim();
        break;
      }
    }
    
    // Salary estimate
    const salarySelectors = [
      '[data-test="detailSalary"]',
      '.salary-estimate',
      '.css-1hbqxax',
      '[class*="salary"]'
    ];
    
    for (const selector of salarySelectors) {
      const el = document.querySelector(selector);
      if (el && el.textContent.includes('$')) {
        data.salary = el.textContent.trim();
        break;
      }
    }
    
    return data;
  }
};
