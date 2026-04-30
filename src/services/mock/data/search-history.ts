import type { SearchHistoryEntry } from '../../types';

function getDateStr(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
}

export const mockSearchHistory: SearchHistoryEntry[] = [
  {
    id: 'sh1',
    query: 'Stankovic',
    resultCount: 3,
    searchedAt: getDateStr(0),
  },
  {
    id: 'sh2',
    query: 'P 123/2025',
    resultCount: 1,
    searchedAt: getDateStr(-1),
  },
  {
    id: 'sh3',
    query: 'ugovor',
    resultCount: 5,
    searchedAt: getDateStr(-1),
  },
  {
    id: 'sh4',
    query: 'rok',
    resultCount: 4,
    searchedAt: getDateStr(-2),
  },
  {
    id: 'sh5',
    query: 'zalba',
    resultCount: 2,
    searchedAt: getDateStr(-3),
  },
  {
    id: 'sh6',
    query: 'Popovic',
    resultCount: 2,
    searchedAt: getDateStr(-5),
  },
];
