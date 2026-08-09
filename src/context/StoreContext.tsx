"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  ProductInput,
  Category,
  Order,
  Customer,
  Coupon,
  StoreSettings,
  CartItem,
  Review
} from '../types';
import {
  INITIAL_SETTINGS,
  INITIAL_CATEGORIES,
  INITIAL_REVIEWS,
  INITIAL_ORDERS,
  INITIAL_CUSTOMERS,
  INITIAL_COUPONS
} from '../data/mockData';
import { api, getAuthToken, isSuperAdmin } from '../services/api';
import { formatPrice } from '../utils/formatters';
import { normalizeStoreSettings } from '../config/storeAppearance';
import { normalizeInventory, normalizeProductAgeGroups } from '../utils/products';
import { useToast } from './ToastContext';

type MongoRecord = {
  _id?: unknown;
};

type BackendOrder = Partial<Order> &
  MongoRecord & {
    orderId?: unknown;
    deliveryCharge?: number;
    discountAmount?: number;
  };

const getCartLineKey = (
  productId: string,
  selectedVariant?: string,
  variationId?: string
) => variationId
  ? `${productId}::variation::${variationId}`
  : `${productId}::legacy::${selectedVariant?.trim() || ''}`;

const consolidateCartItems = (items: unknown): CartItem[] => {
  if (!Array.isArray(items)) return [];

  const consolidated = new Map<string, CartItem>();
  for (const candidate of items) {
    if (!candidate || typeof candidate !== 'object') continue;
    const item = candidate as CartItem;
    if (!item.product?.id) continue;
    const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
    const key = getCartLineKey(item.product.id, item.selectedVariant, item.variationId);
    const existing = consolidated.get(key);
    if (existing) {
      consolidated.set(key, { ...existing, product: item.product, quantity: existing.quantity + quantity });
    } else {
      consolidated.set(key, { ...item, quantity });
    }
  }
  return [...consolidated.values()];
};

const readStoredCart = (): CartItem[] => {
  try {
    const saved = (typeof window !== 'undefined' ? localStorage.getItem.bind(localStorage) : () => null)('playbimboo_cart');
    return saved ? consolidateCartItems(JSON.parse(saved)) : [];
  } catch {
    return [];
  }
};

const normalizeProduct = (product: Partial<Product> & MongoRecord): Product => {
  const inventory = normalizeInventory(product);
  return ({
  ...(product as Product),
  id: String(product.id || product._id || product.slug || ''),
  ageGroups: normalizeProductAgeGroups(product.ageGroups, product.ageGroup),
  images: Array.isArray(product.images)
    ? product.images.filter(
        (image): image is string => typeof image === 'string' && image.trim().length > 0
      )
    : [],
  imagePublicIds: Array.isArray(product.imagePublicIds)
    ? product.imagePublicIds.map(publicId => typeof publicId === 'string' ? publicId : '')
    : [],
  imageThumbnailUrls: Array.isArray(product.imageThumbnailUrls)
    ? product.imageThumbnailUrls.map(url => typeof url === 'string' ? url : '')
    : [],
  imageThumbnailPublicIds: Array.isArray(product.imageThumbnailPublicIds)
    ? product.imageThumbnailPublicIds.map(publicId => typeof publicId === 'string' ? publicId : '')
    : [],
  shortDescription: product.shortDescription || '',
  status: product.status || 'published',
  ...inventory,
  category: product.category || '',
  categorySlug: product.categorySlug || '',
  categoryIds: Array.isArray(product.categoryIds) && product.categoryIds.length > 0
    ? product.categoryIds.filter((value): value is string => typeof value === 'string' && Boolean(value))
    : product.categoryId ? [product.categoryId] : [],
  categoryNames: Array.isArray(product.categoryNames) && product.categoryNames.length > 0
    ? product.categoryNames.filter((value): value is string => typeof value === 'string' && Boolean(value))
    : product.category ? [product.category] : [],
  categorySlugs: Array.isArray(product.categorySlugs) && product.categorySlugs.length > 0
    ? product.categorySlugs.filter((value): value is string => typeof value === 'string' && Boolean(value))
    : product.categorySlug ? [product.categorySlug] : [],
  rating: Number(product.reviewCount || 0) > 0 ? Number(product.rating || 0) : 0,
  reviewCount: Math.max(0, Number(product.reviewCount || 0)),
  features: Array.isArray(product.features) ? product.features : [],
  tags: Array.isArray(product.tags) ? product.tags : [],
  specifications: product.specifications || {},
  safetyInfo: product.safetyInfo || '',
  variants: Array.isArray(product.variants)
    ? product.variants.map(group => ({
        ...group,
        options: Array.isArray(group.options)
          ? group.options.map(option => ({ ...option, ...normalizeInventory(option) }))
          : []
      }))
    : [],
  productDetailBlocks: Array.isArray(product.productDetailBlocks)
    ? product.productDetailBlocks.map((block, index) => ({ ...block, order: index }))
    : []
  });
};

