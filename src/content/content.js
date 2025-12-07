/**
 * Content Script - Self-contained (no imports)
 * Injected into job posting pages to scrape job details
 */

// ============================================
// SCRAPERS
// ============================================

const scrapers = {
  linkedin: {
    name: 'LinkedIn',
    matches: (url) => url.includes('linkedin.com/jobs'),
    scrape: (doc) => {
      const data = { company: '', role: '', location: '', salary: '', workArrangement: '', source: 'LinkedIn' };
      
      // Role
      const titleSelectors = [
        '.job-details-jobs-unified-top-card__job-title h1',
        '.job-details-jobs-unified-top-card__job-title',
        '.topcard__title',
        'h1.t-24',
        '.jobs-unified-top-card__job-title'
      ];
      for (const sel of titleSelectors) {
        const el = doc.querySelector(sel);
        if (el) { data.role = el.textContent.trim(); break; }
      }
      
      // Company
      const companySelectors = [
        '.job-details-jobs-unified-top-card__company-name a',
        '.job-details-jobs-unified-top-card__primary-description-container a',
        '.topcard__org-name-link',
        '.jobs-unified-top-card__company-name a'
      ];
      for (const sel of companySelectors) {
        const el = doc.querySelector(sel);
        if (el) { data.company = el.textContent.trim(); break; }
      }
      
      // Location
      const locationSelectors = [
        '.job-details-jobs-unified-top-card__bullet',
        '.topcard__flavor--bullet',
        '.jobs-unified-top-card__bullet'
      ];
      for (const sel of locationSelectors) {
        const el = doc.querySelector(sel);
        if (el) { data.location = el.textContent.trim(); break; }
      }
      
      // Work arrangement
      const workplaceEl = doc.querySelector('.job-details-jobs-unified-top-card__workplace-type, [class*="workplace-type"]');
      if (workplaceEl) {
        const text = workplaceEl.textContent.toLowerCase();
        if (text.includes('remote')) data.workArrangement = 'Remote';
        else if (text.includes('hybrid')) data.workArrangement = 'Hybrid';
        else if (text.includes('on-site')) data.workArrangement = 'On-site';
      }
      
      // Salary
      const salaryEl = doc.querySelector('.salary-main-rail__salary-range, [class*="salary"]');
      if (salaryEl && salaryEl.textContent.includes('$')) {
        data.salary = salaryEl.textContent.trim();
      }
      
      return data;
    }
  },

  indeed: {
    name: 'Indeed',
    matches: (url) => url.includes('indeed.com'),
    scrape: (doc) => {
      const data = { company: '', role: '', location: '', salary: '', workArrangement: '', source: 'Indeed' };
      
      const titleEl = doc.querySelector('.jobsearch-JobInfoHeader-title, h1[data-testid="jobsearch-JobInfoHeader-title"]');
      if (titleEl) data.role = titleEl.textContent.trim().replace(/\s+/g, ' ');
      
      const companyEl = doc.querySelector('[data-testid="inlineHeader-companyName"] a, [data-testid="inlineHeader-companyName"]');
      if (companyEl) data.company = companyEl.textContent.trim();
      
      const locationEl = doc.querySelector('[data-testid="job-location"], [data-testid="inlineHeader-companyLocation"]');
      if (locationEl) data.location = locationEl.textContent.trim();
      
      const salaryEl = doc.querySelector('#salaryInfoAndJobType span, .salary-snippet');
      if (salaryEl && salaryEl.textContent.includes('$')) data.salary = salaryEl.textContent.trim();
      
      return data;
    }
  },

  greenhouse: {
    name: 'Greenhouse',
    matches: (url) => url.includes('greenhouse.io'),
    scrape: (doc) => {
      const data = { company: '', role: '', location: '', salary: '', workArrangement: '', source: 'Greenhouse' };
      
      const titleEl = doc.querySelector('.app-title, h1.heading, .job-title');
      if (titleEl) data.role = titleEl.textContent.trim();
      
      const logoEl = doc.querySelector('.company-name, #header .logo img');
      if (logoEl) data.company = logoEl.alt || logoEl.textContent.trim();
      
      if (!data.company) {
        const urlMatch = window.location.pathname.match(/\/([^/]+)/);
        if (urlMatch) data.company = urlMatch[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      }
      
      const locationEl = doc.querySelector('.location, .job-location');
      if (locationEl) data.location = locationEl.textContent.trim();
      
      return data;
    }
  },

  lever: {
    name: 'Lever',
    matches: (url) => url.includes('lever.co'),
    scrape: (doc) => {
      const data = { company: '', role: '', location: '', salary: '', workArrangement: '', source: 'Lever' };
      
      const titleEl = doc.querySelector('.posting-headline h2, h2');
      if (titleEl) data.role = titleEl.textContent.trim();
      
      const logoEl = doc.querySelector('.main-header-logo img');
      if (logoEl && logoEl.alt) data.company = logoEl.alt;
      else {
        const urlMatch = window.location.pathname.match(/\/([^/]+)/);
        if (urlMatch) data.company = urlMatch[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      }
      
      const categories = doc.querySelectorAll('.posting-categories .sort-by-location, .posting-category');
      categories.forEach(el => {
        const text = el.textContent.trim();
        if (text.match(/[A-Za-z]+,\s*[A-Z]{2}/)) data.location = text;
        if (text.toLowerCase().includes('remote')) data.workArrangement = 'Remote';
        else if (text.toLowerCase().includes('hybrid')) data.workArrangement = 'Hybrid';
      });
      
      return data;
    }
  },

  workday: {
    name: 'Workday',
    matches: (url) => url.includes('myworkdayjobs.com'),
    scrape: (doc) => {
      const data = { company: '', role: '', location: '', salary: '', workArrangement: '', source: 'Workday' };
      
      const titleEl = doc.querySelector('[data-automation-id="jobPostingHeader"], [data-automation-id="jobTitle"], h2');
      if (titleEl) data.role = titleEl.textContent.trim();
      
      const companyMatch = window.location.hostname.match(/([^.]+)\.myworkdayjobs/);
      if (companyMatch) data.company = companyMatch[1].replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^\w/, c => c.toUpperCase());
      
      const locationEl = doc.querySelector('[data-automation-id="locations"], [data-automation-id="location"]');
      if (locationEl) data.location = locationEl.textContent.trim();
      
      return data;
    }
  },

  glassdoor: {
    name: 'Glassdoor',
    matches: (url) => url.includes('glassdoor.com/job-listing'),
    scrape: (doc) => {
      const data = { company: '', role: '', location: '', salary: '', workArrangement: '', source: 'Glassdoor' };
      
      const titleEl = doc.querySelector('[data-test="jobTitle"], h1[class*="title"]');
      if (titleEl) data.role = titleEl.textContent.trim();
      
      const companyEl = doc.querySelector('[data-test="employer-name"]');
      if (companyEl) data.company = companyEl.textContent.trim();
      
      const locationEl = doc.querySelector('[data-test="location"]');
      if (locationEl) data.location = locationEl.textContent.trim();
      
      const salaryEl = doc.querySelector('[data-test="detailSalary"]');
      if (salaryEl) data.salary = salaryEl.textContent.trim();
      
      return data;
    }
  },

  generic: {
    name: 'Generic',
    matches: () => true,
    scrape: (doc) => {
      const data = { company: '', role: '', location: '', salary: '', workArrangement: '', source: 'Direct Application' };
      
      // Try h1 tags
      const h1 = doc.querySelector('h1');
      if (h1 && h1.textContent.length < 200) data.role = h1.textContent.trim();
      
      // Company from meta or domain
      const meta = doc.querySelector('meta[property="og:site_name"]');
      if (meta) data.company = meta.content;
      else {
        const domain = window.location.hostname.replace('www.', '').replace('careers.', '').split('.')[0];
        data.company = domain.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      }
      
      return data;
    }
  }
};

// ============================================
// MAIN LOGIC
// ============================================

function getScraper(url) {
  const scraperList = [scrapers.linkedin, scrapers.indeed, scrapers.greenhouse, scrapers.lever, scrapers.workday, scrapers.glassdoor];
  for (const s of scraperList) {
    if (s.matches(url)) return s;
  }
  return scrapers.generic;
}

function scrapeJobData() {
  const url = window.location.href;
  const scraper = getScraper(url);
  console.log(`[Job Logger] Using ${scraper.name} scraper`);
  
  try {
    const data = scraper.scrape(document);
    console.log('[Job Logger] Scraped data:', data);
    return {
      ...data,
      url: url,
      autoDetected: true
    };
  } catch (error) {
    console.error('[Job Logger] Scrape error:', error);
    return { company: '', role: '', location: '', salary: '', workArrangement: '', source: '', autoDetected: false };
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Job Logger] Content script received message:', message.type);
  
  if (message.type === 'GET_JOB_DATA') {
    const jobData = scrapeJobData();
    sendResponse({ success: true, data: jobData });
  }
  return true;
});

// Notify that content script loaded
console.log('[Job Logger] Content script loaded on:', window.location.href);
