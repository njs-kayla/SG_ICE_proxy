'use client';

interface GetEntriesOptions {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
}

export interface MockEntry {
  row: number;
  createdAt: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  message: string;
  raffleCode: string;
  messageId: string;
  status: string;
  retry: number;
  lastSendTime: string;
  lastError: string;
}

interface MockStats {
  total: number;
  success: number;
  pending: number;
  failed: number;
  retry: number;
}

const MOCK_TOKEN = 'mock-local-token';

const initialEntries: MockEntry[] = [
  {
    row: 101,
    createdAt: '2026-10-01T14:32:00+08:00',
    name: 'James Chen',
    email: 'james.chen@abctech.com',
    company: 'ABC Tech',
    phone: '0912-001-001',
    message: 'Looking forward to the lucky draw event.',
    raffleCode: 'SBC-X7K2M9',
    messageId: 'mock-msg-101',
    status: 'Sent',
    retry: 0,
    lastSendTime: '2026-10-01T14:33:12+08:00',
    lastError: '',
  },
  {
    row: 102,
    createdAt: '2026-10-01T14:05:00+08:00',
    name: 'Linda Wu',
    email: 'linda.wu@haonao.design',
    company: 'Haonao Design',
    phone: '0912-001-002',
    message: 'Need booth information.',
    raffleCode: 'SBC-Q4T8B2',
    messageId: 'mock-msg-102',
    status: 'Sent',
    retry: 0,
    lastSendTime: '2026-10-01T14:06:18+08:00',
    lastError: '',
  },
  {
    row: 103,
    createdAt: '2026-10-01T13:47:00+08:00',
    name: 'Kevin Lin',
    email: 'kevin.lin@bigdata.tw',
    company: 'Big Data TW',
    phone: '0912-001-003',
    message: 'Please resend the event code.',
    raffleCode: 'SBC-M2N6P4',
    messageId: '',
    status: 'Failed',
    retry: 2,
    lastSendTime: '2026-10-01T13:48:03+08:00',
    lastError: 'SMTP timeout from provider',
  },
  {
    row: 104,
    createdAt: '2026-10-01T13:30:00+08:00',
    name: 'Grace Chang',
    email: 'grace.chang@gmail.com',
    company: 'Freelance',
    phone: '0912-001-004',
    message: 'Will arrive after lunch.',
    raffleCode: 'SBC-J9R3W7',
    messageId: 'mock-msg-104',
    status: 'Sent',
    retry: 0,
    lastSendTime: '2026-10-01T13:31:10+08:00',
    lastError: '',
  },
  {
    row: 105,
    createdAt: '2026-10-01T13:12:00+08:00',
    name: 'Victor Huang',
    email: 'victor.h@cloudint.com',
    company: 'Cloudint',
    phone: '0912-001-005',
    message: 'Interested in partner program.',
    raffleCode: 'SBC-F5H8K1',
    messageId: 'mock-msg-105',
    status: 'Sent',
    retry: 1,
    lastSendTime: '2026-10-01T13:14:21+08:00',
    lastError: '',
  },
  {
    row: 106,
    createdAt: '2026-10-01T12:58:00+08:00',
    name: 'Olivia Tsai',
    email: 'olivia@northwind.co',
    company: 'Northwind',
    phone: '0912-001-006',
    message: 'Will bring team members.',
    raffleCode: 'SBC-N8D2Q5',
    messageId: '',
    status: 'Pending',
    retry: 0,
    lastSendTime: '',
    lastError: '',
  },
  {
    row: 107,
    createdAt: '2026-10-01T12:40:00+08:00',
    name: 'Ethan Kuo',
    email: 'ethan.kuo@matrixlab.ai',
    company: 'MatrixLab AI',
    phone: '0912-001-007',
    message: 'Interested in speaking slots.',
    raffleCode: 'SBC-R6P4L3',
    messageId: 'mock-msg-107',
    status: 'Sent',
    retry: 0,
    lastSendTime: '2026-10-01T12:41:22+08:00',
    lastError: '',
  },
  {
    row: 108,
    createdAt: '2026-10-01T11:55:00+08:00',
    name: 'Sophia Lee',
    email: 'sophia.lee@orbitmail.io',
    company: 'Orbit Mail',
    phone: '0912-001-008',
    message: 'Need invoice details.',
    raffleCode: 'SBC-T3Z7Y1',
    messageId: 'mock-msg-108',
    status: 'Sent',
    retry: 0,
    lastSendTime: '2026-10-01T11:56:34+08:00',
    lastError: '',
  },
  {
    row: 109,
    createdAt: '2026-09-30T16:21:00+08:00',
    name: 'Daniel Yeh',
    email: 'daniel.yeh@everpeak.com',
    company: 'Everpeak',
    phone: '0912-001-009',
    message: 'Follow up on sponsorship.',
    raffleCode: 'SBC-C4V6N8',
    messageId: 'mock-msg-109',
    status: 'Sent',
    retry: 0,
    lastSendTime: '2026-09-30T16:22:42+08:00',
    lastError: '',
  },
  {
    row: 110,
    createdAt: '2026-09-30T15:44:00+08:00',
    name: 'Mia Hsu',
    email: 'mia.hsu@uxstudio.tw',
    company: 'UX Studio',
    phone: '0912-001-010',
    message: 'Would like parking information.',
    raffleCode: 'SBC-U2M5A9',
    messageId: 'mock-msg-110',
    status: 'Sent',
    retry: 1,
    lastSendTime: '2026-09-30T15:45:28+08:00',
    lastError: '',
  },
  {
    row: 111,
    createdAt: '2026-09-30T15:10:00+08:00',
    name: 'Leo Wang',
    email: 'leo.wang@finverse.io',
    company: 'Finverse',
    phone: '0912-001-011',
    message: 'Need NDA before meeting.',
    raffleCode: 'SBC-B8L1E4',
    messageId: '',
    status: 'Failed',
    retry: 1,
    lastSendTime: '2026-09-30T15:11:31+08:00',
    lastError: 'Mailbox unavailable',
  },
  {
    row: 112,
    createdAt: '2026-09-30T14:36:00+08:00',
    name: 'Chloe Kao',
    email: 'chloe.kao@nextgrid.com',
    company: 'NextGrid',
    phone: '0912-001-012',
    message: 'Can join the networking session.',
    raffleCode: 'SBC-W5Q8S2',
    messageId: 'mock-msg-112',
    status: 'Sent',
    retry: 0,
    lastSendTime: '2026-09-30T14:37:48+08:00',
    lastError: '',
  },
  {
    row: 113,
    createdAt: '2026-09-30T13:50:00+08:00',
    name: 'Noah Peng',
    email: 'noah.peng@seedhub.tw',
    company: 'SeedHub',
    phone: '0912-001-013',
    message: 'Requesting interpreter support.',
    raffleCode: 'SBC-H6J4P2',
    messageId: '',
    status: 'Pending',
    retry: 0,
    lastSendTime: '',
    lastError: '',
  },
  {
    row: 114,
    createdAt: '2026-09-30T13:14:00+08:00',
    name: 'Ava Lin',
    email: 'ava.lin@buildcore.io',
    company: 'BuildCore',
    phone: '0912-001-014',
    message: 'Will attend with CTO.',
    raffleCode: 'SBC-K7D9F5',
    messageId: 'mock-msg-114',
    status: 'Sent',
    retry: 0,
    lastSendTime: '2026-09-30T13:15:17+08:00',
    lastError: '',
  },
  {
    row: 115,
    createdAt: '2026-09-29T16:48:00+08:00',
    name: 'Ryan Su',
    email: 'ryan.su@alphaforge.ai',
    company: 'AlphaForge AI',
    phone: '0912-001-015',
    message: 'Requesting onsite interview.',
    raffleCode: 'SBC-G3M8X6',
    messageId: 'mock-msg-115',
    status: 'Sent',
    retry: 0,
    lastSendTime: '2026-09-29T16:49:56+08:00',
    lastError: '',
  },
  {
    row: 116,
    createdAt: '2026-09-29T16:04:00+08:00',
    name: 'Emily Ho',
    email: 'emily.ho@globalmesh.com',
    company: 'GlobalMesh',
    phone: '0912-001-016',
    message: 'Checking exhibitor access.',
    raffleCode: 'SBC-Y1T6R8',
    messageId: 'mock-msg-116',
    status: 'Sent',
    retry: 0,
    lastSendTime: '2026-09-29T16:05:42+08:00',
    lastError: '',
  },
  {
    row: 117,
    createdAt: '2026-09-29T15:22:00+08:00',
    name: 'Jason Lai',
    email: 'jason.lai@omniwave.net',
    company: 'OmniWave',
    phone: '0912-001-017',
    message: 'Need badge correction.',
    raffleCode: 'SBC-L9C2D7',
    messageId: '',
    status: 'Failed',
    retry: 3,
    lastSendTime: '2026-09-29T15:24:08+08:00',
    lastError: 'Recipient server rejected message',
  },
  {
    row: 118,
    createdAt: '2026-09-29T14:58:00+08:00',
    name: 'Ivy Shen',
    email: 'ivy.shen@pixelharbor.co',
    company: 'Pixel Harbor',
    phone: '0912-001-018',
    message: 'Would like product deck.',
    raffleCode: 'SBC-P4N7K3',
    messageId: 'mock-msg-118',
    status: 'Sent',
    retry: 0,
    lastSendTime: '2026-09-29T14:59:33+08:00',
    lastError: '',
  },
];