const normalizeCategory = (category: Partial<Category> & MongoRecord): Category => ({
  ...(category as Category),
  id: String(category.id || category._id || category.slug || ''),
  image: typeof category.image === 'string' ? category.image.trim() : '',
  shortDescription: category.shortDescription || category.description || '',
  description: category.description || category.shortDescription || '',
  isActive: category.isActive !== false,
  isFeatured: category.isFeatured === true,
  showInNavigation: category.showInNavigation !== false,
  displayOrder: Number(category.displayOrder || 0),
  desktopVisible: category.desktopVisible !== false,
  mobileVisible: category.mobileVisible !== false,
  itemCount: Number(category.itemCount || 0)
});

const normalizeOrder = (order: BackendOrder): Order => ({
  ...(order as Order),
  id: String(order.id || order.orderId || order._id || ''),
  date: order.date || order.createdAt || '',
  customerName: order.customerName || order.shippingAddress?.fullName || '',
  email: order.email || '',
  phone: order.phone || order.shippingAddress?.phone || '',
  items: Array.isArray(order.items) ? order.items : [],
  discount: order.discount ?? order.discountAmount ?? 0,
  shipping: order.shipping ?? order.deliveryCharge ?? 0
});

const normalizeCoupon = (coupon: any): Coupon => ({
  id: String(coupon.id || coupon._id || ''), code: String(coupon.code || ''),
  discountType: coupon.discountType === 'fixed' ? 'flat' : 'percentage',
  amount: Number(coupon.amount ?? coupon.discountValue ?? 0), minSpend: Number(coupon.minSpend ?? coupon.minPurchase ?? 0),
  expiryDate: coupon.expiryDate || '', usageLimit: Number(coupon.usageLimit ?? 0),
  usedCount: Number(coupon.usedCount ?? coupon.usageCount ?? 0), isActive: coupon.isActive !== false
});

export interface StoreContextType {
  // Data
  products: Product[];
  productsLoading: boolean;
  categories: Category[];
  orders: Order[];
  customers: Customer[];
  coupons: Coupon[];
  reviews: Review[];
  settings: StoreSettings;

  // Cart
  cart: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (product: Product, quantity?: number, selectedVariant?: string, variationId?: string) => void;
  removeFromCart: (productId: string, selectedVariant?: string, variationId?: string) => void;
  updateCartQuantity: (productId: string, quantity: number, selectedVariant?: string, variationId?: string) => void;
  clearCart: () => void;
  cartTotalItems: number;
  cartSubtotal: number;

  // Coupon
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  couponDiscountAmount: number;

  // Wishlist
  wishlist: string[]; // product IDs
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;

  // Admin CRUD Actions
  addProduct: (productData: ProductInput) => Promise<Product | null>;
  updateProduct: (id: string, productData: Partial<ProductInput>) => Promise<Product | null>;
  deleteProduct: (id: string) => Promise<boolean>;
  refreshProducts: () => Promise<void>;

  refreshCategories: () => Promise<Category[]>;
  addCategory: (categoryData: Partial<Category>) => Promise<Category | null>;
  updateCategory: (id: string, categoryData: Partial<Category>) => Promise<Category | null>;
  deleteCategory: (id: string, resolution: Record<string, unknown>) => Promise<any | null>;

  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<any | null>;
  updateOrderTracking: (orderId: string, trackingNumber: string) => Promise<Order | null>;
  placeOrder: (orderData: Omit<Order, 'id' | 'date'>) => Promise<Order | null>;

  addCoupon: (couponData: Omit<Coupon, 'id' | 'usedCount'>) => Promise<Coupon | null>;
  updateCoupon: (id: string, couponData: Partial<Coupon>) => Promise<Coupon | null>;
  deleteCoupon: (id: string) => Promise<boolean>;

