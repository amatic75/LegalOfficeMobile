import type { TimeEntry } from '../../types';

export const mockTimeEntries: TimeEntry[] = [
  {
    id: 'te1',
    caseId: 'cs1',
    hours: 2.5,
    description: 'Priprema tuzbe za naknadu stete',
    date: '2025-03-10',
    billable: true,
    createdAt: '2025-03-10T17:00:00Z',
  },
  {
    id: 'te2',
    caseId: 'cs1',
    hours: 1,
    description: 'Konsultacije sa klijentom telefonom',
    date: '2025-03-05',
    billable: true,
    createdAt: '2025-03-05T10:00:00Z',
  },
  {
    id: 'te3',
    caseId: 'cs2',
    hours: 3,
    description: 'Analiza dokaza i priprema odbrane',
    date: '2025-03-08',
    billable: true,
    createdAt: '2025-03-08T15:00:00Z',
  },
  {
    id: 'te4',
    caseId: 'cs2',
    hours: 0.5,
    description: 'Interni sastanak - pregled slucaja',
    date: '2025-03-06',
    billable: false,
    createdAt: '2025-03-06T12:00:00Z',
  },
  {
    id: 'te5',
    caseId: 'cs3',
    hours: 4,
    description: 'Priprema sporazuma o podeli imovine',
    date: '2025-02-28',
    billable: true,
    createdAt: '2025-02-28T18:00:00Z',
  },
];
