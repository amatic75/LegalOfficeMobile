import type { User } from '../../types';

export const mockUsers: User[] = [
  {
    id: '1',
    firstName: 'Marko',
    lastName: 'Petrovic',
    email: 'marko.petrovic@advokat.rs',
    role: 'lawyer',
  },
  {
    id: '2',
    firstName: 'Jelena',
    lastName: 'Jovanovic',
    email: 'jelena.jovanovic@advokat.rs',
    role: 'admin',
  },
  {
    id: '3',
    firstName: 'Stefan',
    lastName: 'Nikolic',
    email: 'stefan.nikolic@advokat.rs',
    role: 'trainee',
  },
  {
    id: '4',
    firstName: 'Ana',
    lastName: 'Djordjevic',
    email: 'ana.djordjevic@advokat.rs',
    role: 'paralegal',
  },
];
