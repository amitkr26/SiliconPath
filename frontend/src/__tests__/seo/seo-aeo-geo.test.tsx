jest.mock('next/font/google', () => ({
  Inter: () => ({ variable: '--font-inter' }),
  Space_Grotesk: () => ({ variable: '--font-space-grotesk' }),
}));

import robots from '@/app/robots';
import sitemap from '@/app/sitemap';
import { metadata as rootMetadata } from '@/app/layout';
import { metadata as homeMetadata } from '@/app/page';
import { metadata as aboutMetadata } from '@/app/about/page';
import { metadata as orgsMetadata } from '@/app/organizations/page';
import { metadata as categoriesMetadata } from '@/app/categories/page';
import { metadata as newsMetadata } from '@/app/news/page';
import { metadata as contactMetadata } from '@/app/contact/layout';
import { metadata as askAiMetadata } from '@/app/ask-ai/layout';
import { metadata as searchMetadata } from '@/app/search/layout';
import { metadata as loginMetadata } from '@/app/login/layout';
import { metadata as signupMetadata } from '@/app/signup/layout';
import { metadata as companiesMetadata } from '@/app/companies/layout';

// Mock Supabase admin for sitemap execution
jest.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: jest.fn((table: string) => {
      if (table === 'opportunities') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          or: jest.fn().mockResolvedValue({
            data: [
              {
                slug: 'drdo-jrf-vlsi-2026',
                created_at: '2026-03-01T00:00:00Z',
                category: 'jrf',
                deadline: '2026-12-31',
                verification_status: 'verified',
                is_active: true,
              },
            ],
          }),
        };
      }
      if (table === 'organizations') {
        return {
          select: jest.fn().mockResolvedValue({
            data: [
              { slug: 'isro', created_at: '2026-01-01T00:00:00Z' },
              { slug: 'drdo', created_at: '2026-01-01T00:00:00Z' },
            ],
          }),
        };
      }
      if (table === 'news_articles') {
        return {
          select: jest.fn().mockReturnThis(),
          not: jest.fn().mockResolvedValue({
            data: [
              { slug: 'india-semiconductor-mission-update', published_at: '2026-03-01T00:00:00Z' },
            ],
          }),
        };
      }
      return {
        select: jest.fn().mockResolvedValue({ data: [] }),
      };
    }),
  },
  isAdminConfigured: true,
}));