  updateSettings: (newSettings: Partial<StoreSettings>) => Promise<boolean>;
  updateAppearanceSettings: (newSettings: Pick<StoreSettings, 'storefrontNavigation' | 'homepageSections'>) => void;
  
  // Review Actions
  submitCustomerReview: (reviewData: Omit<Review, 'id' | 'createdAt' | 'updatedAt' | 'source' | 'status' | 'approvedAt' | 'approvedBy'>) => Promise<{ success: boolean; message: string; review?: Review }>;
  addAdminReview: (reviewData: Omit<Review, 'id' | 'createdAt' | 'updatedAt' | 'source' | 'status' | 'approvedAt' | 'approvedBy'>) => Promise<Review | null>;
  updateReview: (id: string, data: Partial<Review>) => Promise<Review | null>;
  approveReview: (id: string) => Promise<Review | null>;
  rejectReview: (id: string) => Promise<Review | null>;
  deleteReview: (id: string) => Promise<boolean>;
  refreshAdminReviews: (params?: any) => Promise<{ reviews: Review[]; total: number; page: number; totalPages: number; counts: any } | null>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();

  // LocalStorage state initialization
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = (typeof window !== 'undefined' ? localStorage.getItem.bind(localStorage) : () => null)('playbimboo_products');
    const initialProducts = saved ? JSON.parse(saved) : [];
    return initialProducts.map(normalizeProduct);
  });
  const [productsLoading, setProductsLoading] = useState(true);

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = (typeof window !== 'undefined' ? localStorage.getItem.bind(localStorage) : () => null)('playbimboo_categories');
    const initialCategories = saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
    return initialCategories.map(normalizeCategory);
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = (typeof window !== 'undefined' ? localStorage.getItem.bind(localStorage) : () => null)('playbimboo_orders');
    const initialOrders = saved ? JSON.parse(saved) : INITIAL_ORDERS;
    return initialOrders.map(normalizeOrder);
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = (typeof window !== 'undefined' ? localStorage.getItem.bind(localStorage) : () => null)('playbimboo_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    const saved = (typeof window !== 'undefined' ? localStorage.getItem.bind(localStorage) : () => null)('playbimboo_coupons');
    return saved ? JSON.parse(saved) : INITIAL_COUPONS;
  });

  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = (typeof window !== 'undefined' ? localStorage.getItem.bind(localStorage) : () => null)('playbimboo_reviews');
    return saved ? JSON.parse(saved) : INITIAL_REVIEWS;
  });

  const [settings, setSettings] = useState<StoreSettings>(() => normalizeStoreSettings(INITIAL_SETTINGS));
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    const saved = localStorage.getItem('playbimboo_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const STALE_MARKERS = ['Gulberg', 'Lahore', 'support@playbimboo', '+92 300', '923001234567', '+327', 'Shafique Center, Gujranwala, Pakistan'];
        const settingsStr = JSON.stringify(parsed);
        if (STALE_MARKERS.some(m => settingsStr.includes(m))) {
          localStorage.removeItem('playbimboo_settings');
        } else {
          if (parsed.freeShippingThreshold === 50) parsed.freeShippingThreshold = 5000;
          setSettings(normalizeStoreSettings(parsed));
        }
      } catch {
        localStorage.removeItem('playbimboo_settings');
      }
    }
  }, []);

  const [cart, setCart] = useState<CartItem[]>(() => {
    return readStoredCart();
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = (typeof window !== 'undefined' ? localStorage.getItem.bind(localStorage) : () => null)('playbimboo_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const refreshProducts = async () => {
    const realProducts = await api.getProducts();
    if (realProducts) setProducts(realProducts.map(normalizeProduct));
  };

  const refreshCategories = async () => {
    const result = isSuperAdmin() ? await api.getAdminCategories() : await api.getCategories();
    const normalized = result ? result.map(normalizeCategory) : [];
    if (result) setCategories(normalized);
    return normalized;
  };

  // ─── Settings: fetched independently, never mixed with auth-gated data ───
  // This MUST run on mount and NEVER be re-triggered by pb-auth-changed.
  // It is the sole authority for settings state in production.
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const result = await api.getSettings();
        if (result) {
          setSettings(normalizeStoreSettings(result));
        }
        // If API fails, keep the current canonical value — do NOT fall back to mock
      } catch {
        // Settings API temporarily unavailable; keep current state (already normalized)
      }
    };
    void fetchSettings();
  }, []); // runs ONCE on mount only — no auth dependency

  // ─── Auth-gated admin data: fetched on mount + on auth change ───
  // Does NOT touch settings. Each domain updates only its own slice.
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const hasAdminSession = Boolean(getAuthToken());
        if (!hasAdminSession) {
          setOrders([]);
          setCustomers([]);
          setCoupons([]);
          setReviews([]);
          return; // Nothing more to fetch for guests
        }
        const [
          realOrders,
          realCustomers,
          realCoupons
        ] = await Promise.all([
          api.getOrders(),
          api.getCustomers(),
          api.getCoupons()
        ]);

        if (realOrders) setOrders(realOrders.map(normalizeOrder));
        if (realCustomers) setCustomers(realCustomers);
        if (realCoupons) setCoupons(realCoupons.map(normalizeCoupon));
      } catch (err) {
        console.error('Failed to fetch admin data from backend', err);
      }
    };

    // ─── Public data (products + categories) — always fetch ───
    const fetchPublicData = async () => {
      try {
        const hasAdminSession = Boolean(getAuthToken());
        const [realProducts, realCategories] = await Promise.all([
          api.getProducts(),
          hasAdminSession && isSuperAdmin() ? api.getAdminCategories() : api.getCategories()
        ]);
        if (realProducts) setProducts(realProducts.map(normalizeProduct));
        if (realCategories) setCategories(realCategories.map(normalizeCategory));
      } catch (err) {
        console.error('Failed to fetch public catalog data', err);
      } finally {
        setProductsLoading(false);
      }
    };

    void fetchPublicData();
    void fetchAdminData();
    window.addEventListener('pb-auth-changed', fetchAdminData);
    return () => window.removeEventListener('pb-auth-changed', fetchAdminData);
  }, []);

  // Sync to localStorage
  useEffect(() => {
    (typeof window !== 'undefined' ? localStorage.setItem.bind(localStorage) : () => {})('playbimboo_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    (typeof window !== 'undefined' ? localStorage.setItem.bind(localStorage) : () => {})('playbimboo_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    (typeof window !== 'undefined' ? localStorage.setItem.bind(localStorage) : () => {})('playbimboo_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    (typeof window !== 'undefined' ? localStorage.setItem.bind(localStorage) : () => {})('playbimboo_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    (typeof window !== 'undefined' ? localStorage.setItem.bind(localStorage) : () => {})('playbimboo_coupons', JSON.stringify(coupons));
  }, [coupons]);

  useEffect(() => {
    (typeof window !== 'undefined' ? localStorage.setItem.bind(localStorage) : () => {})('playbimboo_reviews', JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    (typeof window !== 'undefined' ? localStorage.setItem.bind(localStorage) : () => {})('playbimboo_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    (typeof window !== 'undefined' ? localStorage.setItem.bind(localStorage) : () => {})('playbimboo_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const syncCartFromAnotherTab = (event: StorageEvent) => {
      if (event.key !== 'playbimboo_cart') return;
      try {
        setCart(event.newValue ? consolidateCartItems(JSON.parse(event.newValue)) : []);
      } catch {
        // Ignore malformed data from another tab and preserve the current cart.
      }
    };
    window.addEventListener('storage', syncCartFromAnotherTab);
    return () => window.removeEventListener('storage', syncCartFromAnotherTab);
  }, []);

  useEffect(() => {
    (typeof window !== 'undefined' ? localStorage.setItem.bind(localStorage) : () => {})('playbimboo_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Prune wishlist so it only ever reflects REAL, currently-existing products.
  // This clears out any stale/ghost IDs left over from old mock data or
  // previous testing sessions, so the header count only shows items the
  // user has actually and currently added.
  useEffect(() => {
    if (products.length === 0) return;
    setWishlist(prev => {
      const validIds = new Set(products.map(p => p.id));
      const cleaned = prev.filter(id => validIds.has(id));
      return cleaned.length === prev.length ? prev : cleaned;
    });
  }, [products]);

  // Cart operations
  const addToCart = (product: Product, quantity = 1, selectedVariant?: string, variationId?: string) => {
    setCart(prev => {
      const normalizedCart = consolidateCartItems(prev);
      const lineKey = getCartLineKey(product.id, selectedVariant, variationId);
      const existing = normalizedCart.find(item =>
        getCartLineKey(item.product.id, item.selectedVariant, item.variationId) === lineKey
      );
      
      let enrichedProduct = { ...product };
      if (variationId && product.variations) {
        const variation = product.variations.find(v => v.id === variationId);
        if (variation) {
          const varPrice = variation.salePrice !== undefined && variation.salePrice !== null ? variation.salePrice : variation.regularPrice;
          enrichedProduct = {
            ...product,
            price: varPrice,
            images: variation.image?.url ? [variation.image.url, ...product.images.filter(img => img !== variation.image?.url)] : product.images,
            sku: variation.sku || product.sku
          };
        }
      }

      if (existing) {
        return normalizedCart.map(item =>
          getCartLineKey(item.product.id, item.selectedVariant, item.variationId) === lineKey
            ? { ...item, quantity: item.quantity + quantity, product: enrichedProduct }
            : item
        );
      }
      return [...normalizedCart, { product: enrichedProduct, quantity, selectedVariant, variationId }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string, selectedVariant?: string, variationId?: string) => {
    const lineKey = getCartLineKey(productId, selectedVariant, variationId);
    setCart(prev => prev.filter(item =>
      getCartLineKey(item.product.id, item.selectedVariant, item.variationId) !== lineKey
    ));
  };

  const updateCartQuantity = (productId: string, quantity: number, selectedVariant?: string, variationId?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, selectedVariant, variationId);
      return;
    }
    const lineKey = getCartLineKey(productId, selectedVariant, variationId);
    setCart(prev =>
      prev.map(item =>
        getCartLineKey(item.product.id, item.selectedVariant, item.variationId) === lineKey ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  const cartTotalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce((acc, item) => {
    let price = item.product.price;
    if (item.product.productType === 'variable' && item.variationId) {
       const variation = item.product.variations?.find(v => String(v.id) === String(item.variationId));
       if (variation) price = variation.salePrice !== undefined && variation.salePrice !== null ? variation.salePrice : variation.regularPrice;
    } else if (item.selectedVariant && item.product.variants) {
       // Legacy
       const selections = new Map(
         item.selectedVariant.split(',').map(part => {
           const separator = part.indexOf(':');
           return separator === -1 ? ['', part.trim()] : [part.slice(0, separator).trim(), part.slice(separator + 1).trim()];
         })
       );
       const variantOffset = item.product.variants.reduce((sum, group) => {
         const optionName = selections.get(group.name);
         const option = group.options?.find(opt => opt.name === optionName);
         return sum + Number(option?.priceOffset || 0);
       }, 0);
       price += variantOffset;
    }
    return acc + price * item.quantity;
  }, 0);

  // Coupon application logic
  const applyCoupon = (code: string) => {
    const trimmed = code.trim().toUpperCase();
    const found = coupons.find(c => c.code.toUpperCase() === trimmed && c.isActive);
    if (!found) {
      return { success: false, message: 'Invalid or expired coupon code.' };
    }
    if (cartSubtotal < found.minSpend) {
      return {
        success: false,
        message: `Minimum spend of ${formatPrice(found.minSpend)} required for this code.`
      };
    }
    setAppliedCoupon(found);
    return { success: true, message: `Coupon ${found.code} applied successfully!` };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const couponDiscountAmount = React.useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountType === 'percentage') {
      return (cartSubtotal * appliedCoupon.amount) / 100;
    } else {
      return Math.min(cartSubtotal, appliedCoupon.amount);
    }
  }, [appliedCoupon, cartSubtotal]);

  // Wishlist toggle
  const toggleWishlist = (productId: string) => {
    const isAdding = !wishlist.includes(productId);
    setWishlist(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
    const productName = products.find(product => product.id === productId)?.name;
    showToast(
      `${isAdding ? 'Added' : 'Removed'}${productName ? ` ${productName}` : ' product'} ${isAdding ? 'to' : 'from'} wishlist.`,
      isAdding ? 'success' : 'info'
    );
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  // Admin CRUD handlers
  const addProduct = async (productData: ProductInput) => {
    const savedProduct = await api.createProduct(productData);
    if (!savedProduct) return null;

    const normalizedProduct = normalizeProduct(savedProduct);
    setProducts(prev => [normalizedProduct, ...prev]);
    await refreshProducts();
    return normalizedProduct;
  };

  const updateProduct = async (id: string, productData: Partial<ProductInput>) => {
    const savedProduct = await api.updateProduct(id, productData);
    if (!savedProduct) return null;

    const normalizedProduct = normalizeProduct(savedProduct);
    setProducts(prev => prev.map(p => (p.id === id ? normalizedProduct : p)));
    await refreshProducts();
    return normalizedProduct;
  };

  const deleteProduct = async (id: string) => {
    const result = await api.deleteProduct(id);
    if (!result) return false;
    setProducts(prev => prev.filter(p => p.id !== id));
    return true;
  };

  const addCategory = async (categoryData: Partial<Category>) => {
    const saved = await api.createCategory(categoryData);
    if (!saved) return null;
    const normalized = normalizeCategory(saved);
    setCategories(current => [...current.filter(item => item.id !== normalized.id), normalized].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)));
    return normalized;
  };

  const updateCategory = async (id: string, categoryData: Partial<Category>) => {
    const saved = await api.updateCategory(id, categoryData);
    if (!saved) return null;
    const normalized = normalizeCategory(saved);
    setCategories(current => current.map(item => item.id === id ? normalized : item).sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)));
    await refreshProducts();
    return normalized;
  };

  const deleteCategory = async (id: string, resolution: Record<string, unknown>) => {
    const result = await api.deleteCategoryWithResolution(id, resolution);
    if (!result) return null;
    setCategories(current => current.filter(item => item.id !== id));
    await refreshProducts();
    const appearance = await api.getSettings();
    if (appearance) updateAppearanceSettings(appearance);
    return result;
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    const result = await api.updateOrderStatus(orderId, status);
    if (!result) return null;
    const updated = normalizeOrder(result.order || result);
    setOrders(current => current.map(order => order.id === orderId ? updated : order));
    await refreshProducts();
    return { ...result, order: updated };
  };

  const updateOrderTracking = async (orderId: string, trackingNumber: string) => {
    const result = await api.updateOrderTracking(orderId, trackingNumber);
    if (!result) return null;
    const updated = normalizeOrder(result);
    setOrders(current => current.map(order => order.id === orderId ? updated : order));
    return updated;
  };

  const placeOrder = async (orderData: Omit<Order, 'id' | 'date'>) => {
    const savedOrder = await api.createOrder({
      ...orderData,
      deliveryCharge: orderData.shipping,
      discountAmount: orderData.discount
    });
    if (!savedOrder) return null;

    const newOrder = normalizeOrder(savedOrder);
    setOrders(prev => [newOrder, ...prev]);
    await refreshProducts();

    // Update customer total spent
    setCustomers(prev => {
      if (!orderData.email.trim()) return prev;
      const existing = prev.find(c => c.email.toLowerCase() === orderData.email.toLowerCase());
      if (existing) {
        return prev.map(c =>
          c.email.toLowerCase() === orderData.email.toLowerCase()
            ? { ...c, ordersCount: c.ordersCount + 1, totalSpent: c.totalSpent + orderData.total }
            : c
        );
      } else {
        return [
          ...prev,
          {
            id: `cust-${Date.now().toString().slice(-3)}`,
            name: orderData.customerName,
            email: orderData.email,
            phone: orderData.phone,
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
            ordersCount: 1,
            totalSpent: orderData.total,
            joinedDate: new Date().toISOString().split('T')[0],
            addresses: [
              {
                id: 'addr-new',
                name: 'Shipping',
                street: orderData.shippingAddress.street,
                city: orderData.shippingAddress.city,
                state: orderData.shippingAddress.state,
                postalCode: orderData.shippingAddress.postalCode,
                isDefault: true,
              },
            ],
          },
        ];
      }
    });

    clearCart();
    return newOrder;
  };

  const addCoupon = async (couponData: Omit<Coupon, 'id' | 'usedCount'>) => {
    const saved = await api.createCoupon(couponData);
    if (!saved) return null;
    const coupon = normalizeCoupon(saved);
    setCoupons(prev => [coupon, ...prev.filter(item => item.id !== coupon.id)]);
    return coupon;
  };

  const updateCoupon = async (id: string, couponData: Partial<Coupon>) => {
    const saved = await api.updateCoupon(id, couponData);
    if (!saved) return null;
    const coupon = normalizeCoupon(saved);
    setCoupons(prev => prev.map(item => item.id === id ? coupon : item));
    return coupon;
  };

  const deleteCoupon = async (id: string) => {
    const deleted = await api.deleteCoupon(id);
    if (!deleted) return false;
    setCoupons(prev => prev.filter(c => c.id !== id));
    return true;
  };

  const updateSettings = async (newSettings: Partial<StoreSettings>) => {
    const saved = await api.updateSettings({ ...settings, ...newSettings });
    if (!saved) return false;
    setSettings(normalizeStoreSettings(saved));
    return true;
  };

  const updateAppearanceSettings = (
    newSettings: Pick<StoreSettings, 'storefrontNavigation' | 'homepageSections'>
  ) => {
    setSettings(prev => normalizeStoreSettings({ ...prev, ...newSettings }));
  };

  const submitCustomerReview = async (reviewData: Omit<Review, 'id' | 'createdAt' | 'updatedAt' | 'source' | 'status' | 'approvedAt' | 'approvedBy'>) => {
    try {
      const result = await api.submitReview(reviewData);
      if (!result) return { success: false, message: 'Failed to submit review' };
      return { success: true, message: result.message || 'Review submitted successfully', review: result.review };
    } catch (e: any) {
      return { success: false, message: e.message || 'Failed to submit review' };
    }
  };

  const addAdminReview = async (reviewData: Omit<Review, 'id' | 'createdAt' | 'updatedAt' | 'source' | 'status' | 'approvedAt' | 'approvedBy'>) => {
    const result = await api.submitAdminReview(reviewData);
    if (!result) return null;
    const formatted = { ...result, id: result._id || result.id };
    setReviews(prev => [formatted, ...prev]);
    return formatted;
  };

  const updateReview = async (id: string, data: Partial<Review>) => {
    const result = await api.updateReview(id, data);
    if (!result) return null;
    const formatted = { ...result, id: result._id || result.id };
    setReviews(prev => prev.map(r => r.id === id ? formatted : r));
    return formatted;
  };

  const approveReview = async (id: string) => {
    const result = await api.approveReview(id);
    if (!result) return null;
    const formatted = { ...result, id: result._id || result.id };
    setReviews(prev => prev.map(r => r.id === id ? formatted : r));
    return formatted;
  };

  const rejectReview = async (id: string) => {
    const result = await api.rejectReview(id);
    if (!result) return null;
    const formatted = { ...result, id: result._id || result.id };
    setReviews(prev => prev.map(r => r.id === id ? formatted : r));
    return formatted;
  };

  const deleteReview = async (id: string) => {
    const success = await api.deleteReview(id);
    if (!success) return false;
    setReviews(prev => prev.filter(r => r.id !== id));
    return true;
  };

  const refreshAdminReviews = async (params?: any) => {
    const result = await api.getAdminReviews(params);
    if (!result) return null;
    // Map _id to id
    const formattedReviews = result.reviews.map((r: any) => ({ ...r, id: r._id || r.id }));
    setReviews(formattedReviews);
    return { ...result, reviews: formattedReviews };
  };

  return (
        <StoreContext.Provider
      value={{
        products: isHydrated ? products : [],
        productsLoading,
        categories: isHydrated ? categories : INITIAL_CATEGORIES,
        orders: isHydrated ? orders : INITIAL_ORDERS,
        customers: isHydrated ? customers : INITIAL_CUSTOMERS,
        coupons: isHydrated ? coupons : INITIAL_COUPONS,
        reviews: isHydrated ? reviews : INITIAL_REVIEWS,
        settings: isHydrated ? settings : normalizeStoreSettings(INITIAL_SETTINGS),
        cart: isHydrated ? cart : [],
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartTotalItems,
        cartSubtotal,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        couponDiscountAmount,
        wishlist: isHydrated ? wishlist : [],
        toggleWishlist,
        isInWishlist,
        addProduct,
        updateProduct,
        deleteProduct,
        refreshProducts,
        refreshCategories,
        addCategory,
        updateCategory,
        deleteCategory,
        updateOrderStatus,
        updateOrderTracking,
        placeOrder,
        addCoupon,
        updateCoupon,
        deleteCoupon,
        updateSettings,
        updateAppearanceSettings,
        submitCustomerReview,
        addAdminReview,
        updateReview,
        approveReview,
        rejectReview,
        deleteReview,
        refreshAdminReviews
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
