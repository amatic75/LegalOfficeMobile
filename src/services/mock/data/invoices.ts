import type { Invoice } from '../../types';

// inv1: cs1, Nikola Stankovic (c1), hourly, sent
// Line items: te1 (2.5h), te2 (1h) time + exp1 (15000), exp2 (3500) expenses
const inv1Subtotal = 2.5 * 15000 + 1 * 15000 + 15000 + 3500; // 37500 + 15000 + 15000 + 3500 = 71000
const inv1Tax = inv1Subtotal * 0.2; // 14200
const inv1Total = inv1Subtotal + inv1Tax; // 85200

// inv2: cs2, Branko Ilic (c4), tariff, paid
const inv2Subtotal = 150000 + 2000; // tariff + exp4 copying
const inv2Tax = inv2Subtotal * 0.2; // 30400
const inv2Total = inv2Subtotal + inv2Tax; // 182400

// inv3: cs3, Milica Popovic (c2), flat-fee, draft
const inv3Subtotal = 200000; // flat fee, no expenses for cs3
const inv3Tax = inv3Subtotal * 0.2; // 40000
const inv3Total = inv3Subtotal + inv3Tax; // 240000

// inv4: cs1, Nikola Stankovic (c1), hourly, partially-paid
// Line items: exp3 (45000) expert witness
const inv4Subtotal = 45000;
const inv4Tax = inv4Subtotal * 0.2; // 9000
const inv4Total = inv4Subtotal + inv4Tax; // 54000

export const mockInvoices: Invoice[] = [
  {
    id: 'inv1',
    invoiceNumber: 'INV-2025-001',
    caseId: 'cs1',
    caseName: 'Naknada stete - saobracajna nezgoda',
    clientId: 'c1',
    clientName: 'Nikola Stankovic',
    billingMode: 'hourly',
    status: 'sent',
    hourlyRate: 15000,
    lineItems: [
      {
        id: 'li1',
        type: 'time-entry',
        referenceId: 'te1',
        description: 'Priprema tuzbe za naknadu stete',
        quantity: 2.5,
        unitPrice: 15000,
        amount: 37500,
      },
      {
        id: 'li2',
        type: 'time-entry',
        referenceId: 'te2',
        description: 'Konsultacije sa klijentom telefonom',
        quantity: 1,
        unitPrice: 15000,
        amount: 15000,
      },
      {
        id: 'li3',
        type: 'expense',
        referenceId: 'exp1',
        description: 'Sudska taksa za podnosenje tuzbe',
        amount: 15000,
      },
      {
        id: 'li4',
        type: 'expense',
        referenceId: 'exp2',
        description: 'Putni troskovi - odlazak u sud u Beogradu',
        amount: 3500,
      },
    ],
    subtotal: inv1Subtotal,
    tax: inv1Tax,
    total: inv1Total,
    paidAmount: 30000,
    payments: [
      {
        id: 'pay1',
        invoiceId: 'inv1',
        amount: 30000,
        date: '2025-03-15',
        method: 'bank-transfer',
        note: 'Avansna uplata',
        createdAt: '2025-03-15T10:00:00Z',
      },
    ],
    notes: 'Faktura za pravne usluge u predmetu naknade stete.',
    issuedDate: '2025-03-12',
    dueDate: '2025-04-11',
    createdAt: '2025-03-12T08:00:00Z',
  },
  {
    id: 'inv2',
    invoiceNumber: 'INV-2025-002',
    caseId: 'cs2',
    caseName: 'Krivicna prijava za prevaru',
    clientId: 'c4',
    clientName: 'Branko Ilic',
    billingMode: 'tariff',
    status: 'paid',
    tariffAmount: 150000,
    lineItems: [
      {
        id: 'li5',
        type: 'time-entry',
        referenceId: 'tariff',
        description: 'Tarifni obracun - zastupanje u krivicnom postupku',
        amount: 150000,
      },
      {
        id: 'li6',
        type: 'expense',
        referenceId: 'exp4',
        description: 'Kopiranje i overa dokumentacije',
        amount: 2000,
      },
    ],
    subtotal: inv2Subtotal,
    tax: inv2Tax,
    total: inv2Total,
    paidAmount: inv2Total,
    payments: [
      {
        id: 'pay2',
        invoiceId: 'inv2',
        amount: inv2Total,
        date: '2025-02-28',
        method: 'cash',
        note: 'Placeno u celosti',
        createdAt: '2025-02-28T14:00:00Z',
      },
    ],
    issuedDate: '2025-02-15',
    dueDate: '2025-03-17',
    createdAt: '2025-02-15T09:00:00Z',
  },
  {
    id: 'inv3',
    invoiceNumber: 'INV-2025-003',
    caseId: 'cs3',
    caseName: 'Razvod braka Popovic',
    clientId: 'c2',
    clientName: 'Milica Popovic',
    billingMode: 'flat-fee',
    status: 'draft',
    flatFeeAmount: 200000,
    lineItems: [
      {
        id: 'li7',
        type: 'time-entry',
        referenceId: 'flat-fee',
        description: 'Pausalni iznos - sporazumni razvod braka',
        amount: 200000,
      },
    ],
    subtotal: inv3Subtotal,
    tax: inv3Tax,
    total: inv3Total,
    paidAmount: 0,
    payments: [],
    notes: 'Pausalni obracun za kompletno zastupanje u postupku razvoda braka.',
    issuedDate: '2025-03-10',
    dueDate: '2025-04-09',
    createdAt: '2025-03-10T11:00:00Z',
  },
  {
    id: 'inv4',
    invoiceNumber: 'INV-2025-004',
    caseId: 'cs1',
    caseName: 'Naknada stete - saobracajna nezgoda',
    clientId: 'c1',
    clientName: 'Nikola Stankovic',
    billingMode: 'hourly',
    status: 'partially-paid',
    hourlyRate: 15000,
    lineItems: [
      {
        id: 'li8',
        type: 'expense',
        referenceId: 'exp3',
        description: 'Honorar sudskog vestaka za procenu stete',
        amount: 45000,
      },
    ],
    subtotal: inv4Subtotal,
    tax: inv4Tax,
    total: inv4Total,
    paidAmount: 20000,
    payments: [
      {
        id: 'pay3',
        invoiceId: 'inv4',
        amount: 20000,
        date: '2025-03-20',
        method: 'card',
        note: 'Delimicna uplata',
        createdAt: '2025-03-20T16:00:00Z',
      },
    ],
    issuedDate: '2025-03-18',
    dueDate: '2025-04-17',
    createdAt: '2025-03-18T09:00:00Z',
  },
];
