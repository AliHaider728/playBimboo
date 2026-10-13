import type { HomepageSectionSetting, StoreSettings, StorefrontNavigationItem } from '../types';

export const INTERNAL_PAGE_OPTIONS = [
  { value: '/', label: 'Home' },
  { value: '/category/all', label: 'Shop All' },
  { value: '/about', label: 'About' },
  { value: '/contact', label: 'Contact' },
  { value: '/wishlist', label: 'Wishlist' },
  { value: '/account', label: 'Account' }
];

const systemItem = (key: string, label: string, path: string, displayOrder: number, overrides: Partial<StorefrontNavigationItem> = {}): StorefrontNavigationItem => ({
  id: `nav-${key}`, key, label, linkType: 'internal_page', menuType: 'link', path,
  parentId: null, visible: true, enabled: true, showOnDesktop: true, showOnMobile: true,
  displayOrder, order: displayOrder, isSystemItem: true, ...overrides
});

export const DEFAULT_STOREFRONT_NAVIGATION: StorefrontNavigationItem[] = [
  systemItem('home', 'Home', '/', 0),
  systemItem('shop', 'Shop', '/category/all', 1, { showOnMobile: false }),
  systemItem('categories', 'Shop Categories', '/category/all', 2, { menuType: 'dropdown', path: undefined, enabled: false, visible: false }),
  systemItem('about', 'About', '/about', 3, { showOnMobile: false }),
  systemItem('contact', 'Contact', '/contact', 4, { showOnMobile: false }),
  systemItem('wishlist', 'Wishlist', '/wishlist', 5, { showOnDesktop: false }),
  systemItem('account', 'Account', '/account', 6, { showOnDesktop: false })
];

export const DEFAULT_HOMEPAGE_SECTIONS: HomepageSectionSetting[] = [
  { key: 'hero', name: 'Hero', enabled: true, order: 0, heading: 'Where Imagination Comes to Play!', subheading: 'Discover award-winning toys, STEM sets, plushies, action figures, and more that spark curiosity, inspire learning, and bring families closer together through the power of play.', ctaLabel: 'Explore All Toys', ctaLink: '/category/all' },
  { key: 'categories', name: 'Shop by Category', enabled: false, order: 1, heading: 'Shop by Category', subheading: 'Browse Collections', ctaLabel: 'View All Categories', ctaLink: '/category/all' },
  { key: 'ageGroups', name: 'Shop by Age Group', enabled: false, order: 2, heading: 'Shop by Age Group', subheading: 'Find perfectly developmental and age-appropriate toys designed for your child’s growth.' },
  { key: 'featuredProducts', name: 'Featured Products', enabled: true, order: 3, heading: 'Featured Toys & Bestsellers', subheading: 'Hot Picks', ctaLabel: 'Shop All Bestsellers', ctaLink: '/category/all' },
  { key: 'brandCampaign', name: 'Play, Learn, Grow', enabled: true, order: 4, heading: 'Discover Toys That Make Learning Magical', subheading: 'From STEM kits and building sets to creative play essentials, PlayBimboo brings fun, skill-building toys that spark curiosity and joyful learning at every age.', ctaLabel: 'Explore PlayBimboo Favorites', ctaLink: '/category/all' },
  { key: 'newArrivals', name: 'New Arrivals', enabled: true, order: 5, heading: 'New Arrivals & Restocks', subheading: 'Fresh In Store', ctaLabel: 'Browse New Additions', ctaLink: '/category/all' }
];

const normalizeNavigation = (incoming?: Partial<StorefrontNavigationItem>[]) => {
  const source = incoming?.length ? incoming : DEFAULT_STOREFRONT_NAVIGATION;
  const normalized = source.map((item, index): StorefrontNavigationItem => {
    const fallback = DEFAULT_STOREFRONT_NAVIGATION.find(value => value.key === item.key);
    const displayOrder = Number(item.displayOrder ?? item.order ?? index);
    return {
      ...(fallback || {}),
      id: String(item.id || fallback?.id || `nav-${item.key || index}`),
      key: String(item.key || fallback?.key || `custom-${index}`),
      label: String(item.label || fallback?.label || 'Navigation Item'),
      linkType: item.linkType || fallback?.linkType || 'custom_internal_url',
      menuType: item.menuType || fallback?.menuType || 'link',
      path: item.path ?? fallback?.path,
      externalUrl: item.externalUrl,
      categoryId: item.categoryId,
      parentId: item.parentId || null,
      visible: item.visible !== false,
      enabled: item.enabled !== false,
      showOnDesktop: item.showOnDesktop !== false,
      showOnMobile: item.showOnMobile !== false,
      displayOrder,
      order: displayOrder,
      badgeText: item.badgeText,
      openInNewTab: item.openInNewTab === true,
      isSystemItem: item.isSystemItem ?? Boolean(fallback)
    };
  });
  DEFAULT_STOREFRONT_NAVIGATION.forEach(item => {
    if (!normalized.some(candidate => candidate.key === item.key)) normalized.push({ ...item });
  });
  return normalized;
};

const mergeSections = (incoming?: Partial<HomepageSectionSetting>[]) => DEFAULT_HOMEPAGE_SECTIONS.map(defaultItem => ({
  ...defaultItem,
  ...(incoming?.find(item => item.key === defaultItem.key) || {})
}));

export const normalizeStoreSettings = (settings: Partial<StoreSettings>): StoreSettings => ({
  storeName: settings.storeName || 'PlayBimboo',
  tagline: settings.tagline || 'Where Imagination Comes to Life',
  email: settings.email || 'Sales@playbimboo.com',
  phone: settings.phone || '0310-7172222',
  address: settings.address || 'Mumtaz Market, Gujranwala',
  currency: settings.currency || 'Rs.',
  logoUrl: settings.logoUrl,
  metaTitle: settings.metaTitle || 'PlayBimboo - Premium Toys for Kids',
  metaDescription: settings.metaDescription || '',
  freeShippingThreshold: Number(settings.freeShippingThreshold ?? 5000),
  standardShippingFee: Number(settings.standardShippingFee ?? settings.flatDeliveryRate ?? 200),
  flatDeliveryRate: settings.flatDeliveryRate,
  taxRate: Number(settings.taxRate ?? 0),
  storefrontNavigation: normalizeNavigation(settings.storefrontNavigation),
  homepageSections: mergeSections(settings.homepageSections),
  socialLinks: {
    instagram: settings.socialLinks?.instagram || 'https://www.instagram.com/playbimbootoys',
    facebook: settings.socialLinks?.facebook || 'https://facebook.com/playbimbootoys',
    youtube: settings.socialLinks?.youtube || 'https://youtube.com/@playbimboo',
    tiktok: settings.socialLinks?.tiktok || 'https://tiktok.com/@playbimbootoys'
  }
});

export const orderedVisibleNavigation = (settings: StoreSettings, surface: 'desktop' | 'mobile') =>
  settings.storefrontNavigation
    .filter(item => item.visible && (surface === 'desktop' ? item.showOnDesktop : item.showOnMobile))
    .sort((a, b) => a.displayOrder - b.displayOrder);

export const orderedHomepageSections = (settings: StoreSettings) =>
  settings.homepageSections.filter(section => section.enabled).sort((a, b) => a.order - b.order);
