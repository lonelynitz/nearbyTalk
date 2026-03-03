export const ADJECTIVES = [
  'Brave', 'Silent', 'Swift', 'Clever', 'Bold', 'Calm', 'Fierce', 'Gentle',
  'Happy', 'Lucky', 'Mystic', 'Noble', 'Quick', 'Shy', 'Wild', 'Zen',
  'Cosmic', 'Frozen', 'Golden', 'Hidden', 'Iron', 'Jade', 'Lunar', 'Neon',
  'Pixel', 'Royal', 'Shadow', 'Turbo', 'Ultra', 'Vivid', 'Azure', 'Crimson',
];

export const ANIMALS = [
  'Fox', 'Wolf', 'Eagle', 'Bear', 'Hawk', 'Lion', 'Tiger', 'Panda',
  'Owl', 'Shark', 'Dolphin', 'Raven', 'Cobra', 'Falcon', 'Lynx', 'Otter',
  'Phoenix', 'Dragon', 'Panther', 'Jaguar', 'Viper', 'Crane', 'Moose', 'Bison',
];

export const RADIUS_OPTIONS = [
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 25, label: '25 km' },
  { value: 50, label: '50 km' },
];

export const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export const RATE_LIMITS = {
  MESSAGES_PER_SECOND: 1,
  CONNECTIONS_PER_MINUTE: 5,
};

export const REPORT_REASONS = [
  'Harassment',
  'Spam',
  'Inappropriate content',
  'Threatening behavior',
  'Other',
];

export const BAN_THRESHOLD = 5;

export const MAX_GROUP_SIZE = 10;

export const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];

export const VIDEO_SYNC_DEBOUNCE_MS = 500;
