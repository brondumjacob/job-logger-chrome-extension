/**
 * Indeed Scraper
 */

export default {
  name: 'Indeed',
  
  matches: (url) => url.includes('indeed.com'),
  
  scrape: (document) => {
    const data = {
      company: '',
      role: '',
      location: '',
      salary: '',
      workArrangement: '',
      source: 'Indeed'
    };
    
    // Job title
    const titleSelectors = [
      '.jobsearch-JobInfoHeader-title',
      'h1[data-testid="jobsearch-JobInfoHeader-title"]',
      '.icl-u-xs-mb--xs.icl-u-xs-mt--none h1',
      'h1.jobsearch-JobInfoHeader-title'
    ];
    
    for (const selector of titleSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        // Indeed sometimes wraps title in nested spans
        data.role = el.textContent.trim().replace(/\s+/g, ' ');
        break;
      }
    }
    
    // Company name
    const companySelectors = [
      '[data-testid="inlineHeader-companyName"] a',
      '[data-testid="inlineHeader-companyName"]',
      '.jobsearch-InlineCompanyRating-companyHeader a',
      '.icl-u-lg-mr--sm a',
      'div[data-company-name="true"]'
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
      '[data-testid="job-location"]',
      '[data-testid="inlineHeader-companyLocation"]',
      '.jobsearch-JobInfoHeader-subtitle > div:last-child',
      '.icl-u-xs-mt--xs .icl-u-lg-mr--sm'
    ];
    
    for (const selector of locationSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        data.location = el.textContent.trim();
        break;
      }
    }
    
    // Salary
    const salarySelectors = [
      '#salaryInfoAndJobType span',
      '.salary-snippet',
      '[data-testid="attribute_snippet_testid"]',
      '.jobsearch-JobMetadataHeader-item'
    ];
    
    for (const selector of salarySelectors) {
      const el = document.querySelector(selector);
      if (el && (el.textContent.includes('$') || el.textContent.toLowerCase().includes('year'))) {
        data.salary = el.textContent.trim();
        break;
      }
    }
    
    // Work arrangement
    const jobDetails = document.querySelectorAll('.jobsearch-JobDescriptionSection-sectionItem, [data-testid="attribute_snippet_testid"]');
    jobDetails.forEach(el => {
      const text = el.textContent.toLowerCase();
      if (text.includes('remote') && !data.workArrangement) {
        data.workArrangement = 'Remote';
      } else if (text.includes('hybrid') && !data.workArrangement) {
        data.workArrangement = 'Hybrid';
      }
    });
    
    return data;
  }
};
