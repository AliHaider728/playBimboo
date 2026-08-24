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
  const spotlightProduct = visibleProducts.find(p => p.category === 'educational-stem') || visibleProducts[0];

  const sectionByKey = Object.fromEntries((settings?.homepageSections || []).map(section => [section.key, section]));

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <SeoHead
        title="Play Bimboo - Premium RC Toys, Drones & Educational Games"
        description="Discover premium remote control cars, stunt drones, and STEM educational toys. Fast shipping, 30-day returns, and quality guaranteed."
      />

      {sectionByKey.hero?.enabled && (
        <div style={{ order: sectionByKey.hero.order }}>
          <Hero sectionSettings={sectionByKey.hero} />
        </div>
      )}

      {spotlightProduct && (
        <div style={{ order: (sectionByKey.hero?.order ?? 0) + 0.5 }}>
          <div id="spotlight" className="mt-10 sm:mt-16 lg:mt-20">
            <ProductSpotlight product={spotlightProduct} />
          </div>
        </div>
      )}

      {sectionByKey.categories?.enabled && (
        <div style={{ order: sectionByKey.categories.order }}>
          <div className="mt-16 sm:mt-24 lg:mt-32">
            <Categories categories={categories} sectionSettings={sectionByKey.categories} />
          </div>
        </div>
      )}
      
      {sectionByKey.ageGroups?.enabled && (
        <div style={{ order: sectionByKey.ageGroups.order }}>
          <div className="mt-16 sm:mt-24 lg:mt-32">
            <AgeGroups sectionSettings={sectionByKey.ageGroups} />
          </div>
        </div>
      )}

      {sectionByKey.brandCampaign?.enabled && (
        <div style={{ order: sectionByKey.brandCampaign.order }}>
          <div className="mt-16 sm:mt-24 lg:mt-32">
            <BrandCampaign sectionSettings={sectionByKey.brandCampaign} />
          </div>
        </div>
      )}

      {sectionByKey.featuredProducts?.enabled && (
        <div style={{ order: sectionByKey.featuredProducts.order }}>
          <div className="mt-16 sm:mt-24 lg:mt-32">
            <FeaturedProductsClient products={featuredProducts} sectionSettings={sectionByKey.featuredProducts} />
          </div>
        </div>
      )}

      {sectionByKey.newArrivals?.enabled && (
        <div style={{ order: sectionByKey.newArrivals.order }}>
          <div className="mt-16 sm:mt-24 lg:mt-32 mb-16 sm:mb-24">
            <NewArrivalsClient products={newArrivals} sectionSettings={sectionByKey.newArrivals} />
          </div>
        </div>
      )}
    </div>
  );
};
