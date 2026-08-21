import { MetadataRoute } from 'next'

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const apiUrl = 'https://admin.playbimboo.com/api';
  
  let products = [];
  try {
    const res = await fetch(`${apiUrl}/products`, { cache: 'no-store' });
    if (res.ok) {
      products = await res.json();
    }
  } catch (error) {
    console.error('Failed to fetch products for sitemap:', error);
  }

  const productUrls = products.map((product: any) => ({
    url: `https://playbimboo.com/product/${product.slug}`,
    lastModified: new Date(product.updatedAt || Date.now()),
  }));

  const staticUrls = [
    { url: 'https://playbimboo.com', lastModified: new Date() },
    { url: 'https://playbimboo.com/shop', lastModified: new Date() },
    { url: 'https://playbimboo.com/about', lastModified: new Date() },
    { url: 'https://playbimboo.com/contact', lastModified: new Date() },
  ];

  return [...staticUrls, ...productUrls];
}
