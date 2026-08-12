/**
 * @jest-environment node
 */
jest.mock('next/server', () => {
  class MockNextRequest {
    url: string;
    method: string;
    headers: { get: (name: string) => string | null };
    private _body: any;
    constructor(url: string, init?: any) {
      this.url = url;
      this.method = init?.method || 'GET';
      const headerMap: Record<string, string> = {};
      if (init?.headers) {
        for (const [k, v] of Object.entries(init.headers)) {
          headerMap[k.toLowerCase()] = String(v ?? '');
        }
      }
      this.headers = { get: (name: string) => headerMap[name.toLowerCase()] ?? null };
      this._body = init?.body ? JSON.parse(init.body) : null;
    }
    async json() { return this._body; }
  }
  return {
    NextRequest: MockNextRequest,
    NextResponse: {
      json: (body: any, init?: any) => {
        const status = init?.status || 200;
        return { status, json: async () => body };
      },
      redirect: (url: string) => ({ status: 302, headers: new Map([['location', url]]) }),
    },
  };
});

const INSERT_RESULT = { data: [{ id: '1', title: 'Test', organization: 'Test Org' }], error: null };
const SELECT_RESULT = { data: [{ id: '1', title: 'JRF at IIT', category: 'jrf' }], error: null };

function makeChain(finalResult: typeof SELECT_RESULT) {
  const chain: any = (...args: any[]) => chain;
  chain.then = (onfulfilled: any) => Promise.resolve(finalResult).then(onfulfilled);
  chain.eq = () => chain;
  chain.neq = () => chain;
  chain.or = () => chain;
  chain.order = () => chain;
  chain.ilike = () => chain;
  chain.gte = () => chain;
  chain.lte = () => chain;
  chain.gt = () => chain;
  chain.not = () => chain;
  chain.maybeSingle = () => chain;
  chain.range = () => chain;
  chain.select = () => chain;
  chain.insert = () => chain;
  return chain;
}

jest.mock('@/lib/supabase', () => ({
  isAdminConfigured: true,
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(() => makeChain(SELECT_RESULT)),
      insert: jest.fn(() => ({
        select: jest.fn(() => Promise.resolve(INSERT_RESULT)),
      })),
    })),
  },
}));

jest.mock('@/lib/telegram-bot', () => ({
  postToTelegram: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: { id: 'test-user' } } }))
    }
  })),
}));

import { GET } from '@/app/api/opportunities/route';

describe('GET /api/opportunities', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('returns filtered opportunities', async () => {
    const { NextRequest } = require('next/server');
    const response = await GET(new NextRequest('http://localhost:3000/api/opportunities'));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.opportunities).toHaveLength(1);
    expect(body.opportunities[0].title).toBe('JRF at IIT');
  });

  it('calls supabase.from with opportunities table', async () => {
    const { NextRequest } = require('next/server');
    await GET(new NextRequest('http://localhost:3000/api/opportunities?category=jrf'));
    const { supabaseAdmin } = require('@/lib/supabase');
    expect(supabaseAdmin.from).toHaveBeenCalledWith('opportunities');
  });
});
