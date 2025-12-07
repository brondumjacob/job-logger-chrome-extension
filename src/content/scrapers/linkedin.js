/**
 * LinkedIn Scraper
 */

export default {
  name: 'LinkedIn',
  
  matches: (url) => url.includes('linkedin.com/jobs'),
  
  scrape: (document) => {
    const data = {
      company: '',
      role: '',
      location: '',
      salary: '',
      workArrangement: '',
      source: 'LinkedIn'
    };
    
    // Job title - multiple selectors for different LinkedIn layouts
    const titleSelectors = [
      '.job-details-jobs-unified-top-card__job-title h1',
      '.job-details-jobs-unified-top-card__job-title',
      '.topcard__title',
      'h1.t-24',
      'h1[class*="job-title"]',
      '.jobs-unified-top-card__job-title'
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
      '.job-details-jobs-unified-top-card__company-name a',
      '.job-details-jobs-unified-top-card__primary-description-container a',
      '.topcard__org-name-link',
      'a.topcard__org-name-link',
      '.jobs-unified-top-card__company-name a',
      'a[data-tracking-control-name="public_jobs_topcard-org-name"]'
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
      '.job-details-jobs-unified-top-card__bullet',
      '.job-details-jobs-unified-top-card__primary-description-container .tvm__text',
      '.topcard__flavor--bullet',
      '.jobs-unified-top-card__bullet'
    ];
    
    for (const selector of locationSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        data.location = el.textContent.trim();
        break;
      }
    }
    
    // Work arrangement (Remote, Hybrid, On-site)
    const workplaceSelectors = [
      '.job-details-jobs-unified-top-card__workplace-type',
      '.workplace-type',
      '[class*="workplace-type"]'
    ];
    
    for (const selector of workplaceSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        const text = el.textContent.toLowerCase();
        if (text.includes('remote')) data.workArrangement = 'Remote';
        else if (text.includes('hybrid')) data.workArrangement = 'Hybrid';
        else if (text.includes('on-site') || text.includes('onsite')) data.workArrangement = 'On-site';
        break;
      }
    }
    
    // Salary (if shown)
    const salarySelectors = [
      '.salary-main-rail__salary-range',
      '.compensation__salary',
      '[class*="salary"]',
      '.job-details-jobs-unified-top-card__job-insight span'
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
