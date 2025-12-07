/**
 * Scraper Router
 * Selects the appropriate scraper based on URL
 */

import linkedinScraper from './linkedin.js';
import indeedScraper from './indeed.js';
import greenhouseScraper from './greenhouse.js';
import leverScraper from './lever.js';
import workdayScraper from './workday.js';
import glassdoorScraper from './glassdoor.js';
import genericScraper from './generic.js';

const scrapers = [
  linkedinScraper,
  indeedScraper,
  greenhouseScraper,
  leverScraper,
  workdayScraper,
  glassdoorScraper
];

/**
 * Get the appropriate scraper for a URL
 */
function getScraper(url) {
  for (const scraper of scrapers) {
    if (scraper.matches(url)) {
      return scraper;
    }
  }
  return genericScraper;
}

/**
 * Scrape job data from the current page
 */
export function scrapeJobData(url, document) {
  const scraper = getScraper(url);
  console.log(`Using ${scraper.name} scraper for ${url}`);
  
  try {
    const data = scraper.scrape(document);
    return {
      ...data,
      url: url,
      scrapedAt: new Date().toISOString(),
      scraperUsed: scraper.name,
      autoDetected: true
    };
  } catch (error) {
    console.error('Scraper error:', error);
    return {
      company: '',
      role: '',
      location: '',
      salary: '',
      workArrangement: '',
      source: scraper.name === 'Generic' ? 'Direct Application' : scraper.name,
      url: url,
      autoDetected: false,
      error: error.message
    };
  }
}

export default { scrapeJobData, getScraper };