let mockEntries = initialEntries.map((entry) => ({ ...entry }));

function sortEntries(entries: MockEntry[]) {
  return [...entries].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

function filterEntries(entries: MockEntry[], options: GetEntriesOptions = {}) {
  const { keyword = '', status = '' } = options;
  const normalizedKeyword = keyword.trim().toLowerCase();

  return entries.filter((entry) => {
    if (status && entry.status !== status) {
      return false;
    }

    if (!normalizedKeyword) {
      return true;
    }

    return [entry.name, entry.email, entry.company, entry.phone, entry.message]
      .some((field) => field.toLowerCase().includes(normalizedKeyword));
  });
}

export function isMockMode() {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
    return true;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  return ['localhost', '127.0.0.1'].includes(window.location.hostname);
}

export function getMockToken() {
  return MOCK_TOKEN;
}

export function getMockEntries(options: GetEntriesOptions = {}) {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 20;
  const filteredEntries = filterEntries(sortEntries(mockEntries), options);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  return {
    ok: true,
    total: filteredEntries.length,
    page,
    pageSize,
    rows: filteredEntries.slice(startIndex, endIndex),
  };
}

export function getAllMockEntries(options: Omit<GetEntriesOptions, 'page' | 'pageSize'> = {}) {
  return filterEntries(sortEntries(mockEntries), options);
}

export function getMockStats(): MockStats {
  const entries = sortEntries(mockEntries);

  return {
    total: entries.length,
    success: entries.filter((entry) => entry.status === 'Sent').length,
    pending: entries.filter((entry) => entry.status === 'Pending').length,
    failed: entries.filter((entry) => entry.status === 'Failed').length,
    retry: entries.reduce((sum, entry) => sum + entry.retry, 0),
  };
}

export function resendMockEmail(row: number) {
  mockEntries = mockEntries.map((entry) => {
    if (entry.row !== row) {
      return entry;
    }

    return {
      ...entry,
      status: 'Sent',
      retry: entry.retry + 1,
      messageId: entry.messageId || `mock-msg-${row}`,
      lastSendTime: new Date().toISOString(),
      lastError: '',
    };
  });

  return {
    ok: true,
    messageId: `mock-msg-${row}`,
  };
}

export function exportMockCsv() {
  const headers = ['Created At', 'Name', 'Email', 'Company', 'Phone', 'Message', 'Raffle Code', 'Status', 'Retry', 'Last Error'];
  const lines = sortEntries(mockEntries).map((entry) => [
    entry.createdAt,
    entry.name,
    entry.email,
    entry.company,
    entry.phone,
    entry.message,
    entry.raffleCode,
    entry.status,
    String(entry.retry),
    entry.lastError,
  ]);

  return [headers, ...lines]
    .map((columns) => columns.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}