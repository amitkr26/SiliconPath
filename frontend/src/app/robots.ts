import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard', '/saved', '/applications', '/messages', '/network', '/feed'],
      },
    ],
    sitemap: 'https://siliconpath.vercel.app/sitemap.xml',
  }
}
