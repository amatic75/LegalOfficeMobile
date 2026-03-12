import type { AppNotification } from '../../types';

function getDateStr(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
}

export const mockNotifications: AppNotification[] = [
  // Unread deadline reminders with urgency levels
  {
    id: 'notif1',
    type: 'deadline-reminder',
    title: 'Rok istice danas!',
    body: 'Predmet P 123/2025 - rok za uplatu sudske takse istice danas.',
    relatedCaseId: 'cs1',
    relatedEventId: 'evt16',
    isRead: false,
    urgency: 'today',
    createdAt: getDateStr(0),
  },
  {
    id: 'notif2',
    type: 'deadline-reminder',
    title: 'Rok istice sutra',
    body: 'Predmet K 45/2024 - rok za podnosenje zalbe istice sutra.',
    relatedCaseId: 'cs2',
    relatedEventId: 'evt13',
    isRead: false,
    urgency: '1d',
    createdAt: getDateStr(0),
  },
  {
    id: 'notif3',
    type: 'deadline-reminder',
    title: 'Rok za dostavu dokumentacije',
    body: 'Predmet P 345/2025 - rok za dostavu dokumentacije za 3 dana.',
    relatedCaseId: 'cs5',
    relatedEventId: 'evt14',
    isRead: false,
    urgency: '3d',
    createdAt: getDateStr(-1),
  },
  {
    id: 'notif4',
    type: 'deadline-reminder',
    title: 'Rok za odgovor na tuzbu',
    body: 'Predmet P 567/2025 - rok za odgovor na tuzbu za 7 dana.',
    relatedCaseId: 'cs9',
    relatedEventId: 'evt15',
    isRead: false,
    urgency: '7d',
    createdAt: getDateStr(-1),
  },
  // Read deadline reminders
  {
    id: 'notif5',
    type: 'deadline-reminder',
    title: 'Rok za registraciju promene',
    body: 'Predmet P 89/2025 - rok za podneti zahtev APR-u.',
    relatedCaseId: 'cs10',
    relatedEventId: 'evt17',
    isRead: true,
    urgency: '7d',
    createdAt: getDateStr(-2),
  },
  {
    id: 'notif6',
    type: 'deadline-reminder',
    title: 'Podsetnik: pripremno rociste',
    body: 'Predmet K 45/2024 - pripremno rociste za 5 dana.',
    relatedCaseId: 'cs2',
    relatedEventId: 'evt2',
    isRead: true,
    createdAt: getDateStr(-3),
  },
  {
    id: 'notif7',
    type: 'deadline-reminder',
    title: 'Rok za zalbu istekao',
    body: 'Predmet K 78/2025 - rok za podnosenje zalbe je istekao.',
    relatedCaseId: 'cs8',
    isRead: true,
    urgency: 'today',
    createdAt: getDateStr(-5),
  },
  // Case update notifications
  {
    id: 'notif8',
    type: 'case-update',
    title: 'Promena statusa predmeta',
    body: 'Predmet P 123/2025 je promenio status u "Aktivan".',
    relatedCaseId: 'cs1',
    isRead: false,
    createdAt: getDateStr(-1),
  },
  {
    id: 'notif9',
    type: 'case-update',
    title: 'Novi dokument dodat',
    body: 'Dodat je novi dokument u predmet P 345/2025.',
    relatedCaseId: 'cs5',
    isRead: true,
    createdAt: getDateStr(-4),
  },
  {
    id: 'notif10',
    type: 'case-update',
    title: 'Klijent azuriran',
    body: 'Kontakt informacije klijenta Stankovic su azurirane.',
    relatedCaseId: 'cs1',
    isRead: false,
    createdAt: getDateStr(-2),
  },
  {
    id: 'notif11',
    type: 'case-update',
    title: 'Zakazano novo rociste',
    body: 'Zakazano je novo rociste za predmet P2 67/2025 - Popovic.',
    relatedCaseId: 'cs3',
    isRead: true,
    createdAt: getDateStr(-6),
  },
];