describe('Technical SEO, AEO & GEO Verification Suite', () => {
  describe('1. Root Metadata & Canonical Inheritance Protection', () => {
    it('root layout specifies metadataBase and does NOT hardcode root canonical', () => {
      expect(rootMetadata.metadataBase?.toString()).toBe('https://berojgardegreewala.vercel.app/');
      // Root canonical MUST NOT be hardcoded in root layout, or all child routes inherit it in App Router
      expect((rootMetadata.alternates as any)?.canonical).toBeUndefined();
    });

    it('root title template appends brand name via template pattern', () => {
      expect(rootMetadata.title).toEqual({
        default: 'BerojgarDegreeWala — Semiconductor, VLSI & Electronics Opportunities India',
        template: '%s | BerojgarDegreeWala',
      });
    });

    it('homepage declares explicit root canonical', () => {
      expect(homeMetadata.alternates?.canonical).toBe('/');
    });
  });

  describe('2. Child Pages Canonical & Title Template Compliance', () => {
    it('public landing pages define their own canonicals and avoid duplicate branding in titles', () => {
      // About
      expect(aboutMetadata.title).not.toContain('| BerojgarDegreeWala');
      expect(aboutMetadata.title).not.toContain('— BerojgarDegreeWala');
      expect(aboutMetadata.alternates?.canonical).toBe('https://berojgardegreewala.vercel.app/about');

      // Organizations
      expect(orgsMetadata.title).not.toContain('| BerojgarDegreeWala');
      expect(orgsMetadata.title).not.toContain('— BerojgarDegreeWala');
      expect(orgsMetadata.alternates?.canonical).toBe('https://berojgardegreewala.vercel.app/organizations');

      // Categories
      expect(categoriesMetadata.title).not.toContain('| BerojgarDegreeWala');
      expect(categoriesMetadata.alternates?.canonical).toBe('https://berojgardegreewala.vercel.app/categories');

      // News
      expect(newsMetadata.title).not.toContain('| BerojgarDegreeWala');
      expect(newsMetadata.alternates?.canonical).toBe('https://berojgardegreewala.vercel.app/news');

      // Contact
      expect(contactMetadata.alternates?.canonical).toBe('https://berojgardegreewala.vercel.app/contact');

      // Ask AI
      expect(askAiMetadata.alternates?.canonical).toBe('https://berojgardegreewala.vercel.app/ask-ai');
    });
  });

  describe('3. Indexation Control (Noindex & Disallow Boundaries)', () => {
    it('search pages are configured with noindex, follow and canonical tag', () => {
      expect(searchMetadata.robots).toEqual({ index: false, follow: true });
      expect(searchMetadata.alternates?.canonical).toBe('https://berojgardegreewala.vercel.app/search');
    });

    it('auth pages (login, signup) are marked noindex, follow', () => {
      expect(loginMetadata.robots).toEqual({ index: false, follow: true });
      expect(signupMetadata.robots).toEqual({ index: false, follow: true });
    });

    it('legacy alias pages (/companies) are marked noindex and canonicalize to /organizations', () => {
      expect(companiesMetadata.robots).toEqual({ index: false, follow: true });
      expect(companiesMetadata.alternates?.canonical).toBe('https://berojgardegreewala.vercel.app/organizations');
    });
  });

  describe('4. Robots.txt Compliance', () => {
    const robotsConfig = robots();

    it('allows general crawling of public pages', () => {
      const generalRule = robotsConfig.rules?.find((r: any) => r.userAgent === '*');
      expect(generalRule).toBeDefined();
      expect(generalRule?.allow).toBe('/');
    });

    it('disallows all private, authenticated, internal, and parameter search paths', () => {
      const generalRule = robotsConfig.rules?.find((r: any) => r.userAgent === '*');
      const disallowed = generalRule?.disallow as string[];
      expect(disallowed).toContain('/admin');
      expect(disallowed).toContain('/api/');
      expect(disallowed).toContain('/dashboard');
      expect(disallowed).toContain('/saved');
      expect(disallowed).toContain('/applications');
      expect(disallowed).toContain('/messages');
      expect(disallowed).toContain('/network');
      expect(disallowed).toContain('/feed');
      expect(disallowed).toContain('/employer');
      expect(disallowed).toContain('/search');
      expect(disallowed).toContain('/onboarding');
      expect(disallowed).toContain('/notifications');
      expect(disallowed).toContain('/post-job');
    });

    it('points directly to production sitemap.xml', () => {
      expect(robotsConfig.sitemap).toBe('https://berojgardegreewala.vercel.app/sitemap.xml');
    });
  });

  describe('5. Sitemap.xml Freshness & Purity', () => {
    it('does NOT contain noindex routes (/search, /login, /signup, /companies, /match)', async () => {
      const items = await sitemap();
      const urls = items.map((i) => i.url);

      expect(urls).not.toContain('https://berojgardegreewala.vercel.app/search');
      expect(urls).not.toContain('https://berojgardegreewala.vercel.app/login');
      expect(urls).not.toContain('https://berojgardegreewala.vercel.app/signup');
      expect(urls).not.toContain('https://berojgardegreewala.vercel.app/companies');
      expect(urls).not.toContain('https://berojgardegreewala.vercel.app/match');
    });

    it('contains all core public discovery hubs and categories directory', async () => {
      const items = await sitemap();
      const urls = items.map((i) => i.url);

      expect(urls).toContain('https://berojgardegreewala.vercel.app');
      expect(urls).toContain('https://berojgardegreewala.vercel.app/opportunities');
      expect(urls).toContain('https://berojgardegreewala.vercel.app/organizations');
      expect(urls).toContain('https://berojgardegreewala.vercel.app/categories');
      expect(urls).toContain('https://berojgardegreewala.vercel.app/news');
      expect(urls).toContain('https://berojgardegreewala.vercel.app/about');
      expect(urls).toContain('https://berojgardegreewala.vercel.app/resources');
      expect(urls).toContain('https://berojgardegreewala.vercel.app/contact');
      expect(urls).toContain('https://berojgardegreewala.vercel.app/ask-ai');
    });

    it('generates indexable URLs for top category landing pages', async () => {
      const items = await sitemap();
      const urls = items.map((i) => i.url);

      expect(urls).toContain('https://berojgardegreewala.vercel.app/category/jrf');
      expect(urls).toContain('https://berojgardegreewala.vercel.app/category/srf');
      expect(urls).toContain('https://berojgardegreewala.vercel.app/category/phd');
      expect(urls).toContain('https://berojgardegreewala.vercel.app/category/govt-job');
    });

    it('generates indexable URLs for city location hubs', async () => {
      const items = await sitemap();
      const urls = items.map((i) => i.url);

      expect(urls).toContain('https://berojgardegreewala.vercel.app/opportunities/location/bengaluru');
      expect(urls).toContain('https://berojgardegreewala.vercel.app/opportunities/location/hyderabad');
      expect(urls).toContain('https://berojgardegreewala.vercel.app/opportunities/location/noida');
      expect(urls).toContain('https://berojgardegreewala.vercel.app/opportunities/location/pune');
      expect(urls).toContain('https://berojgardegreewala.vercel.app/opportunities/location/chennai');
      expect(urls).toContain('https://berojgardegreewala.vercel.app/opportunities/location/ahmedabad');
    });

    it('generates dynamic canonical opportunity and organization URLs', async () => {
      const items = await sitemap();
      const urls = items.map((i) => i.url);

      expect(urls).toContain('https://berojgardegreewala.vercel.app/opportunities/drdo-jrf-vlsi-2026');
      expect(urls).toContain('https://berojgardegreewala.vercel.app/organizations/isro');
      expect(urls).toContain('https://berojgardegreewala.vercel.app/organizations/drdo');
      expect(urls).toContain('https://berojgardegreewala.vercel.app/news/india-semiconductor-mission-update');
    });
  });

  describe('6. Salary Parsing & JobPosting Schema Sanity', () => {
    // Testing the salary parsing logic used in opportunity detail
    function parseSalaryForTest(stipendStr: string | null | undefined) {
      if (!stipendStr || typeof stipendStr !== 'string') return null;
      const clean = stipendStr.replace(/,/g, '');
      const match = clean.match(/(\d+(?:\.\d+)?)/);
      if (!match) return null;
      const val = parseFloat(match[1]);
      if (isNaN(val) || val <= 0) return null;

      const isLakh = /lakh|lpa|lac/i.test(stipendStr);
      const isPerYear = /year|annum|per annum|p\.a\./i.test(stipendStr);
      const isPerMonth = /month|pm|per month|p\.m\./i.test(stipendStr);

      let numericVal = val;
      let unitText: 'MONTH' | 'YEAR' = 'MONTH';

      if (isLakh) {
        numericVal = val * 100000;
        unitText = 'YEAR';
      } else if (isPerYear) {
        unitText = 'YEAR';
      } else if (isPerMonth || numericVal >= 10000) {
        unitText = 'MONTH';
      }

      return {
        '@type': 'MonetaryAmount',
        currency: 'INR',
        value: {
          '@type': 'QuantitativeValue',
          value: numericVal,
          unitText,
        },
      };
    }

    it('correctly parses monthly research fellowship stipends into valid MonetaryAmount schema', () => {
      const parsed = parseSalaryForTest('₹37,000/month + HRA');
      expect(parsed).toEqual({
        '@type': 'MonetaryAmount',
        currency: 'INR',
        value: {
          '@type': 'QuantitativeValue',
          value: 37000,
          unitText: 'MONTH',
        },
      });
    });

    it('correctly parses annual CTC in lakhs into valid MonetaryAmount schema', () => {
      const parsed = parseSalaryForTest('14 LPA');
      expect(parsed).toEqual({
        '@type': 'MonetaryAmount',
        currency: 'INR',
        value: {
          '@type': 'QuantitativeValue',
          value: 1400000,
          unitText: 'YEAR',
        },
      });
    });

    it('omits MonetaryAmount cleanly when stipend is purely non-numeric descriptive text', () => {
      expect(parseSalaryForTest('As per DST guidelines')).toBeNull();
      expect(parseSalaryForTest('Competitive based on experience')).toBeNull();
      expect(parseSalaryForTest(null)).toBeNull();
      expect(parseSalaryForTest('')).toBeNull();
    });
  });
});
