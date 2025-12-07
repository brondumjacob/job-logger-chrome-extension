/**
 * Shared Constants
 */

export const STATUS_OPTIONS = [
  'Not Yet Applied',
  'Applied',
  'Phone Screen',
  'Interview Scheduled',
  'Interviewing',
  'Offer',
  'Rejected',
  'Withdrawn',
  'Ghosted'
];

export const TIER_OPTIONS = [
  'Tier 1',
  'Tier 2',
  'Tier 3'
];

export const WORK_ARRANGEMENT_OPTIONS = [
  'Remote',
  'Hybrid',
  'On-site'
];

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

export const DEFAULT_COLUMN_MAPPING = {
  company: 'A',
  role: 'B',
  tier: 'C',
  salary: 'D',
  marketRange: 'E',
  location: 'F',
  workArrangement: 'G',
  status: 'H',
  source: 'I',
  recruiter: 'J',
  notes: 'K',
  dateApplied: 'L'
};

export const STATUS_COLORS = {
  'Not Yet Applied': '#f3f4f6',
  'Applied': '#dcfce7',
  'Phone Screen': '#dbeafe',
  'Interview Scheduled': '#dbeafe',
  'Interviewing': '#fef3c7',
  'Offer': '#bbf7d0',
  'Rejected': '#fecaca',
  'Withdrawn': '#e5e7eb',
  'Ghosted': '#f3f4f6'
};
