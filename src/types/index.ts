export type AgeGroupCategory = '0-2' | '3-5' | '6-8' | '9-12' | '13+';
export type ProductDetailBlockType = 
  | 'heading' | 'richText' | 'image' | 'imageText' | 'fullWidthImage' 
  | 'gallery' | 'featureCards' | 'iconText' | 'benefitsList' | 'whatsIncluded' 
  | 'recommendedAge' | 'giftBadges' | 'divider' | 'spacer' | 'ctaBanner' | 'html';
export type StockStatus = 'in_stock' | 'out_of_stock';

export interface ProductDetailBlock {
  id: string;
  type: ProductDetailBlockType;
  enabled: boolean;
  order: number;
  heading?: string;
  content?: string;
  items?: Record<string, any>[];
  images?: {
    secureUrl: string;
    publicId: string;
    alt: string;
    caption?: string;
    newlyUploaded?: boolean;
    file?: File;
  }[];
  image?: {
    secureUrl: string;
    publicId: string;
    alt: string;
    caption?: string;
    newlyUploaded?: boolean;
    file?: File;
  };
  settings?: {
    width?: 'full' | 'large' | 'medium';
    alignment?: 'left' | 'center' | 'right';
    background?: string;
    spacing?: 'none' | 'small' | 'medium' | 'large';
    responsiveVisibility?: 'all' | 'desktop' | 'mobile';
    imagePosition?: 'left' | 'right';
    columns?: 2 | 3 | 4;
  };
}

export interface ProductVariantOption {
  id: string;
  name: string;
  priceOffset?: number;
  inStock?: boolean;
  trackInventory?: boolean;
  stockQuantity?: number | null;
  stockStatus?: StockStatus;
  lowStockThreshold?: number | null;
  sku?: string;
}

export interface ProductVariantGroup {
  id: string;
  name: string;
  options: ProductVariantOption[];
}

export interface ProductAttributeTerm {
  id: string;
  label: string;
  slug: string;
  soldCount?: number;
  value: string;
  colorValue?: string;
  imageUrl?: string;
  imageAlt?: string;
  position: number;
  isArchived?: boolean;
}

export interface ProductAttribute {
  source: 'global' | 'custom';
  globalAttributeId?: string;
  id: string;
  name: string;
  slug: string;
  displayType: 'dropdown' | 'buttons' | 'radio' | 'color_swatches' | 'image_swatches';
  terms: ProductAttributeTerm[];
  selectedTermIds?: string[];
  visible: boolean;
  usedForVariations: boolean;
  position: number;
  displayTypeOverride?: string;
}

export interface ProductVariation {
  id: string;
  attributes: Record<string, string>;
  enabled: boolean;
  sku?: string;
  regularPrice: number;
  salePrice?: number;
  image?: {
    url: string;
    publicId?: string;
    alt?: string;
  };
  manageStock: boolean;
  stockQuantity?: number | null;
  lowStockThreshold?: number | null;
  stockStatus: StockStatus;
  weight?: number;
  dimensions?: { length: number; width: number; height: number };
  description?: string;
}

export type DeliveryChargeType = 'store_threshold' | 'category' | 'fixed' | 'free' | 'none';

// ── Pricing Offers ───────────────────────────────────────────────────────────
export interface QuantityBreakTier {
  minQty: number;
  pricePerUnit: number;
  label: string;
  badge: string;
}

export interface QuantityBreaks {
  enabled: boolean;
  tiers: QuantityBreakTier[];
}

export interface Bogo {
  enabled: boolean;
  /** How many units the customer must buy to trigger one BOGO reward */
  buyQty: number;
  /** Free units awarded per BOGO trigger (must be < buyQty) */
  getQty: number;
  label: string;
}

export interface FlatDiscount {
  enabled: boolean;
  minQty: number;
  discountType: "fixed" | "percentage";
  discountValue: number;
  label: string;
}

export interface PricingOffers {
  quantityBreaks: QuantityBreaks;
  bogo: Bogo;
  flatDiscount: FlatDiscount;
}

export interface Product {
  id: string;
  productType?: 'simple' | 'variable';
  name: string;
  slug: string;
  soldCount?: number;
  sku?: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  rating: number;
  reviewCount: number;
  category: string;
  categorySlug: string;
  categoryId?: string;
  categoryIds?: string[];
  categoryNames?: string[];
  categorySlugs?: string[];
  ageGroup?: AgeGroupCategory;
  ageGroups: AgeGroupCategory[];
  brand: string;
  inStock: boolean;
  trackInventory?: boolean;
  stockQuantity?: number | null;
  stockStatus?: StockStatus;
  lowStockThreshold?: number | null;
  images: string[];
  imagePublicIds?: string[];
  imageThumbnailUrls?: string[];
  imageThumbnailPublicIds?: string[];
  shortDescription?: string;
  description: string;
  features: string[];
  safetyInfo: string;
  specifications: Record<string, string>;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestseller?: boolean;
  isSpotlight?: boolean;
  isVisible?: boolean; // Show/Hide toggle on storefront
  status?: 'draft' | 'published';
  weight?: number;
  sizeGuide?: string;
  tags: string[];
  variants?: ProductVariantGroup[];
  attributes?: ProductAttribute[];
  variations?: ProductVariation[];
  defaultAttributes?: Record<string, string>;
  defaultVariationId?: string;
  deliveryType?: DeliveryChargeType;
  deliveryChargeType?: DeliveryChargeType;
  deliveryFee?: number;
  deliveryCharge?: number;
  customDeliveryFee?: number;
  metaTitle?: string;
  metaDescription?: string;
  displayOrder?: number;
  productDetailBlocks?: ProductDetailBlock[];
  productDetailCustomCss?: string;
  productDetailScopedCss?: string;
  productSchemaVersion?: number;
  pricingOffers?: PricingOffers;
  createdAt?: string;
  updatedAt?: string;
}

