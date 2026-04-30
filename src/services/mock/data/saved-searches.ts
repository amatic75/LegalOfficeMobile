import type { SavedSearch } from '../../types';

function getDateStr(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
}

export const mockSavedSearches: SavedSearch[] = [
  {
    id: 'ss1',
    name: 'Moji aktivni predmeti',
    query: '',
    filters: { types: ['case'], status: ['active'], lawyerId: '1' },
    createdAt: getDateStr(-14),
  },
  {
    id: 'ss2',
    name: 'Hitni rokovi',
    query: '',
    filters: { types: ['event'], dateFrom: new Date().toISOString().split('T')[0], dateTo: (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split('T')[0]; })() },
    createdAt: getDateStr(-7),
  },
  {
    id: 'ss3',
    name: 'Klijent Stankovic',
    query: 'Stankovic',
    filters: {},
    createdAt: getDateStr(-3),
  },
];
