import { MetadataRoute } from 'next'

const BASE_URL = 'https://siliconpath.in'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 1 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${BASE_URL}/courses`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${BASE_URL}/engineering-lab`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${BASE_URL}/sta-interview-questions`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.9 },
    { url: `${BASE_URL}/learn`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${BASE_URL}/academy`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
  ]

  // Learning paths — slugs match /learn/[path] dynamic route
  const learningPaths = [
    'digital-electronics', 'verilog', 'design-verification', 'clock-domain-crossing', 'hardware-protocols',
    'synthesis', 'physical-design', 'static-timing-analysis', 'physical-verification',
    'low-power', 'design-for-test', 'tcl-for-eda', 'linux-for-vlsi', 'career-roadmap', 'interview',
  ]

  const pathPages = learningPaths.map(path => ({
    url: `${BASE_URL}/learn/${path}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...pathPages]
}
