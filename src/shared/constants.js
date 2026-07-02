/**
 * Shared Constants
 * Used by background.js (ES modules supported after Vite bundle)
 */

// Set to false for production builds (enables Google Sheets integration)
export const DEV_MODE = true;

// Unified column layout — 14 columns A-N
export const UNIFIED_COLUMNS = [
  { key: 'status',          header: 'Status',           column: 'A' },
  { key: 'dateApplied',     header: 'Date Applied',     column: 'B' },
  { key: 'company',         header: 'Company',          column: 'C' },
  { key: 'role',            header: 'Role',             column: 'D' },
  { key: 'tier',            header: 'Tier',             column: 'E' },
  { key: 'salary',          header: 'Salary Range',     column: 'F' },
  { key: 'location',        header: 'Location',         column: 'G' },
  { key: 'workArrangement', header: 'Work Arrangement', column: 'H' },
  { key: 'source',          header: 'Source',           column: 'I' },
  { key: 'recruiter',       header: 'Recruiter',        column: 'J' },
  { key: 'keyDetails',      header: 'Key Details',      column: 'K' },
  { key: 'nextSteps',       header: 'Next Steps',       column: 'L' },
  { key: 'notes',           header: 'Notes',            column: 'M' },
  { key: 'url',             header: 'URL',              column: 'N' },
];

export const STATUS_OPTIONS = [
  'Not Yet Applied',
  'Applied',
  'Phone Screen',
  'Interview Scheduled',
  'Interviewing',
  'Interview 1',
  'Interview 2',
  'Final Round',
  'Offer',
  'Rejected',
  'Withdrawn',
  'Ghosted'
];

export const TIER_OPTIONS = ['Tier 1', 'Tier 2', 'Tier 3'];

export const WORK_ARRANGEMENT_OPTIONS = ['Remote', 'Hybrid', 'On-site'];

export const SOURCE_OPTIONS = [
  'LinkedIn',
  'Indeed',
  'Glassdoor',
  'Greenhouse',
  'Lever',
  'Workday',
  'Company Website',
  'Recruiter',
  'Referral',
  'Other'
];

export const STATUS_COLORS = {
  'Not Yet Applied':     '#f3f4f6',
  'Applied':             '#dcfce7',
  'Phone Screen':        '#dbeafe',
  'Interview Scheduled': '#dbeafe',
  'Interviewing':        '#fef3c7',
  'Interview 1':         '#fef3c7',
  'Interview 2':         '#fde68a',
  'Final Round':         '#fcd34d',
  'Offer':               '#bbf7d0',
  'Rejected':            '#fecaca',
  'Withdrawn':           '#e5e7eb',
  'Ghosted':             '#f3f4f6'
};