export type ProductInput = Omit<
  Product,
  'id' | 'originalPrice' | 'sku' | 'lowStockThreshold' | 'weight' | 'customDeliveryFee'
> & {
  originalPrice?: number | null;
  soldCount?: number | null;
  sku?: string | null;
  lowStockThreshold?: number | null;
  weight?: number | null;
  customDeliveryFee?: number | null;
};

export interface Category {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  image: string;
  imagePublicId?: string;
  shortDescription?: string;
  description: string;
  itemCount: number;
  deliveryType?: DeliveryChargeType;
  deliveryChargeType?: DeliveryChargeType;
  deliveryFee?: number;
  deliveryCharge?: number;
  customDeliveryFee?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  showInNavigation?: boolean;
  navigationLabel?: string;
  displayOrder?: number;
  parentCategoryId?: string;
  seoTitle?: string;
  metaDescription?: string;
  desktopVisible?: boolean;
  mobileVisible?: boolean;
}

export interface AgeGroupOption {
  id: AgeGroupCategory;
  name: string;
  label: string;
  range: string;
  color: string;
  icon: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: string; // Legacy
  variationId?: string;
  /** Human-readable label of the applied pricing offer, e.g. "Buy 2, Save 10%" */
  appliedOfferLabel?: string;
  /** Number of free units awarded by a BOGO offer */
  freeUnits?: number;
  /** Server-resolved unit price (after QB tier discount). Falls back to product.price if no offer. */
  resolvedUnitPrice?: number;
}

export interface WishlistItem {
  productId: string;
  addedAt: string;
}

export interface Review {
  id: string;
  productId: string;
  reviewerName: string;
  reviewerEmail?: string;
  title?: string;
  content: string;
  rating: number;
  avatarUrl?: string;
  imageUrl?: string;
  imagePublicId?: string;
  verifiedPurchase: boolean;
  source: 'customer' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
  userId?: string;
  orderId?: string;
  approvedAt?: string;
  approvedBy?: string;
  createdAt?: string; // from backend
  updatedAt?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
  selectedVariant?: string; // Legacy
  variationId?: string;
  productType?: 'simple' | 'variable';
  sku?: string;
  selectedAttributes?: Record<string, string>;
}

export interface Order {
  id: string;
  date: string;
  createdAt?: string; // ISO timestamp for 24h cancellation limit
  customerName: string;
  email: string;
  phone: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  shippingAddress: {
    fullName: string;
    phone?: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: 'Cash on Delivery (COD)';
  trackingNumber?: string;
  checkoutRequestId?: string;
  confirmationEmailSentAt?: string;
  confirmationEmailAccepted?: boolean;
  confirmationEmailFailedAt?: string;
}

export interface Address {
  id: string;
  name: string;
  phone?: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  ordersCount: number;
  totalSpent: number;
  joinedDate: string;
  addresses: Address[];
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'flat';
  amount: number;
  minSpend: number;
  expiryDate: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  currency: string;
  logoUrl?: string;
  metaTitle: string;
  metaDescription: string;
  freeShippingThreshold: number;
  standardShippingFee: number;
  flatDeliveryRate?: number;
  taxRate: number;
  storefrontNavigation: StorefrontNavigationItem[];
  homepageSections: HomepageSectionSetting[];
  homepageLayout?: { key: string; isVisible: boolean; order: number }[];
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    tiktok?: string;
  };
}

export type StorefrontNavigationKey = string;
export type NavigationLinkType = 'internal_page' | 'category' | 'custom_internal_url' | 'external_url';
export type NavigationMenuType = 'link' | 'dropdown';

export interface StorefrontNavigationItem {
  id: string;
  key: StorefrontNavigationKey;
  label: string;
  linkType: NavigationLinkType;
  menuType: NavigationMenuType;
  path?: string;
  externalUrl?: string;
  categoryId?: string;
  parentId?: string | null;
  visible: boolean;
  enabled: boolean;
  showOnDesktop: boolean;
  showOnMobile: boolean;
  order: number;
  displayOrder: number;
  badgeText?: string;
  openInNewTab?: boolean;
  isSystemItem?: boolean;
}

export type HomepageSectionKey =
  | 'hero' | 'categories' | 'ageGroups' | 'featuredProducts' | 'brandCampaign' | 'newArrivals';

export interface HomepageSectionSetting {
  key: HomepageSectionKey;
  name: string;
  enabled: boolean;
  order: number;
  heading?: string;
  subheading?: string;
  ctaLabel?: string;
  ctaLink?: string;
}
