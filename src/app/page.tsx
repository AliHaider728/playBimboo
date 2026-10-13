import React from 'react';
import { HomePage } from './HomePage';
import { INITIAL_SETTINGS, INITIAL_CATEGORIES } from '../data/mockData';

export const metadata = {
  title: 'Play Bimboo - Magical Toys, Games & Playland',
  description: 'Discover endless play with Play Bimboo! Shop action figures, educational toys, board games, plush soft toys, and outdoor play.',
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://admin.playbimboo.com/api';

async function fetchData() {
  // Using next: { revalidate: 60 } to cache the homepage for 60 seconds.
  // This ensures fast loads for users while keeping products fresh shortly after admin updates.
  const fetchOpts: RequestInit & { next?: { revalidate: number } } = {
    next: { revalidate: 60 },
    signal: AbortSignal.timeout(4000)
  };
  
  try {
    const [productsRes, categoriesRes, settingsRes] = await Promise.all([
      fetch(`${API_URL}/products?isVisible=true`, fetchOpts).catch(() => null),
      fetch(`${API_URL}/categories`, fetchOpts).catch(() => null),
      fetch(`${API_URL}/settings`, fetchOpts).catch(() => null)
    ]);
    
    const rawProducts = (productsRes && productsRes.ok) ? await productsRes.json().catch(() => []) : [];
    const products = Array.isArray(rawProducts) ? rawProducts.map((p: any) => {
      const id = p.id || p._id || p.slug;
      if (!id || String(id).trim() === '' || String(id) === 'undefined') {
        console.error('[page.tsx] Error: Product missing valid identifier:', p.name || 'Unknown');
      }
      return { ...p, id: String(id || '') };
    }).filter((p: any) => p.id && p.id.trim() !== '' && p.id !== 'undefined') : [];
    
    const categories = (categoriesRes && categoriesRes.ok) ? await categoriesRes.json().catch(() => INITIAL_CATEGORIES) : INITIAL_CATEGORIES;
    const settings = (settingsRes && settingsRes.ok) ? await settingsRes.json().catch(() => INITIAL_SETTINGS) : INITIAL_SETTINGS;
    
    return { products, categories, settings };
  } catch (error) {
    console.error('Error fetching homepage data:', error);
    return { products: [], categories: INITIAL_CATEGORIES, settings: INITIAL_SETTINGS };
  }
}

export default async function Page() {
  const { products, categories, settings } = await fetchData();
  
  const effectiveSettings = settings || INITIAL_SETTINGS;
  const effectiveCategories = (categories && categories.length > 0) ? categories : INITIAL_CATEGORIES;

  return <HomePage products={products} categories={effectiveCategories} settings={effectiveSettings} />;
}
