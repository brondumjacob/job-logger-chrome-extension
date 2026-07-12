/**
 * Content Script - Self-contained (no imports)
 * Injected into job posting pages to scrape job details
 */

// Must match DEV_MODE in src/shared/constants.js — content scripts can't
// use ES module imports, so this is kept in sync manually.
const DEV_MODE = true;

// ============================================
// SCRAPERS
// ============================================

// LinkedIn has shipped a frontend variant that uses fully-hashed, non-semantic
// CSS classes (e.g. "fee11784 _20dea5d9") with no stable selector, data-testid,
// or aria-label anywhere in the job detail markup — the selectors above can't
// match it at all. As a fallback (used only for whatever those selectors miss,
// so sessions still served the classic markup are unaffected), this scopes a
// text-pattern search to the specific job's detail container: walk up from the
// company link (matched by name, since duplicates exist for list-card links)
// until the container includes both the role text and a salary figure — that
// naturally excludes sibling "related jobs" cards, which is essential on the
// split-view search-results layout where a job's own salary/location/work-
// arrangement text can appear a dozen times across other cards on the same page.
function findLinkedInDetailContainer(doc, role, company) {
  const companyLinks = [...doc.querySelectorAll('a[href*="/company/"]')].filter(
    (a) => a.textContent.trim() === company
  );
  if (!companyLinks.length) return null;

  let el = companyLinks[0];
  let fallback = null;
  for (let i = 0; i < 20 && el; i++) {
    const txt = el.textContent;
    if (role && txt.includes(role) && txt.includes(company) && !fallback) fallback = el;
    if (role && txt.includes(role) && /\$[\d,]+K/.test(txt)) return el;
    el = el.parentElement;
  }
  return fallback;
}

function findLinkedInLeafText(container, regex, maxLen) {
  const match = [...container.querySelectorAll('span, div')].find(
    (e) => e.children.length === 0 && regex.test(e.textContent.trim()) && e.textContent.trim().length < maxLen
  );
  return match ? match.textContent.trim() : '';
}

// Many job boards embed schema.org JobPosting structured data for Google for
// Jobs SEO — board operators have real incentive to keep it accurate even as
// they redesign their CSS, making it a more stable source than any selector.
// Used to fill role/company first (selectors as fallback); location stays
// selector-first below since it's already proven more complete on at least
// one board (Workday's JSON-LD omits the state that its own DOM includes).
function findJobPostingLd(doc) {
  const scripts = [...doc.querySelectorAll('script[type="application/ld+json"]')];
  for (const s of scripts) {
    let parsed;
    try { parsed = JSON.parse(s.textContent); } catch (e) { continue; }
    const candidates = Array.isArray(parsed) ? parsed : [parsed];
    for (const c of candidates) {
      if (c && c['@type'] === 'JobPosting') return c;
      if (c && Array.isArray(c['@graph'])) {
        const found = c['@graph'].find((g) => g && g['@type'] === 'JobPosting');
        if (found) return found;
      }
    }
  }
  return null;
}

