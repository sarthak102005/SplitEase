// Fixed roommates
export const ROOMMATES = [
  { id: 'aayush', name: 'Aayush' },
  { id: 'hardik', name: 'Hardik' },
  { id: 'sujal',  name: 'Sujal'  },
];

export const ROOMMATE_IDS = ROOMMATES.map(r => r.id);

export const ROOMMATE_MAP = Object.fromEntries(ROOMMATES.map(r => [r.id, r.name]));

// localStorage
export const STORAGE_KEY   = 'roommate_expense_splitter_v1';
export const SCHEMA_VERSION = 1;

// Colours
export const ROOMMATE_COLORS = {
  aayush: '#3b82f6',
  hardik: '#8b5cf6',
  sujal:  '#06b6d4',
};
