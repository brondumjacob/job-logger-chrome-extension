/**
 * Content Script
 * Injected into job posting pages to scrape job details
 */

import { scrapeJobData } from './scrapers/index.js';

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_JOB_DATA') {
    const jobData = scrapeJobData(window.location.href, document);
    sendResponse({ success: true, data: jobData });
  }
  return false;
});

// Notify background script that we're on a job page
chrome.runtime.sendMessage({ type: 'UPDATE_BADGE', show: true });

console.log('Job Logger content script loaded on:', window.location.href);