function jobPostingLocationText(jobPosting) {
  const loc = Array.isArray(jobPosting?.jobLocation) ? jobPosting.jobLocation[0] : jobPosting?.jobLocation;
  const addr = loc?.address;
  if (!addr) return '';
  return [addr.addressLocality, addr.addressRegion].filter(Boolean).join(', ');
}

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

      // Fallback for the hashed-CSS variant: document.title reliably follows
      // "{Role} | {Company} | LinkedIn", independent of any CSS class.
      if (!data.role || !data.company) {
        const titleParts = (doc.title || '').split(' | ');
        if (!data.role && titleParts[0]) data.role = titleParts[0].trim();
        if (!data.company && titleParts[1] && titleParts[1] !== 'LinkedIn') data.company = titleParts[1].trim();
      }

      if (data.company && (!data.location || !data.salary || !data.workArrangement)) {
        const container = findLinkedInDetailContainer(doc, data.role, data.company);
        if (container) {
          if (!data.salary) data.salary = findLinkedInLeafText(container, /\$[\d,]+K?\/?(yr|hr)?/, 40);
          if (!data.location) {
            data.location = findLinkedInLeafText(container, /^[A-Za-z .]+,\s*[A-Z]{2}(\s*\(.*\))?$|Metroplex/, 60);
          }
          if (!data.workArrangement) {
            const wa = findLinkedInLeafText(container, /^Remote$|^Hybrid$|^On-site$/, 20);
            if (wa) data.workArrangement = wa;
          }
        }
      }

      return data;
    }
  },

  indeed: {
    name: 'Indeed',
    matches: (url) => url.includes('indeed.com'),
    scrape: (doc) => {
      const data = { company: '', role: '', location: '', salary: '', workArrangement: '', source: 'Indeed' };

      // Only present on the direct /viewjob page, not the split-view search
      // results page — selectors below cover both.
      const jobPosting = findJobPostingLd(doc);
      if (jobPosting) {
        if (jobPosting.title) data.role = jobPosting.title.trim();
        if (jobPosting.hiringOrganization?.name) data.company = jobPosting.hiringOrganization.name.trim();
      }

      if (!data.role) {
        const titleEl = doc.querySelector('.jobsearch-JobInfoHeader-title, h1[data-testid="jobsearch-JobInfoHeader-title"]');
        if (titleEl) data.role = titleEl.textContent.trim().replace(/\s+/g, ' ');
      }
      if (!data.company) {
        const companyEl = doc.querySelector('[data-testid="inlineHeader-companyName"] a, [data-testid="inlineHeader-companyName"]');
        if (companyEl) data.company = companyEl.textContent.trim();
      }

      const locationEl = doc.querySelector('[data-testid="job-location"], [data-testid="inlineHeader-companyLocation"]');
      if (locationEl) data.location = locationEl.textContent.trim();
      else {
        const loc = jobPostingLocationText(jobPosting);
        if (loc) data.location = loc;
      }

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

      // Greenhouse migrated postings from boards.greenhouse.io to
      // job-boards.greenhouse.io with a different template — old selectors
      // are kept first for orgs still on the classic template, new ones
      // (.job__title h1, .job__location, img.logo) cover the current one.
      const titleEl = doc.querySelector('.app-title, h1.heading, .job-title, .job__title h1');
      if (titleEl) data.role = titleEl.textContent.trim();

      const logoEl = doc.querySelector('.company-name, #header .logo img, img.logo');
      if (logoEl) data.company = (logoEl.alt || logoEl.textContent.trim()).replace(/\s+Logo$/i, '').trim();

      if (!data.company) {
        const urlMatch = window.location.pathname.match(/\/([^/]+)/);
        if (urlMatch) data.company = urlMatch[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      }

      const locationEl = doc.querySelector('.location, .job-location, .job__location');
      if (locationEl) data.location = locationEl.textContent.trim();

      return data;
    }
  },

  lever: {
    name: 'Lever',
    matches: (url) => url.includes('lever.co'),
    scrape: (doc) => {
      const data = { company: '', role: '', location: '', salary: '', workArrangement: '', source: 'Lever' };

      const jobPosting = findJobPostingLd(doc);
      if (jobPosting) {
        if (jobPosting.title) data.role = jobPosting.title.trim();
        if (jobPosting.hiringOrganization?.name) data.company = jobPosting.hiringOrganization.name.trim();
      }

      if (!data.role) {
        const titleEl = doc.querySelector('.posting-headline h2, h2');
        if (titleEl) data.role = titleEl.textContent.trim();
      }
      if (!data.company) {
        const logoEl = doc.querySelector('.main-header-logo img');
        if (logoEl && logoEl.alt) data.company = logoEl.alt;
        else {
          const urlMatch = window.location.pathname.match(/\/([^/]+)/);
          if (urlMatch) data.company = urlMatch[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        }
      }

      const categories = doc.querySelectorAll('.posting-categories .sort-by-location, .posting-category');
      categories.forEach(el => {
        const text = el.textContent.trim();
        if (!data.location && text.match(/[A-Za-z]+,\s*[A-Z]{2}/)) data.location = text;
        if (text.toLowerCase().includes('remote')) data.workArrangement = 'Remote';
        else if (text.toLowerCase().includes('hybrid')) data.workArrangement = 'Hybrid';
      });
      if (!data.location) {
        const loc = jobPostingLocationText(jobPosting);
        if (loc) data.location = loc;
      }

      return data;
    }
  },

  workday: {
    name: 'Workday',
    matches: (url) => url.includes('myworkdayjobs.com'),
    scrape: (doc) => {
      const data = { company: '', role: '', location: '', salary: '', workArrangement: '', source: 'Workday' };

      // hiringOrganization.name (e.g. "The Chamberlain Group LLC") is more
      // accurate than guessing a company name from the subdomain.
      const jobPosting = findJobPostingLd(doc);
      if (jobPosting) {
        if (jobPosting.title) data.role = jobPosting.title.trim();
        if (jobPosting.hiringOrganization?.name) data.company = jobPosting.hiringOrganization.name.trim();
      }

      if (!data.role) {
        const titleEl = doc.querySelector('[data-automation-id="jobPostingHeader"], [data-automation-id="jobTitle"], h2');
        if (titleEl) data.role = titleEl.textContent.trim();
      }
      if (!data.company) {
        const companyMatch = window.location.hostname.match(/([^.]+)\.myworkdayjobs/);
        if (companyMatch) data.company = companyMatch[1].replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^\w/, c => c.toUpperCase());
      }

      // The [data-automation-id="locations"] block is a <dl>; querying it
      // directly picks up its "locations" <dt> label as a text prefix, so
      // scope to the <dd> value specifically. This has to be a separate,
      // sequential lookup rather than one comma-separated selector — the
      // wrapper and its own <dd> child would both match a combined list,
      // and querySelector returns document-order first (the wrapper, since
      // it contains the dd), not list-order first, silently defeating the
      // "prefer dd" intent. JSON-LD's location is missing the state on at
      // least one real listing, so it's the last resort, not first choice.
      const locationEl =
        doc.querySelector('[data-automation-id="locations"] dd') ||
        doc.querySelector('[data-automation-id="locations"], [data-automation-id="location"]');
      if (locationEl) data.location = locationEl.textContent.trim();
      else {
        const loc = jobPostingLocationText(jobPosting);
        if (loc) data.location = loc;
      }

      return data;
    }
  },

  glassdoor: {
    name: 'Glassdoor',
    matches: (url) => url.includes('glassdoor.com/job-listing'),
    scrape: (doc) => {
      const data = { company: '', role: '', location: '', salary: '', workArrangement: '', source: 'Glassdoor' };

      // title/company selectors are currently broken (Glassdoor markup
      // change) — JSON-LD fills those; location/salary selectors still work.
      const jobPosting = findJobPostingLd(doc);
      if (jobPosting) {
        if (jobPosting.title) data.role = jobPosting.title.trim();
        if (jobPosting.hiringOrganization?.name) data.company = jobPosting.hiringOrganization.name.trim();
      }

      if (!data.role) {
        const titleEl = doc.querySelector('[data-test="jobTitle"], h1[class*="title"]');
        if (titleEl) data.role = titleEl.textContent.trim();
      }
      if (!data.company) {
        const companyEl = doc.querySelector('[data-test="employer-name"]');
        if (companyEl) data.company = companyEl.textContent.trim();
      }

      const locationEl = doc.querySelector('[data-test="location"]');
      if (locationEl) data.location = locationEl.textContent.trim();
      else {
        const loc = jobPostingLocationText(jobPosting);
        if (loc) data.location = loc;
      }

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
  if (DEV_MODE) console.log(`[Job Logger] Using ${scraper.name} scraper`);

  try {
    const data = scraper.scrape(document);
    if (DEV_MODE) console.log('[Job Logger] Scraped data:', data);
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
  if (sender.id !== chrome.runtime.id) return false;
  if (DEV_MODE) console.log('[Job Logger] Content script received message:', message.type);

  if (message.type === 'GET_JOB_DATA') {
    const jobData = scrapeJobData();
    sendResponse({ success: true, data: jobData });
  }
  return true;
});

// Notify that content script loaded
if (DEV_MODE) console.log('[Job Logger] Content script loaded on:', window.location.href);
