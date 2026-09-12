import { MetadataRoute } from 'next'

const BASE_URL = 'https://siliconpath.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 1 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${BASE_URL}/courses`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${BASE_URL}/engineering-lab`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${BASE_URL}/sta-interview-questions`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${BASE_URL}/learn`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${BASE_URL}/academy`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.9 },
  ]

  // Add learning path pages
  const learningPaths = [
    'digital-electronics', 'verilog-hdl', 'cmos-vlsi-design', 'fpga-design', 'embedded-systems',
    'asic-physical-design', 'sta-timing', 'dft', 'verification', 'analog-ic-design', 'custom-layout',
    'eda-tools', 'scripting-for-vlsi', 'vlsi-career-roadmap', 'interview-preparation'
  ]

  const pathPages = learningPaths.map(path => ({
    url: `${BASE_URL}/learn/${path}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...pathPages]
}
