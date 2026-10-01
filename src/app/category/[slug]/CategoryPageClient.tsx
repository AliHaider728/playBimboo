"use client";
import React, { useState, useMemo } from 'react';
import Link from "next/link";
import { useParams, useSearchParams, useRouter, usePathname } from "next/navigation";

import { Filter, SlidersHorizontal, Star, X, Check, ChevronDown, RotateCcw } from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { ProductCard } from '../../../components/common/ProductCard';
import { SkeletonCard } from '../../../components/common/SkeletonCard';
import { Breadcrumbs } from '../../../components/common/Breadcrumbs';

import { formatPrice } from '../../../utils/formatters';
import { AGE_GROUPS } from '../../../data/mockData';
import { AgeGroupCategory } from '../../../types';
import { getProductAgeGroups, isProductVisibleOnStorefront } from '../../../utils/products';
import { useScrollLock } from '../../../hooks/useScrollLock';

const parseMultiValueParam = (value: string | null) =>
  value
    ? Array.from(new Set(value.split(',').map(item => item.trim()).filter(item => item && item !== 'all')))
    : [];

const sameSelections = (left: string[], right: string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

export const CategoryPageClient: React.FC = () => {
  const { slug: categorySlug } = useParams<{ slug?: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const setSearchParams = (newParams: URLSearchParams, options?: { replace?: boolean }) => {
    const search = newParams.toString();
    const query = search ? '?' + search : '';
    if (options?.replace) {
      router.replace(pathname + query, { scroll: false });
    } else {
      router.push(pathname + query, { scroll: false });
    }
  };
  const { products, categories, productsLoading, productsError, refreshProducts } = useStore();

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useScrollLock(mobileFilterOpen);

  // Filter States initialized from URL params
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam !== null) return parseMultiValueParam(categoryParam);
    return categorySlug && categorySlug !== 'all' ? [categorySlug] : [];
  });
  const [selectedAges, setSelectedAges] = useState<string[]>(() => parseMultiValueParam(searchParams.get('age')));
  const [priceRange, setPriceRange] = useState<number>(15000);
  const [minRating, setMinRating] = useState<number>(0);

  // Sort state
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high' | 'rating' | 'newest'>('featured');

  // Sync direct navigation and browser back/forward changes.
  React.useEffect(() => {
    const categoryParam = searchParams.get('category');
    const nextCategories = categoryParam !== null
      ? parseMultiValueParam(categoryParam)
      : categorySlug && categorySlug !== 'all'
        ? [categorySlug]
        : [];
    const nextAges = parseMultiValueParam(searchParams.get('age'));

    setSelectedCategories(current => sameSelections(current, nextCategories) ? current : nextCategories);
    setSelectedAges(current => sameSelections(current, nextAges) ? current : nextAges);
  }, [categorySlug, searchParams]);

  const syncFilterParams = (categoriesToSync: string[], agesToSync: string[]) => {
    const nextParams = new URLSearchParams(searchParams);
    if (categoriesToSync.length > 0) {
      nextParams.set('category', categoriesToSync.join(','));
    } else if (categorySlug && categorySlug !== 'all') {
      nextParams.set('category', 'all');
    } else {
      nextParams.delete('category');
    }
    if (agesToSync.length > 0) {
      nextParams.set('age', agesToSync.join(','));
    } else {
      nextParams.delete('age');
    }
    setSearchParams(nextParams, { replace: true });
  };

  const toggleCategory = (category: string) => {
    const nextCategories = selectedCategories.includes(category)
      ? selectedCategories.filter(value => value !== category)
      : [...selectedCategories, category];
    setSelectedCategories(nextCategories);
    syncFilterParams(nextCategories, selectedAges);
  };

  const selectAllCategories = () => {
    setSelectedCategories([]);
    syncFilterParams([], selectedAges);
  };

  const toggleAge = (age: string) => {
    const nextAges = selectedAges.includes(age)
      ? selectedAges.filter(value => value !== age)
      : [...selectedAges, age];
    setSelectedAges(nextAges);
    syncFilterParams(selectedCategories, nextAges);
  };

  const selectAllAges = () => {
    setSelectedAges([]);
    syncFilterParams(selectedCategories, []);
  };

  // Current active category object
  const currentCategoryObj = selectedCategories.length === 1
    ? categories.find(c => c.slug === selectedCategories[0])
    : undefined;

  // Filter Logic
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (!isProductVisibleOnStorefront(p)) return false;
      // Category match
      const productCategorySlugs = p.categorySlugs?.length ? p.categorySlugs : p.categorySlug ? [p.categorySlug] : [];
      if (selectedCategories.length > 0 && !selectedCategories.some(slug => productCategorySlugs.includes(slug))) {
        return false;
      }
      // Age group match
      const productAgeGroups = getProductAgeGroups(p);
      if (selectedAges.length > 0 && !selectedAges.some(age => productAgeGroups.includes(age as AgeGroupCategory))) {
        return false;
      }
      // Price filter
      if (p.price > priceRange) {
        return false;
      }
      // Rating filter
      if (p.rating < minRating) {
        return false;
      }
      return true;
    });
  }, [products, selectedCategories, selectedAges, priceRange, minRating]);

  // Sort Logic
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    switch (sortBy) {
      case 'price-low':
        return list.sort((a, b) => a.price - b.price);
      case 'price-high':
        return list.sort((a, b) => b.price - a.price);
      case 'rating':
        return list.sort((a, b) => b.rating - a.rating);
      case 'newest':
        return list.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
      default:
        return list;
    }
  }, [filteredProducts, sortBy]);

  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedAges([]);
    setPriceRange(15000);
    setMinRating(0);
    setSortBy('featured');
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('age');
    if (categorySlug && categorySlug !== 'all') nextParams.set('category', 'all');
    else nextParams.delete('category');
    setSearchParams(nextParams, { replace: true });
  };

  const breadcrumbItems = [
    { label: 'Shop', path: '/category/all' },
    { label: currentCategoryObj ? currentCategoryObj.name : 'All Toys' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans py-6">
      

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={breadcrumbItems} />

        {/* Page Header */}
        <div className="bg-gradient-to-r from-sky-500 via-rose-500 to-amber-500 rounded-3xl p-6 sm:p-10 text-white shadow-lg mb-8 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="text-xs font-extrabold uppercase tracking-widest text-yellow-200 font-heading">
              Category Collection
            </span>
            <h1 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl mt-1 text-white">
              {currentCategoryObj ? currentCategoryObj.name : 'All Toys & Games'}
            </h1>
            <p className="text-xs sm:text-sm text-white/90 mt-2 font-medium leading-relaxed">
              {currentCategoryObj
                ? currentCategoryObj.description
                : 'Explore our full spectrum of educational STEM toys, cuddly plushies, building sets, and action figures.'}
            </p>
          </div>
        </div>

        {/* Layout Grid: Sidebar + Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block space-y-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-fit sticky top-24">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 font-heading font-extrabold text-slate-900 text-base">
                <Filter className="w-5 h-5 text-rose-500" />
                <span>Filter Toys</span>
              </div>
              <button
                onClick={resetFilters}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-500">
                Category
              </h3>
              <div className="space-y-1">
                <button
                  onClick={selectAllCategories}
                  aria-pressed={selectedCategories.length === 0}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                    selectedCategories.length === 0
                      ? 'bg-rose-500 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  All Categories ({products.length})
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.slug)}
                    aria-pressed={selectedCategories.includes(cat.slug)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between ${
                      selectedCategories.includes(cat.slug)
                        ? 'bg-rose-500 text-white font-bold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-[10px] opacity-75">({cat.itemCount})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Age Group Filter */}
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-500">
                Age Recommendation
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={selectAllAges}
                  aria-pressed={selectedAges.length === 0}
                  className={`px-2.5 py-2 rounded-xl text-xs font-bold text-center transition-colors ${
                    selectedAges.length === 0
                      ? 'bg-sky-500 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All Ages
                </button>
                {AGE_GROUPS.map(age => (
                  <button
                    key={age.id}
                    onClick={() => toggleAge(age.id)}
                    aria-pressed={selectedAges.includes(age.id)}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold text-center transition-colors ${
                      selectedAges.includes(age.id)
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {age.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="space-y-2 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Max Price
                  </h3>
                  <span className="font-heading font-extrabold text-xs text-slate-900">
                    {formatPrice(priceRange)}
                  </span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="15000"
                  step="500"
                  value={priceRange}
                  onChange={e => setPriceRange(Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                  <span>{formatPrice(500)}</span>
                  <span>{formatPrice(15000)}</span>
                </div>
            </div>


            {/* Minimum Rating Filter */}
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-500">
                Minimum Rating
              </h3>
              <div className="space-y-1">
                {[0, 4, 4.5, 4.8].map(r => (
                  <button
                    key={r}
                    onClick={() => setMinRating(r)}
                    className={`w-full flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      minRating === r ? 'bg-amber-100 text-amber-900 font-bold' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{r === 0 ? 'All Ratings' : `${r}+ Stars`}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-3 space-y-6">
            {/* Controls Bar: Mobile Filter Button + Results Count + Sort Dropdown */}
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-500 text-white font-heading font-bold text-xs"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filter & Refine</span>
              </button>

              <span className="text-xs sm:text-sm font-medium text-slate-600">
                Showing <strong className="text-slate-900 font-bold">{sortedProducts.length}</strong> toys found
              </span>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="px-3.5 py-2 text-xs font-heading font-bold rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400 cursor-pointer"
                >
                  <option value="featured">Featured / Best Match</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="newest">New Arrivals</option>
                </select>
              </div>
            </div>

            {/* Product Grid */}
            {productsLoading && products.length === 0 ? (
              <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:gap-6">
                {[...Array(6)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : productsError && products.length === 0 ? (
              <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center">
                <p className="text-sm text-slate-600">The catalog is temporarily unavailable.</p>
                <button onClick={() => void refreshProducts()} className="mt-4 rounded-xl bg-rose-500 px-5 py-2 text-sm font-bold text-white">Try again</button>
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 space-y-4">
                <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-400 flex items-center justify-center mx-auto">
                  <Filter className="w-8 h-8" />
                </div>
                <h3 className="font-heading font-bold text-lg text-slate-800">No Toys Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  We couldn't find any toys matching your current filter choices. Try broadening your price range or clearing filters!
                </p>
                <button
                  onClick={resetFilters}
                  className="px-6 py-2.5 rounded-2xl bg-rose-500 text-white font-heading font-bold text-xs hover:bg-rose-600 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:gap-6">
                {sortedProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xs bg-white shadow-2xl p-6 overflow-y-auto space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="font-heading font-bold text-base text-slate-900">Filter Toys</h3>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Categories */}
              <div className="space-y-2">
                <h4 className="font-heading font-bold text-xs uppercase text-slate-500">Category</h4>
                <div className="space-y-1">
                  <button
                    onClick={selectAllCategories}
                    aria-pressed={selectedCategories.length === 0}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold ${selectedCategories.length === 0 ? 'bg-rose-500 text-white' : 'text-slate-700'}`}
                  >
                    All Categories
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.slug)}
                      aria-pressed={selectedCategories.includes(cat.slug)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold ${selectedCategories.includes(cat.slug) ? 'bg-rose-500 text-white font-bold' : 'text-slate-700'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Age Groups */}
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <h4 className="font-heading font-bold text-xs uppercase text-slate-500">Age Group</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={selectAllAges}
                    aria-pressed={selectedAges.length === 0}
                    className={`px-2 py-2 rounded-xl text-xs font-bold ${selectedAges.length === 0 ? 'bg-sky-500 text-white' : 'bg-slate-100'}`}
                  >
                    All Ages
                  </button>
                  {AGE_GROUPS.map(age => (
                    <button
                      key={age.id}
                      onClick={() => toggleAge(age.id)}
                      aria-pressed={selectedAges.includes(age.id)}
                      className={`px-2 py-2 rounded-xl text-xs font-bold ${selectedAges.includes(age.id) ? 'bg-sky-500 text-white' : 'bg-slate-100'}`}
                    >
                      {age.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100">
                <button
                  onClick={resetFilters}
                  className="w-full py-3 rounded-2xl bg-slate-100 text-slate-700 font-heading font-bold text-xs"
                >
                  Reset
                </button>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="w-full py-3 rounded-2xl bg-slate-900 text-white font-heading font-bold text-xs"
                >
                  Apply & Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
