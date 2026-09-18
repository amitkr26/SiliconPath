import '@testing-library/jest-dom';
import { render, fireEvent, screen } from '@testing-library/react';
import React from 'react';
import ImageWithFallback, {
  getDeterministicInitials,
  getDeterministicPalette,
} from '@/components/ui/ImageWithFallback';
import OpportunityCard from '@/components/OpportunityCard';
import { mapDbOpportunityToClient } from '@/lib/utils';
import { extractArticleImageUrl } from '@/lib/scrapers/rss-parser';
import type { Opportunity } from '@/types';
import fs from 'fs';
import path from 'path';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/opportunities',
}));

// Mock useUser hook
jest.mock('@/hooks/useUser', () => ({
  useUser: () => ({
    user: null,
    loading: false,
    isEmployer: false,
    isAdmin: false,
  }),
}));

// Mock next/image for testing environment
jest.mock('next/image', () => {
  return function MockNextImage(props: any) {
    const { src, alt, width, height, className, onError, unoptimized, priority, ...rest } = props;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        onError={onError}
        data-unoptimized={unoptimized ? 'true' : undefined}
        {...rest}
      />
    );
  };
});

describe('Production Image & Media System Test Suite', () => {
  // IMAGE-01: Organization with valid logo renders logo
  it('IMAGE-01: Organization with valid logo renders logo image with proper alt text', () => {
    const { container } = render(
      <ImageWithFallback
        src="https://example.com/isro-logo.png"
        alt="Indian Space Research Organisation logo"
        name="ISRO"
        variant="monogram"
        size={48}
      />
    );

    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/isro-logo.png');
    expect(img).toHaveAttribute('alt', 'Indian Space Research Organisation logo');
  });

  // IMAGE-02: Organization without logo renders deterministic monogram
  it('IMAGE-02: Organization without logo renders deterministic monogram', () => {
    const { container } = render(
      <ImageWithFallback
        src={null}
        alt="ISRO logo"
        name="Indian Space Research Organisation"
        variant="monogram"
        size={48}
      />
    );

    expect(container.querySelector('img')).toBeNull();
    const initials = getDeterministicInitials('Indian Space Research Organisation');
    expect(initials).toBe('IS');
    expect(screen.getByText('IS')).toBeInTheDocument();

    // Check deterministic palette
    const palette = getDeterministicPalette('Indian Space Research Organisation');
    const monogramContainer = container.firstChild as HTMLElement;
    expect(monogramContainer).toHaveClass(palette.bg);
    expect(monogramContainer).toHaveClass(palette.text);
  });

  // IMAGE-03: Broken image falls back correctly
  it('IMAGE-03: Broken image falls back gracefully to deterministic monogram without unhandled errors', () => {
    const { container } = render(
      <ImageWithFallback
        src="https://example.com/broken-logo.png"
        alt="Texas Instruments logo"
        name="Texas Instruments"
        variant="monogram"
        size={48}
      />
    );

    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();

    // Trigger image loading failure
    fireEvent.error(img!);

    // After failure, img element is replaced with deterministic monogram
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('TI')).toBeInTheDocument();
  });

  // IMAGE-04: Opportunity without logo remains visually correct
  it('IMAGE-04: OpportunityCard without logo renders deterministic organization monogram correctly', () => {
    const mockOpportunity: Opportunity = {
      id: 'opp-test-123',
      title: 'Digital IC Design Engineer',
      organization: 'Defence Research and Development Organisation',
      org_slug: 'drdo',
      organization_logo_url: null,
      location: 'Hyderabad, India',
      category: 'Govt Job',
      experience_required: '0-2 years',
      stipend: '₹54,000/month',
      deadline: '2026-10-30T00:00:00Z',
      posted_at: '2026-09-01T00:00:00Z',
      source_url: 'https://drdo.gov.in/careers',
      apply_link: 'https://drdo.gov.in/apply',
      description: 'VLSI research scientist position at DRDO.',
      verification_status: 'verified',
      is_active: true,
      tags: ['VLSI', 'Digital Design'],
      eligibility: 'B.Tech / M.Tech in ECE',
    };

    const { container } = render(<OpportunityCard opportunity={mockOpportunity} />);

    expect(screen.getByText('Digital IC Design Engineer')).toBeInTheDocument();
    expect(screen.getByText('DR')).toBeInTheDocument();
    // No broken image element
    expect(container.querySelector('img')).toBeNull();
  });

  // IMAGE-05: News without image renders editorial fallback
  it('IMAGE-05: News without image renders structured editorial fallback with source and category', () => {
    const { container } = render(
      <ImageWithFallback
        src={null}
        alt="Semiconductor Packaging Roadmap"
        name="EE Times India"
        variant="editorial"
        editorialMeta={{
          sourceName: "EE Times India",
          category: "Semiconductors",
          date: "12 Sep 2026",
        }}
      />
    );

    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('EE Times India')).toBeInTheDocument();
    expect(screen.getByText('Semiconductors')).toBeInTheDocument();
    expect(screen.getByText('12 Sep 2026')).toBeInTheDocument();
  });

  // IMAGE-06: Unauthorized avatar mutation returns 401
  it('IMAGE-06: POST /api/profile/avatar enforces authentication and returns 401 on missing user', () => {
    const routePath = path.resolve(__dirname, '../../app/api/profile/avatar/route.ts');
    const routeContent = fs.readFileSync(routePath, 'utf8');

    expect(routeContent).toContain('if (!user)');
    expect(routeContent).toContain('NextResponse.json({ error: "Unauthorized" }, { status: 401 })');
  });

  // IMAGE-07: Unauthorized company logo mutation returns 401 or 403
  it('IMAGE-07: POST /api/employer/company/logo enforces authentication and authorization', () => {
    const routePath = path.resolve(__dirname, '../../app/api/employer/company/logo/route.ts');
    const routeContent = fs.readFileSync(routePath, 'utf8');

    expect(routeContent).toContain('requireEmployerRole');
    expect(routeContent).toContain('NextResponse.json({ error: "Forbidden" }, { status: 403 })');
    expect(routeContent).toContain('if (!isCreator && !isClaimant)');
    expect(routeContent).toContain('status: 403');
  });

  // IMAGE-08: Logo upload does not grant verification
  it('IMAGE-08: Employer updating logo does not auto-verify company in PATCH /api/employer/company', () => {
    const routePath = path.resolve(__dirname, '../../app/api/employer/company/route.ts');
    const routeContent = fs.readFileSync(routePath, 'utf8');

    expect(routeContent).toContain('const isVerified = isAdmin ? true : (existingPage?.is_verified ?? false)');
    expect(routeContent).toContain('validLogoUrl');
    expect(routeContent).not.toMatch(/is_verified:\s*true/);
  });

  // IMAGE-09: Oversized image validation
  it('IMAGE-09: Avatar and logo routes reject file uploads exceeding 2MB size limit', () => {
    const avatarRoute = fs.readFileSync(path.resolve(__dirname, '../../app/api/profile/avatar/route.ts'), 'utf8');
    const logoRoute = fs.readFileSync(path.resolve(__dirname, '../../app/api/employer/company/logo/route.ts'), 'utf8');

    expect(avatarRoute).toContain('file.size > 2 * 1024 * 1024');
    expect(avatarRoute).toContain('Image size must be less than 2MB');
    expect(logoRoute).toContain('file.size > 2 * 1024 * 1024');
    expect(logoRoute).toContain('Logo image must be less than 2MB');
  });

  // IMAGE-10: Unsupported MIME type & magic byte inspection
  it('IMAGE-10: Avatar and company logo routes enforce magic byte checks and reject dangerous files', () => {
    const avatarRoute = fs.readFileSync(path.resolve(__dirname, '../../app/api/profile/avatar/route.ts'), 'utf8');
    const logoRoute = fs.readFileSync(path.resolve(__dirname, '../../app/api/employer/company/logo/route.ts'), 'utf8');

    // Both routes must check for PNG, JPG, WebP magic bytes and reject SVG/HTML/binaries
    expect(avatarRoute).toContain('buffer[0] === 0x89 && buffer[1] === 0x50');
    expect(avatarRoute).toContain('buffer[0] === 0xff && buffer[1] === 0xd8');
    expect(avatarRoute).toContain('RIFF');
    expect(logoRoute).toContain('buffer[0] === 0x89 && buffer[1] === 0x50');
    expect(logoRoute).toContain('buffer[0] === 0xff && buffer[1] === 0xd8');
    expect(logoRoute).toContain('RIFF');
  });

  // IMAGE-11: Malicious URL schemes rejected in avatar updates
  it('IMAGE-11: Avatar route rejects javascript:, data:, and invalid schemes', () => {
    const routePath = path.resolve(__dirname, '../../app/api/profile/avatar/route.ts');
    const routeContent = fs.readFileSync(routePath, 'utf8');

    expect(routeContent).toContain('["http:", "https:"].includes(parsed.protocol)');
    expect(routeContent).toContain('Avatar URL must use http or https protocol');
  });

  // IMAGE-12: OpenGraph branding is BerojgarDegreeWala
  it('IMAGE-12: OpenGraph generators use BerojgarDegreeWala branding without SiliconPath traces', () => {
    const defaultOg = fs.readFileSync(path.resolve(__dirname, '../../app/api/og/route.tsx'), 'utf8');
    const oppOg = fs.readFileSync(path.resolve(__dirname, '../../app/api/og/opportunity/[slug]/route.tsx'), 'utf8');

    expect(defaultOg).toContain('Berojgar');
    expect(defaultOg).toContain('DegreeWala');
    expect(defaultOg).not.toContain('SiliconPath');

    expect(oppOg).toContain('Berojgar');
    expect(oppOg).toContain('DegreeWala');
    expect(oppOg).not.toContain('SiliconPath');
  });

  // IMAGE-13: No arbitrary remote image host wildcard allowed
  it('IMAGE-13: next.config.mjs does NOT allow arbitrary wildcard remote hosts (**)', () => {
    const nextConfig = fs.readFileSync(path.resolve(__dirname, '../../../next.config.mjs'), 'utf8');

    expect(nextConfig).not.toContain('hostname: "**"');
    expect(nextConfig).toContain('supabase.co');
    expect(nextConfig).toContain('avatars.githubusercontent.com');
  });

  // IMAGE-14: Deterministic monogram consistency across renders
  it('IMAGE-14: getDeterministicInitials and getDeterministicPalette produce stable outputs', () => {
    const org = 'Indian Institute of Science';
    const initials1 = getDeterministicInitials(org);
    const initials2 = getDeterministicInitials(org);
    expect(initials1).toBe(initials2);
    expect(initials1).toBe('II');

    const pal1 = getDeterministicPalette(org);
    const pal2 = getDeterministicPalette(org);
    expect(pal1.bg).toBe(pal2.bg);
    expect(pal1.text).toBe(pal2.text);

    // Single-word organization
    expect(getDeterministicInitials('NVIDIA')).toBe('NV');
    expect(getDeterministicInitials('Intel')).toBe('IN');
    expect(getDeterministicInitials('A')).toBe('A');
    expect(getDeterministicInitials('')).toBe('?');
  });

  // IMAGE-15: Backwards-compatible API mapping
  it('IMAGE-15: mapDbOpportunityToClient provides backwards-compatible organization_logo_url', () => {
    const dbRowWithoutLogo = {
      id: 'opp-1',
      title: 'VLSI Engineer',
      organization: 'Qualcomm',
      location: 'Bengaluru',
      category: 'Core Engineering',
      created_at: '2026-09-01T00:00:00Z',
    };

    const mapped1 = mapDbOpportunityToClient(dbRowWithoutLogo);
    expect(mapped1.organization_logo_url).toBeNull();

    const dbRowWithLogo = {
      id: 'opp-2',
      title: 'ASIC Architect',
      organization: 'Synopsys',
      organizations: {
        name: 'Synopsys',
        logo_url: 'https://example.com/synopsys.png',
      },
    };

    const mapped2 = mapDbOpportunityToClient(dbRowWithLogo);
    expect(mapped2.organization_logo_url).toBe('https://example.com/synopsys.png');
  });

  // IMAGE-16: Remote image allowlist and CSP include api.dicebear.com
  it('IMAGE-16: next.config.mjs and middleware.ts include api.dicebear.com for avatar presets', () => {
    const nextConfig = fs.readFileSync(path.resolve(__dirname, '../../../next.config.mjs'), 'utf8');
    const middleware = fs.readFileSync(path.resolve(__dirname, '../../middleware.ts'), 'utf8');

    expect(nextConfig).toContain('api.dicebear.com');
    expect(middleware).toContain('https://api.dicebear.com');
  });

  // IMAGE-17: Avatar fallback type renders deterministic monogram
  it('IMAGE-17: ImageWithFallback with fallbackType="avatar" renders initial monogram when src is null', () => {
    const { container } = render(
      <ImageWithFallback
        src={null}
        alt="Ajeet Kumar avatar"
        fallbackType="avatar"
        fallbackName="Ajeet Kumar"
      />
    );

    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('AK')).toBeInTheDocument();
  });

  // IMAGE-18: Zero raw img tags in frontend application pages/components
  it('IMAGE-18: Zero raw <img> elements in frontend/src outside of tests', () => {
    const srcDir = path.resolve(__dirname, '../..');
    const filesToScan: string[] = [];

    function findFiles(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== '__tests__' && entry.name !== 'node_modules' && entry.name !== '.next') {
            findFiles(fullPath);
          }
        } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx'))) {
          filesToScan.push(fullPath);
        }
      }
    }

    findFiles(srcDir);

    const violations: { file: string; line: number }[] = [];
    const rawImgRegex = /<img\s/g;

    for (const file of filesToScan) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (rawImgRegex.test(line)) {
          violations.push({ file: path.relative(srcDir, file), line: idx + 1 });
        }
      });
    }

    expect(violations).toEqual([]);
  });

  // IMAGE-19: RSS media extraction handles enclosures, media:content, media:thumbnail, and content:encoded
  it('IMAGE-19: extractArticleImageUrl extracts valid image URLs across diverse RSS media formats', () => {
    // 1. Standard RSS Enclosure
    expect(extractArticleImageUrl({ enclosure: { url: 'https://example.com/photo.jpg' } })).toBe('https://example.com/photo.jpg');

    // 2. Media content array (e.g. IEEE Spectrum)
    expect(extractArticleImageUrl({
      mediaContent: [{ $: { url: 'https://spectrum.ieee.org/sample.jpg', medium: 'image' } }]
    })).toBe('https://spectrum.ieee.org/sample.jpg');

    // 3. Media content object
    expect(extractArticleImageUrl({
      'media:content': { $: { url: 'https://example.com/media.png' } }
    })).toBe('https://example.com/media.png');

    // 4. Media thumbnail (e.g. EE Times)
    expect(extractArticleImageUrl({
      mediaThumbnail: { $: { url: 'https://eetimes.com/thumb.webp' } }
    })).toBe('https://eetimes.com/thumb.webp');

    // 5. Embedded HTML img tag in content:encoded (e.g. Power Electronics News)
    expect(extractArticleImageUrl({
      contentEncoded: '<p>Breaking news in GaN devices</p><img src="https://powerelectronicsnews.com/gan-hero.jpg" alt="hero" />'
    })).toBe('https://powerelectronicsnews.com/gan-hero.jpg');

    // 6. Non-http/https schemes rejected
    expect(extractArticleImageUrl({ enclosure: { url: 'javascript:alert(1)' } })).toBeNull();
    expect(extractArticleImageUrl({ enclosure: { url: 'data:image/png;base64,123' } })).toBeNull();
    expect(extractArticleImageUrl(null)).toBeNull();
  });

  // IMAGE-20: Organization logo backfill script and Supabase CDN URL schema
  it('IMAGE-20: Organization logo backfill script defines verified logos and Supabase CDN paths', () => {
    const scriptPath = path.resolve(__dirname, '../../../../scripts/backfill-org-logos.mjs');
    expect(fs.existsSync(scriptPath)).toBe(true);
    const content = fs.readFileSync(scriptPath, 'utf8');

    // Enforces verified organization dictionary
    expect(content).toContain('organization-logos');
    expect(content).toContain('"isro"');
    expect(content).toContain('"drdo"');
    expect(content).toContain('"intel"');
    expect(content).toContain('"amd"');
    expect(content).toContain('"nvidia"');

    // Enforces preservation of verification status
    expect(content).toContain('.update({ logo_url: publicUrl })');
    expect(content).not.toContain('is_verified: true');
  });

  // IMAGE-21: Remote patterns and CSP allow verified news and wikimedia domains
  it('IMAGE-21: next.config.mjs and middleware.ts permit verified news and wikimedia domains', () => {
    const nextConfig = fs.readFileSync(path.resolve(__dirname, '../../../next.config.mjs'), 'utf8');
    const middleware = fs.readFileSync(path.resolve(__dirname, '../../middleware.ts'), 'utf8');

    expect(nextConfig).toContain('powerelectronicsnews.com');
    expect(nextConfig).toContain('sciencedaily.com');
    expect(nextConfig).toContain('wikimedia.org');

    expect(middleware).toContain('powerelectronicsnews.com');
    expect(middleware).toContain('sciencedaily.com');
    expect(middleware).toContain('wikimedia.org');
  });
});
