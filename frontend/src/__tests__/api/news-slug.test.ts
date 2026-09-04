/**
 * @jest-environment node
 */
// Regression test for the news slug detail API: the live news_articles table
// lacked a slug column (added via migration 20260812000001_news_slug_column.sql),
// so every slug lookup 404'd. Pins: 200 + real article on match, 404 when the
// row is missing, lookup hits news_articles filtered by slug.
jest.mock('next/server', () => {
  class MockNextRequest {
    url: string;
    constructor(url: string) {
      this.url = url;
    }
  }
  return {
    NextRequest: MockNextRequest,
    NextResponse: {
      json: (body: any, init?: any) => ({
        status: init?.status || 200,
        json: async () => body,
      }),
    },
  };
});

const ARTICLES = [
  {
    id: 'nn-1',
    title: 'Blog Review: July 15',
    slug: 'blog-review-july-15',
    source_name: 'Semiconductor Engineering',
    summary: 'PCIe ATS verification.',
    published_at: '2026-07-15T07:01:04+00:00',
  },
];

function makeChain(result: any) {
  const chain: any = (...args: any[]) => chain;
  chain.then = (onfulfilled: any) => Promise.resolve(result).then(onfulfilled);
  chain.eq = jest.fn(() => chain);
  chain.order = () => chain;
  chain.select = () => chain;
  chain.single = () => chain;
  return chain;
}

jest.mock('@/lib/supabase', () => ({
  isAdminConfigured: true,
}));
jest.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(() => makeChain({ data: ARTICLES[0], error: null })),
    })),
  },
  isAdminConfigured: true,
}));

jest.mock('@berojgardegreewala/api', () => ({
  serverError: (msg: string) => ({ error: msg }),
}));

import { GET } from '@/app/api/news/[slug]/route';

describe('GET /api/news/[slug]', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('returns the article for an existing slug', async () => {
    const { NextRequest } = require('next/server');
    const response = await GET(
      new NextRequest('http://localhost:3000/api/news/blog-review-july-15'),
      { params: Promise.resolve({ slug: 'blog-review-july-15' }) }
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.article.title).toBe('Blog Review: July 15');
  });

  it('queries news_articles filtered by slug', async () => {
    const { NextRequest } = require('next/server');
    const { supabaseAdmin } = require('@/lib/supabase-admin');
    await GET(
      new NextRequest('http://localhost:3000/api/news/blog-review-july-15'),
      { params: Promise.resolve({ slug: 'blog-review-july-15' }) }
    );
    expect(supabaseAdmin.from).toHaveBeenCalledWith('news_articles');
    const selectMock = supabaseAdmin.from.mock.results[0].value.select;
    const eqMock = selectMock.mock.results[0].value.eq;
    expect(eqMock).toHaveBeenCalledWith('slug', 'blog-review-july-15');
  });

  it('returns 404 when the article does not exist', async () => {
    const { supabaseAdmin } = require('@/lib/supabase-admin');
    supabaseAdmin.from.mockReturnValueOnce({
      select: jest.fn(() => makeChain({ data: null, error: { message: 'No rows found' } })),
    });
    const { NextRequest } = require('next/server');
    const response = await GET(
      new NextRequest('http://localhost:3000/api/news/nonexistent'),
      { params: Promise.resolve({ slug: 'nonexistent' }) }
    );
    expect(response.status).toBe(404);
  });
});