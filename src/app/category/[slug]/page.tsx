export const dynamic = 'force-dynamic';
import { CategoryPageClient } from "./CategoryPageClient";
import { api } from "../../../services/api";
import { cache } from 'react';

import { notFound } from "next/navigation";

const getCategoriesForPage = cache(() => api.getCategories());

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  if (slug === 'all') {
    return { title: 'All Toys | PlayBimboo', description: 'Explore all toys at PlayBimboo' };
  }
  try {
    const categories = await getCategoriesForPage();
    if (!categories) {
      console.error(`[generateMetadata] api.getCategories returned null`);
    } else {
      const cat = categories.find((c: any) => c.slug === slug);
      if (cat) {
        return { 
          title: `${cat.name} | PlayBimboo`,
          description: cat.description || `Explore our selection of ${cat.name} toys.`
        };
      }
    }
  } catch (e) {}
  
  return {
    title: `${slug} | PlayBimboo`,
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;

  if (slug !== 'all') {
    const categories = await getCategoriesForPage();
    const cat = categories?.find((c: any) => c.slug === slug);
    if (!cat) {
      console.error(`[Page] Category not found for slug: ${slug}`);
      notFound();
    }
  }

  return <CategoryPageClient />;
}
