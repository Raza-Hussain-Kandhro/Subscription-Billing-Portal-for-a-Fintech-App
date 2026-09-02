// Demo data standing in for API responses (GET /plans, GET /invoices, etc.)
// Swap these out once the corresponding endpoints in server/routes are live —
// the shapes here match the columns in database/schema.sql.

export const MOCK_PLANS = [
  {
    id: 1,
    name: 'Basic',
    price: 9,
    features: ['1 billing account', 'Monthly invoices', 'Email support', 'Basic reporting'],
  },
  {
    id: 2,
    name: 'Pro',
    price: 29,
    features: ['5 billing accounts', 'Weekly invoices', 'Priority support', 'Advanced reporting', 'Team roles'],
  },
  {
    id: 3,
    name: 'Premium',
    price: 79,
    features: [
      'Unlimited billing accounts',
      'Real-time invoices',
      '24/7 dedicated support',
      'Custom reporting',
      'Team roles & permissions',
      'API access',
    ],
  },
];

export const MOCK_INVOICES = [
  { id: 1, invoice_date: '2026-08-01', amount: 29.0, status: 'Paid' },
  { id: 2, invoice_date: '2026-07-01', amount: 29.0, status: 'Paid' },
  { id: 3, invoice_date: '2026-06-01', amount: 29.0, status: 'Paid' },
  { id: 4, invoice_date: '2026-05-01', amount: 9.0, status: 'Paid' },
  { id: 5, invoice_date: '2026-09-01', amount: 29.0, status: 'Pending' },
];

export const MOCK_CLIENT_SUBSCRIPTION = {
  planName: 'Pro',
  status: 'Active',
  nextBillingDate: '2026-10-01',
  amountDue: 29.0,
};

export const MOCK_CLIENTS = [
  { id: 1, name: 'Amina Farooq', email: 'amina@vertexpay.com', plan: 'Pro', status: 'Active' },
  { id: 2, name: 'Bilal Sheikh', email: 'bilal@northfin.io', plan: 'Basic', status: 'Active' },
  { id: 3, name: 'Carla Mendes', email: 'carla@ledgerly.co', plan: 'Premium', status: 'Active' },
  { id: 4, name: 'Daniyal Khan', email: 'daniyal@paystack.dev', plan: 'Pro', status: 'Inactive' },
  { id: 5, name: 'Elena Petrova', email: 'elena@brightbooks.com', plan: 'Basic', status: 'Inactive' },
  { id: 6, name: 'Farhan Malik', email: 'farhan@quantabank.com', plan: 'Premium', status: 'Active' },
];

export const MOCK_ADMIN_STATS = {
  totalClients: MOCK_CLIENTS.length,
  activeSubscriptions: MOCK_CLIENTS.filter((c) => c.status === 'Active').length,
  totalPlans: MOCK_PLANS.length,
};
