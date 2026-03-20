export const COLORS = {
  primary: '#E4002B',
  primaryDark: '#B8001E',
  secondary: '#FFC72C',
  white: '#FFFFFF',
  bg: '#F5F5F5',
  surface: '#FFFFFF',
  border: '#E0E0E0',
  text: '#1A1A1A',
  textMuted: '#666666',
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

export const CATEGORIES = ['FOH', 'Drive Thru', 'Other'];
