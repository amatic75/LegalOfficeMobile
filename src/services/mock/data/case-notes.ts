import type { CaseNote } from '../../types';

export const mockCaseNotes: CaseNote[] = [
  {
    id: 'cn1',
    caseId: 'cs1',
    type: 'text',
    content: 'Klijent dostavio novu dokumentaciju o steti. Medicinska dokumentacija potvrduje povrede zadobijene u saobracajnoj nezgodi.',
    createdAt: '2025-03-10T14:30:00Z',
  },
  {
    id: 'cn2',
    caseId: 'cs1',
    type: 'text',
    content: 'Razgovor sa vestacima - zakljucak: potrebno angazovati sudskog vestaka za procenu materijalne stete na vozilu.',
    createdAt: '2025-03-05T09:15:00Z',
  },
  {
    id: 'cn3',
    caseId: 'cs1',
    type: 'text',
    content: 'Osiguravajuce drustvo Dunav odbilo ponudu za vansudsko poravnanje. Nastaviti sa tuzbom.',
    createdAt: '2025-02-20T16:00:00Z',
  },
  {
    id: 'cn4',
    caseId: 'cs2',
    type: 'text',
    content: 'Saslusanje svedoka zakazano za sledecu nedelju. Pripremiti listu pitanja za unakrsno ispitivanje.',
    createdAt: '2025-03-08T11:00:00Z',
  },
  {
    id: 'cn5',
    caseId: 'cs3',
    type: 'text',
    content: 'Sporazum o podeli imovine potpisan od obe strane. Preostaje regulisanje starateljstva nad decom.',
    createdAt: '2025-03-01T10:00:00Z',
  },
  {
    id: 'cn6',
    caseId: 'cs3',
    type: 'text',
    content: 'Klijentkinja zeli zajednicko starateljstvo. Suprotna strana se slaze pod uslovom da deca ostanu u Novom Sadu.',
    createdAt: '2025-02-25T14:30:00Z',
  },
];
