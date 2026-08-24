import React from 'react';
import { SeoHead } from '../components/common/SeoHead';
import { ProductSpotlight } from '../components/home/ProductSpotlight';
import { Product, Category, StoreSettings } from '../types';
import { Hero } from '../components/home/Hero';
import { Categories } from '../components/home/Categories';
import { AgeGroups } from '../components/home/AgeGroups';
import { BrandCampaign } from '../components/home/BrandCampaign';
import { FeaturedProductsClient } from '../components/home/FeaturedProductsClient';
import { NewArrivalsClient } from '../components/home/NewArrivalsClient';

interface Props {
  products: Product[];
  categories: Category[];
  settings: StoreSettings;
}

export const HomePage: React.FC<Props> = ({ products, categories, settings }) => {
  const visibleProducts = products.filter(p => p.status === 'published' && p.isVisible !== false);
  
  const featuredProducts = [...new Map(
    visibleProducts.filter(p => p.isFeatured || p.isBestseller).map(product => [product.id, product])
  ).values()];

  const markedNewArrivals = visibleProducts.filter(p => p.isNewArrival);
  const recentProducts = [...visibleProducts].sort((a, b) => {
    const aOrder = a.displayOrder || 0;
    const bOrder = b.displayOrder || 0;
    if (aOrder !== bOrder) return aOrder - bOrder;
    const aTime = Date.parse(a.createdAt || a.updatedAt || '');
    const bTime = Date.parse(b.createdAt || b.updatedAt || '');
    return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
  });
  const newArrivals = markedNewArrivals.length > 0 ? markedNewArrivals : recentProducts;
  const spotlightProduct = visibleProducts.find(p => p.isSpotlight);
  const sectionByKey = Object.fromEntries(settings.homepageSections.map(section => [section.key, section]));

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <SeoHead
        title="Playful Toys & Games Store"
        description="Shop top-rated STEM toys, building sets, action figures, soft plushies, and board games for kids of all ages. Safe, non-toxic & fast delivery!"
      />

      <Hero sectionSettings={sectionByKey.hero} />

      {spotlightProduct && (
        <div id="spotlight" style={{ order: (sectionByKey.hero?.order ?? 0) + 0.5 }} className="mt-10 sm:mt-16 lg:mt-20">
          <ProductSpotlight product={spotlightProduct} />
        </div>
      )}

      <Categories categories={categories} sectionSettings={sectionByKey.categories} />
      <AgeGroups sectionSettings={sectionByKey.ageGroups} />
      <BrandCampaign sectionSettings={sectionByKey.brandCampaign} />
      
      <FeaturedProductsClient products={featuredProducts} sectionSettings={sectionByKey.featuredProducts} />
      <NewArrivalsClient products={newArrivals} sectionSettings={sectionByKey.newArrivals} />
    </div>
  );
};
