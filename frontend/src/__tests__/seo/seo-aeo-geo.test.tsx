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
import { metadata as opportunitiesMetadata } from '@/app/opportunities/page';

// Mock Supabase admin for sitemap execution. The programmatic quality gate
// requires >= 3 active verified, currently-available opportunities per category
// AND per city for category/location URLs to be emitted, so the mock supplies a
// full grid (3 rows per category + 3 rows per city, all available).
function gateRow(slug: string, category: string, location: string) {
  return {
    slug,
    created_at: '2026-03-01T00:00:00Z',
    category,
    location,
    deadline: '2027-01-01',
    verification_status: 'verified',
    is_active: true,
    posted_date: '2026-03-01',
    last_link_checked: '2026-09-01T00:00:00Z',
  };
}

const OPPORTUNITY_ROWS = [
  // 3 rows per category so every category page passes the gate.
  gateRow('drdo-jrf-vlsi-2026', 'jrf', 'bengaluru'),
  gateRow('csir-jrf-electronics-2026', 'jrf', 'hyderabad'),
  gateRow('iit-jrf-mems-2026', 'jrf', 'pune'),
  gateRow('isro-srf-signal-2026', 'srf', 'chennai'),
  gateRow('drdo-srf-antenna-2026', 'srf', 'ahmedabad'),
  gateRow('ncl-srf-nascent-2026', 'srf', 'noida'),
  gateRow('iisc-phd-vlsi-2026', 'phd', 'bengaluru'),
  gateRow('iit-phd-electronics-2026', 'phd', 'bengaluru'),
  gateRow('iitb-phd-microelectronics-2026', 'phd', 'bengaluru'),
  gateRow('rac-scientist-b-2026', 'government', 'noida'),
  gateRow('isro-scientist-eng-2026', 'government', 'noida'),
  gateRow('drdo-trainee-2026', 'government', 'noida'),
  gateRow('dst-inspire-fellowship-2026', 'fellowship', 'pune'),
  gateRow('serb-project-fellow-2026', 'fellowship', 'pune'),
  gateRow('csir-ugc-net-jrf-2026', 'fellowship', 'pune'),
  gateRow('qualcomm-vlsi-engineer-2026', 'private', 'hyderabad'),
  gateRow('intel-rtl-design-2026', 'private', 'hyderabad'),
  gateRow('ti-analog-engineer-2026', 'private', 'hyderabad'),
  gateRow('singa-phd-scholarship-2026', 'international', 'ahmedabad'),
  gateRow('daad-phd-germany-2026', 'international', 'ahmedabad'),
  gateRow('mext-japan-research-2026', 'international', 'ahmedabad'),
  // 3 rows per city so every location hub passes the gate.
  gateRow('bengaluru-chip-design-2026', 'private', 'bengaluru'),
  gateRow('bengaluru-verification-2026', 'job', 'bengaluru'),
  gateRow('bengaluru-physical-design-2026', 'private', 'bengaluru'),
  gateRow('hyderabad-embedded-2026', 'private', 'hyderabad'),
  gateRow('hyderabad-dft-2026', 'private', 'hyderabad'),
  gateRow('hyderabad-soc-design-2026', 'private', 'hyderabad'),
  gateRow('noida-scientist-c-2026', 'government', 'noida'),
  gateRow('noida-electronics-officer-2026', 'government', 'noida'),
  gateRow('noida-laser-engineer-2026', 'private', 'noida'),
  gateRow('pune-power-electronics-2026', 'private', 'pune'),
  gateRow('pune-fpga-engineer-2026', 'private', 'pune'),
  gateRow('pune-radio-frequency-2026', 'private', 'pune'),
  gateRow('chennai-embedded-systems-2026', 'private', 'chennai'),
  gateRow('chennai-medical-electronics-2026', 'private', 'chennai'),
  gateRow('chennai-semiconductor-fab-2026', 'job', 'chennai'),
  gateRow('ahmedabad-solar-electronics-2026', 'private', 'ahmedabad'),
  gateRow('ahmedabad-smart-meter-2026', 'private', 'ahmedabad'),
  gateRow('ahmedabad-control-electronics-2026', 'industry', 'ahmedabad'),
];

jest.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: jest.fn((table: string) => {
      if (table === 'opportunities') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          // loadProgrammaticCounts chain ends with .limit(3000)
          limit: jest.fn().mockResolvedValue({ data: OPPORTUNITY_ROWS }),
          // sitemap detail chain ends with .or(buildAvailabilityDbFilter(...))
          or: jest.fn().mockResolvedValue({ data: OPPORTUNITY_ROWS }),
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
    const rulesList = (Array.isArray(robotsConfig.rules) ? robotsConfig.rules : [robotsConfig.rules]) as any[];

    it('allows general crawling of public pages', () => {
      const generalRule = rulesList.find((r: any) => r?.userAgent === '*');
      expect(generalRule).toBeDefined();
      expect(generalRule?.allow).toBe('/');
    });

    it('disallows all private, authenticated, internal, and parameter search paths', () => {
      const generalRule = rulesList.find((r: any) => r?.userAgent === '*');
      const disallowed = (generalRule?.disallow || []) as string[];
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

    it('differentiates between employment JobPosting and academic EducationalOccupationalProgram schema', () => {
      function resolveSchemaType(opp: { title: string; category?: string }) {
        const isAcademicAdmissionOrScholarship =
          opp.category?.toLowerCase() === 'phd' ||
          /\b(phd admission|admissions|scholarship|fellowship program|degree program)\b/i.test(opp.title);
        return isAcademicAdmissionOrScholarship ? 'EducationalOccupationalProgram' : 'JobPosting';
      }

      // Verified jobs and research fellowships should be JobPosting
      expect(resolveSchemaType({ title: 'Staff Engineer, RISC-V', category: 'industry' })).toBe('JobPosting');
      expect(resolveSchemaType({ title: 'Junior Research Fellow (JRF) - VLSI', category: 'jrf' })).toBe('JobPosting');
      expect(resolveSchemaType({ title: 'Scientist B Electronics', category: 'government' })).toBe('JobPosting');

      // Academic admissions and degree programs must NOT be labeled as JobPosting
      expect(resolveSchemaType({ title: 'PhD Admissions Results 2026–2027', category: 'phd' })).toBe('EducationalOccupationalProgram');
      expect(resolveSchemaType({ title: 'IIT Bombay PhD Admissions - Microelectronics', category: 'fellowship' })).toBe('EducationalOccupationalProgram');
      expect(resolveSchemaType({ title: 'M.Tech Postgraduate Scholarship', category: 'scholarship' })).toBe('EducationalOccupationalProgram');
    });
  });

  describe('7. Opportunities Search Intent Metadata', () => {
    it('opportunities feed title and description match semiconductor and JRF user intent', () => {
      expect(opportunitiesMetadata.title).toContain('Semiconductor Jobs, JRF Positions & VLSI Opportunities');
      expect(opportunitiesMetadata.alternates?.canonical).toBe('https://berojgardegreewala.vercel.app/opportunities');
      expect(opportunitiesMetadata.description).toContain('semiconductor engineering jobs, JRF and SRF fellowships');
    });
  });
});
