import type { Expense } from '../../types';

export const mockExpenses: Expense[] = [
  {
    id: 'exp1',
    caseId: 'cs1',
    amount: 15000,
    category: 'court-fees',
    description: 'Sudska taksa za podnosenje tuzbe',
    date: '2025-01-15',
    paid: false,
    createdAt: '2025-01-15T09:00:00Z',
  },
  {
    id: 'exp2',
    caseId: 'cs1',
    amount: 3500,
    category: 'travel',
    description: 'Putni troskovi - odlazak u sud u Beogradu',
    date: '2025-03-01',
    paid: true,
    createdAt: '2025-03-01T16:00:00Z',
  },
  {
    id: 'exp3',
    caseId: 'cs1',
    amount: 45000,
    category: 'expert-witnesses',
    description: 'Honorar sudskog vestaka za procenu stete',
    date: '2025-03-10',
    paid: false,
    createdAt: '2025-03-10T14:00:00Z',
  },
  {
    id: 'exp4',
    caseId: 'cs2',
    amount: 2000,
    category: 'copying',
    description: 'Kopiranje i overa dokumentacije',
    date: '2025-03-07',
    paid: true,
    createdAt: '2025-03-07T11:00:00Z',
  },
];
