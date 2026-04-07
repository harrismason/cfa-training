export const COLORS = {
  primary: '#1E3A8A',
  primaryDark: '#1e3070',
  secondary: '#0EA5E9',
  white: '#FFFFFF',
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textMuted: '#64748B',
  success: '#2E7D32',
  warning: '#F57C00',
  notStarted: '#9E9E9E',
};

export const STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  TRAINED: 'trained',
  NEEDS_RECERT: 'needs_recert',
};

export const STATUS_LABELS = {
  [STATUS.NOT_STARTED]: 'Not Started',
  [STATUS.IN_PROGRESS]: 'In Progress',
  [STATUS.TRAINED]: 'Trained',
  [STATUS.NEEDS_RECERT]: 'Needs Recertification',
};

export const STATUS_COLORS = {
  [STATUS.NOT_STARTED]: COLORS.notStarted,
  [STATUS.IN_PROGRESS]: COLORS.warning,
  [STATUS.TRAINED]: COLORS.success,
  [STATUS.NEEDS_RECERT]: '#7B1FA2',
};

export const STATUS_CYCLE = {
  [STATUS.NOT_STARTED]: STATUS.IN_PROGRESS,
  [STATUS.IN_PROGRESS]: STATUS.TRAINED,
  [STATUS.TRAINED]: STATUS.NOT_STARTED,
  [STATUS.NEEDS_RECERT]: STATUS.NOT_STARTED,
};

export const RECORD_TAGS = {
  NEEDS_TRAINING: 'needs_training',
  PRACTICE_ONLY: 'practice_only',
};

export const RECORD_TAG_LABELS = {
  needs_training: 'Needs Training',
  practice_only: 'Practice Only',
};

export const ROLES = ['Team Member', 'Trainer', 'Team Lead'];

export const ROLE_COLORS = {
  'Team Member': { bg: '#EFF6FF', text: '#1D4ED8', avatar: '#2563EB' },
  'Trainer':     { bg: '#ECFDF5', text: '#047857', avatar: '#059669' },
  'Team Lead':   { bg: '#FFFBEB', text: '#92400E', avatar: '#D97706' },
};

export const SHIFT_TYPES = {
  TRAINING: 'training',
  PRACTICE: 'practice',
};

export const CATEGORIES = ['FOH', 'Drive Thru', 'Other'];

export const TIER_LABELS = { 1: 'Basic', 2: 'Intermediate', 3: 'Advanced' };
export const TIER_COLORS = {
  1: { bg: '#E8F5E9', text: '#2E7D32' },
  2: { bg: '#FFF3E0', text: '#E65100' },
  3: { bg: '#EDE7F6', text: '#6A1B9A' },
};

export const ACCESS_LEVELS = { MEMBER: 'member', TRAINER: 'trainer', MANAGER: 'manager' };

export const CHECKLIST_CATEGORIES = ['Paperwork', 'Certifications', 'Uniform', 'Training', 'Orientation'];

export const DEFAULT_CHECKLIST_ITEMS = [
  { id: 'ci-1', label: 'Complete I-9 employment eligibility form', category: 'Paperwork',      required: true,  order: 1, createdAt: '' },
  { id: 'ci-2', label: 'Complete W-4 withholding form',            category: 'Paperwork',      required: true,  order: 2, createdAt: '' },
  { id: 'ci-3', label: 'Set up direct deposit',                    category: 'Paperwork',      required: false, order: 3, createdAt: '' },
  { id: 'ci-4', label: 'Food handler certificate obtained',        category: 'Certifications', required: true,  order: 4, createdAt: '' },
  { id: 'ci-5', label: 'Uniform issued and fitted',                category: 'Uniform',        required: true,  order: 5, createdAt: '' },
  { id: 'ci-6', label: 'Watch CFA orientation video series',       category: 'Training',       required: true,  order: 6, createdAt: '' },
  { id: 'ci-7', label: 'Complete ServSafe food safety module',     category: 'Training',       required: true,  order: 7, createdAt: '' },
  { id: 'ci-8', label: 'Store tour completed',                     category: 'Orientation',    required: true,  order: 8, createdAt: '' },
  { id: 'ci-9', label: 'Meet team and introductions',              category: 'Orientation',    required: false, order: 9, createdAt: '' },
];

export const DEFAULT_TEMPLATES = [
  { id: 'builtin-new-hire',       name: 'New Hire – 2 Week',   description: 'Standard onboarding for first-time team members', positionIds: [], estimatedWeeks: 2, tier: 1, isBuiltIn: true, createdAt: '' },
  { id: 'builtin-cross-training', name: 'Cross-Training',       description: 'Expand a trained team member into new positions',  positionIds: [], estimatedWeeks: 3, tier: 2, isBuiltIn: true, createdAt: '' },
  { id: 'builtin-refresher',      name: 'Refresher',            description: 'Quick recertification for positions needing renewal', positionIds: [], estimatedWeeks: 1, tier: 1, isBuiltIn: true, createdAt: '' },
];
