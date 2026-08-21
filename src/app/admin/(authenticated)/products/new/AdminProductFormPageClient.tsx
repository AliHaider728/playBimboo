"use client";
import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bold,
  Box,
  ChevronLeft,
  CircleDollarSign,
  Image as ImageIcon,
  ImagePlus,
  Info,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  PackageCheck,
  Plus,
  Save,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  Truck
} from 'lucide-react';
import { useParams, useRouter } from "next/navigation";


import { useStore } from '../../../../../context/StoreContext';
import { useToast } from '../../../../../context/ToastContext';
import { AGE_GROUPS } from '../../../../../data/mockData';
import { api, getLastApiError } from '../../../../../services/api';
import { isSuperAdmin } from '../../../../../services/api';
import {
  AgeGroupCategory,
  DeliveryChargeType,
  Product,
  ProductDetailBlock,
  ProductInput,
  ProductVariantGroup,
  StockStatus,
  PricingOffers
} from '../../../../../types';

import { getSafeImageSrc } from '../../../../../utils/images';
import { getVariationDisplayLabel, normalizeInventory } from '../../../../../utils/products';
import { ProductDetailContentBuilder } from '../../../../../components/admin/ProductDetailContentBuilder';
import { CategoryFormModal } from '../../../../../components/admin/CategoryFormModal';
import { PricingOffersSection } from '../../../../../components/admin/PricingOffersSection';

import { AttributesManager } from '../../../../../components/admin/AttributesManager';
import { VariationsGenerator } from '../../../../../components/admin/VariationsGenerator';
import { useDialog } from '../../../../../context/DialogContext';
import { ProductAttribute, ProductVariation } from '../../../../../types';

type OrderedImage = {
  id: string;
  url: string;
  publicId?: string;
  thumbnailUrl?: string;
  thumbnailPublicId?: string;
  newlyUploaded?: boolean;
};
type FieldErrors = Record<string, string>;

const fieldClassName =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100';
const errorFieldClassName = 'border-rose-400 focus:border-rose-500 focus:ring-rose-100';

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const inferProductType = (product?: Partial<Product>) => {
  if (product?.productType === 'variable') return 'variable';
  const hasVariations = Array.isArray(product?.variations) && product.variations.length > 0;
  const usesVariationAttributes = Array.isArray(product?.attributes)
    ? product.attributes.some(attribute => attribute.usedForVariations)
    : false;
  return hasVariations || usesVariationAttributes ? 'variable' : 'simple';
};

const normalizeAttributeRecord = (value: unknown): Record<string, string> => {
  const entries = value instanceof Map
    ? Array.from(value.entries())
    : Object.entries((value && typeof value === 'object' ? value : {}) as Record<string, unknown>);

  return Object.fromEntries(
    entries
      .map(([key, item]) => [String(key), String(item ?? '').trim()] as const)
      .filter(([key, item]) => Boolean(key && item))
  );
};

const normalizeVariationRecords = (value: unknown): ProductVariation[] =>
  (Array.isArray(value) ? value : []).map((variation, index) => ({
    ...variation,
    id: String(variation?.id || `variation-${index + 1}`),
    attributes: normalizeAttributeRecord(variation?.attributes),
  }));

const resolveDefaultVariation = (
  variations: ProductVariation[],
  defaultVariationId: unknown,
  defaultAttributes: unknown
) => {
  const normalizedId = String(defaultVariationId || '');
  const normalizedAttributes = normalizeAttributeRecord(defaultAttributes);
  const enabledVariations = variations.filter(variation => variation.enabled);

  return enabledVariations.find(variation => String(variation.id) === normalizedId)
    || (Object.keys(normalizedAttributes).length > 0
      ? enabledVariations.find(variation =>
          Object.entries(normalizedAttributes).every(
            ([key, item]) => String(variation.attributes?.[key] ?? '') === item
          )
        )
      : undefined);
};

const stripHtml = (value: string) =>
  value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const makeImage = (
  url: string,
  suffix = '',
  publicId?: string,
  newlyUploaded = false,
  thumbnailUrl?: string,
  thumbnailPublicId?: string
): OrderedImage => ({
  id: `${url}-${suffix || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`,
  url,
  publicId,
  thumbnailUrl,
  thumbnailPublicId,
  newlyUploaded
});

const FormCard: React.FC<{
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}> = ({ title, description, icon: Icon, children }) => (
  <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
    <div className="mb-5 flex items-start gap-3">
      <div className="mt-0.5 rounded-xl bg-indigo-50 p-2 text-indigo-600">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <h2 className="font-heading text-base font-black text-slate-900">{title}</h2>
        {description && <p className="mt-0.5 text-xs font-medium text-slate-500">{description}</p>}
      </div>
    </div>
    {children}
  </section>
);

const FieldError: React.FC<{ message?: string }> = ({ message }) =>
  message ? <p role="alert" className="mt-1.5 text-xs font-semibold text-rose-600">{message}</p> : null;


export const AdminProductFormPageClient: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { products, categories, addProduct, updateProduct, addCategory } = useStore();
  const { showToast } = useToast();
  const { confirm } = useDialog();
  const initializedProductId = useRef<string | null>(null);

  const productFromStore = id ? products.find(product => product.id === id) : undefined;
  const [fetchedProduct, setFetchedProduct] = useState<Product>();
  const [productLoadFailed, setProductLoadFailed] = useState(false);
  const editingProduct = productFromStore || fetchedProduct;
  const isEditing = Boolean(id);

  const [name, setName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [regularPrice, setRegularPrice] = useState(2999);
  const [salePrice, setSalePrice] = useState<number>();
  const [sku, setSku] = useState('');
  const [trackInventory, setTrackInventory] = useState(true);
  const [stockQuantity, setStockQuantity] = useState<number | undefined>(25);
  const [stockStatus, setStockStatus] = useState<StockStatus>('in_stock');
  const [lowStockThreshold, setLowStockThreshold] = useState<number>();
  
  const [productType, setProductType] = useState<'simple' | 'variable'>('simple');
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [defaultAttributes, setDefaultAttributes] = useState<Record<string, string>>({});
    const [defaultVariationId, setDefaultVariationId] = useState('');
  
  const [ageGroups, setAgeGroups] = useState<AgeGroupCategory[]>(['6-8']);
  const [material, setMaterial] = useState('');
  const [safetyInfo, setSafetyInfo] = useState('');
  const [weight, setWeight] = useState<number>();
  const [deliveryType, setDeliveryType] = useState<DeliveryChargeType>('free');
  const [customDeliveryFee, setCustomDeliveryFee] = useState<number>();
  const [status, setStatus] = useState<'draft' | 'published'>('published');
  const [isVisible, setIsVisible] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestseller, setIsBestseller] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [isSpotlight, setIsSpotlight] = useState(false);
  const [soldCount, setSoldCount] = useState<number | ''>('');
  const [images, setImages] = useState<OrderedImage[]>([]);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [uploadingTarget, setUploadingTarget] = useState<'main' | 'gallery' | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [productDetailBlocks, setProductDetailBlocks] = useState<ProductDetailBlock[]>([]);
  const [productDetailCustomCss, setProductDetailCustomCss] = useState('');
  const [sizeGuide, setSizeGuide] = useState('');
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const superAdmin = isSuperAdmin();

  const DEFAULT_PRICING_OFFERS: PricingOffers = {
    quantityBreaks: { enabled: false, tiers: [] },
    bogo: { enabled: false, buyQty: 2, getQty: 1, label: '' }
  };
  const [pricingOffers, setPricingOffers] = useState<PricingOffers>(DEFAULT_PRICING_OFFERS);


  const markDirty = () => setIsDirty(true);
  const applyCategorySelection = (nextIds: string[]) => {
    const uniqueIds = [...new Set(nextIds)];
    const primary = categories.find(item => item.id === uniqueIds[0]);
    setCategoryIds(uniqueIds);
    setCategoryId(primary?.id || '');
    setCategory(primary?.name || '');
    setCategorySlug(primary?.slug || '');
    markDirty();
    clearError('categories');
  };
  const clearError = (field: string) =>
    setErrors(current => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });

  useEffect(() => {
    if (!id || productFromStore || fetchedProduct || productLoadFailed) return;
    let isCurrent = true;
    api.getProduct(id).then(result => {
      if (!isCurrent) return;
      if (!result) {
        setProductLoadFailed(true);
        return;
      }
      setFetchedProduct({
        ...(result as Product),
        id: String(result.id || result._id || id),
        images: Array.isArray(result.images) ? result.images.filter(Boolean) : []
      });
    });
    return () => {
      isCurrent = false;
    };
  }, [fetchedProduct, id, productFromStore, productLoadFailed]);

  useEffect(() => {
    if (!slugManuallyEdited) setSlug(slugify(name));
  }, [name, slugManuallyEdited]);

  
  const handleVariationsChange = (newVars: ProductVariation[]) => {
    const normalizedVars = normalizeVariationRecords(newVars);
    setVariations(normalizedVars);
    setIsDirty(true);
    const activeVars = normalizedVars.filter(v => v.enabled);
    if (activeVars.length > 0) {
      const currentDefault = activeVars.find(v => String(v.id) === String(defaultVariationId));
      if (!currentDefault) {
        const primaryAttr = attributes.find(a => a.usedForVariations);
        const sortedVars = primaryAttr
          ? [...activeVars].sort((a, b) => {
            const valA = a.attributes[primaryAttr.slug] || '';
            const valB = b.attributes[primaryAttr.slug] || '';
            const numA = parseInt(valA.replace(/\D/g, ''), 10) || 0;
            const numB = parseInt(valB.replace(/\D/g, ''), 10) || 0;
            return numB - numA;
          })
          : activeVars;
        setDefaultVariationId(String(sortedVars[0].id));
        setDefaultAttributes({ ...sortedVars[0].attributes });
        setErrors(current => {
          if (!current['defaultAttributes']) return current;
          const next = { ...current };
          delete next['defaultAttributes'];
          return next;
        });
      } else {
        setDefaultAttributes({ ...currentDefault.attributes });
      }
    } else {
      setDefaultVariationId('');
      setDefaultAttributes({});
    }
  };

  const stateRef = useRef<any>(null);
  stateRef.current = {
    name, slug, slugManuallyEdited, shortDescription, description, category, categoryId, categorySlug, categoryIds,
    regularPrice, salePrice, sku, trackInventory, stockQuantity, stockStatus, lowStockThreshold,
    productType, attributes, variations, defaultAttributes, defaultVariationId,
    ageGroups, material, safetyInfo, weight, deliveryType, customDeliveryFee,
    status, isVisible, isFeatured, isBestseller, isNewArrival, isSpotlight, metaTitle, metaDescription, productDetailBlocks, productDetailCustomCss,
    images, pricingOffers
  };

  useEffect(() => {
    if (!isDirty || productLoadFailed) return;
    const timer = setTimeout(() => {
      const state = stateRef.current;
      const DRAFT_KEY = `product-draft-${id || 'new'}`;
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
        draftVersion: 1,
        savedAt: Date.now(),
        formData: {
          ...state,
          images: state.images.filter((img: any) => img.url && !img.url.startsWith('blob:')).map((img: any) => ({
            url: img.url,
            publicId: img.publicId,
            thumbnailUrl: img.thumbnailUrl,
            thumbnailPublicId: img.thumbnailPublicId
          }))
        }
      }));
    }, 500);
    return () => clearTimeout(timer);
  }, [
    name, shortDescription, description, category, categoryId, categorySlug, categoryIds,
    regularPrice, salePrice, sku, trackInventory, stockQuantity, stockStatus, lowStockThreshold,
    productType, attributes, variations, defaultAttributes, defaultVariationId,
    ageGroups, material, safetyInfo, weight, deliveryType, customDeliveryFee,
    status, isVisible, isFeatured, isBestseller, isNewArrival, isSpotlight, soldCount, metaTitle, metaDescription, productDetailBlocks, productDetailCustomCss,
    images, isDirty, productLoadFailed, id, pricingOffers
  ]);


  const initializeFromApi = () => {
    if (!editingProduct) return;
    initializedProductId.current = editingProduct.id;
    setName(editingProduct.name);
    setShortDescription(editingProduct.shortDescription || '');
    setDescription(editingProduct.description || '');
    setCategory(editingProduct.category || '');
    setCategoryId(editingProduct.categoryId || categories.find(item => item.slug === editingProduct.categorySlug || item.name === editingProduct.category)?.id || '');
    setCategorySlug(editingProduct.categorySlug || '');
    setCategoryIds(editingProduct.categoryIds?.length
      ? editingProduct.categoryIds
      : editingProduct.categoryId ? [editingProduct.categoryId] : []);
    setRegularPrice(editingProduct.originalPrice ?? editingProduct.price);
    setSalePrice(editingProduct.originalPrice ? editingProduct.price : undefined);
    setSku(editingProduct.sku || '');
    const productInventory = normalizeInventory(editingProduct);
    setTrackInventory(productInventory.trackInventory);
    setStockQuantity(productInventory.stockQuantity);
    setStockStatus(productInventory.stockStatus);
    setLowStockThreshold(editingProduct.lowStockThreshold);
    setProductType(inferProductType(editingProduct));
    setAttributes(editingProduct.attributes || []);
    const normalizedVariations = normalizeVariationRecords(editingProduct.variations);
    const normalizedDefaults = normalizeAttributeRecord(editingProduct.defaultAttributes);
    const validMatch = resolveDefaultVariation(
      normalizedVariations,
      editingProduct.defaultVariationId,
      normalizedDefaults
    );
    setVariations(normalizedVariations);
    setDefaultVariationId(validMatch ? String(validMatch.id) : '');
    setDefaultAttributes(validMatch ? { ...validMatch.attributes } : normalizedDefaults);
    
    setAgeGroups(editingProduct.ageGroups?.length
      ? editingProduct.ageGroups
      : editingProduct.ageGroup ? [editingProduct.ageGroup] : ['6-8']);
    setMaterial(editingProduct.specifications?.Material || '');
    setSafetyInfo(editingProduct.safetyInfo || '');
    setWeight(editingProduct.weight);
    setDeliveryType(editingProduct.deliveryType || editingProduct.deliveryChargeType || 'free');
    setCustomDeliveryFee(editingProduct.customDeliveryFee);
    setStatus(editingProduct.status || 'published');
    setIsVisible(editingProduct.isVisible !== false);
    setIsFeatured(editingProduct.isFeatured === true);
    setIsBestseller(editingProduct.isBestseller === true);
    setIsNewArrival(editingProduct.isNewArrival === true);
    setIsSpotlight(editingProduct.isSpotlight === true);
    setSoldCount(editingProduct.soldCount ?? '');
    setImages((editingProduct.images || []).map((url, index) =>

      makeImage(
        url,
        String(index),
        editingProduct.imagePublicIds?.[index],
        false,
        editingProduct.imageThumbnailUrls?.[index],
        editingProduct.imageThumbnailPublicIds?.[index]
      )
    ));
    setMetaTitle(editingProduct.metaTitle || '');
    setMetaDescription(editingProduct.metaDescription || '');
    
    if (editingProduct.slug) {
      setSlug(editingProduct.slug);
      setSlugManuallyEdited(true);
    } else {
      let generatedSlug = slugify(editingProduct.name || '');
      let counter = 1;
      while (products.some(p => p.id !== id && p.slug === generatedSlug)) {
        generatedSlug = `${slugify(editingProduct.name || '')}-${counter}`;
        counter++;
      }
      setSlug(generatedSlug);
      setSlugManuallyEdited(false);
    }
    
    if (!editingProduct.productDetailBlocks?.length && editingProduct.description) {
      setProductDetailBlocks([{
        id: crypto.randomUUID(),
        type: 'richText',
        content: editingProduct.description,
        order: 0,
        enabled: true
      }]);
    } else {
      setProductDetailBlocks((editingProduct.productDetailBlocks || []).map(block => ({
        ...block,
        image: block.image ? { ...block.image, newlyUploaded: false } : undefined
      })));
    }
    setProductDetailCustomCss(editingProduct.productDetailCustomCss || '');
    setSizeGuide(editingProduct.sizeGuide || '');
    // Restore pricingOffers if the product has them, otherwise use defaults
    if (editingProduct.pricingOffers) {
      setPricingOffers({
        quantityBreaks: editingProduct.pricingOffers.quantityBreaks || { enabled: false, tiers: [] },
        bogo: editingProduct.pricingOffers.bogo || { enabled: false, buyQty: 2, getQty: 1, label: '' }
      });
    } else {
      setPricingOffers(DEFAULT_PRICING_OFFERS);
    }
    setIsDirty(false);
  };

  useEffect(() => {
    if (productLoadFailed) return;
    if (id && (!editingProduct || initializedProductId.current === editingProduct.id)) return;
    
    const DRAFT_KEY = `product-draft-${id || 'new'}`;
    const draftStr = sessionStorage.getItem(DRAFT_KEY);
    
    if (draftStr) {
      try {
        const draft = JSON.parse(draftStr);
        if (id && (editingProduct as any)?.updatedAt) {
          const apiUpdatedAt = new Date((editingProduct as any).updatedAt).getTime();
          if (draft.savedAt < apiUpdatedAt) {
             sessionStorage.removeItem(DRAFT_KEY);
             initializeFromApi();
             return;
          }
        }
        
        void confirm({
          title: 'Unsaved Draft Found',
          description: 'An unsaved product draft was found in this browser tab. Restore it?',
          confirmLabel: 'Restore',
          cancelLabel: 'Discard',
          destructive: false
        }).then(restore => {
          if (restore) {
            const data = draft.formData;
            setName(data.name || '');
            if (data.slug !== undefined) setSlug(data.slug);
            if (data.slugManuallyEdited !== undefined) setSlugManuallyEdited(data.slugManuallyEdited);
            setShortDescription(data.shortDescription || '');
            setDescription(data.description || '');
            setCategory(data.category || '');
            setCategoryId(data.categoryId || '');
            setCategorySlug(data.categorySlug || '');
            setCategoryIds(data.categoryIds || (data.categoryId ? [data.categoryId] : []));
            setRegularPrice(data.regularPrice || 0);
            setSalePrice(data.salePrice);
            setSku(data.sku || '');
            setTrackInventory(data.trackInventory || false);
            setStockQuantity(data.stockQuantity);
            setStockStatus(data.stockStatus || 'in_stock');
            setLowStockThreshold(data.lowStockThreshold);
            setProductType(inferProductType(data));
            setAttributes(data.attributes || []);
            const normalizedDraftVariations = normalizeVariationRecords(data.variations);
            const normalizedDraftDefaults = normalizeAttributeRecord(data.defaultAttributes);
            const validDraftMatch = resolveDefaultVariation(
              normalizedDraftVariations,
              data.defaultVariationId,
              normalizedDraftDefaults
            );
            setVariations(normalizedDraftVariations);
            setDefaultVariationId(validDraftMatch ? String(validDraftMatch.id) : '');
            setDefaultAttributes(validDraftMatch ? { ...validDraftMatch.attributes } : normalizedDraftDefaults);

            setAgeGroups(data.ageGroups || []);
            setMaterial(data.material || '');
            setSafetyInfo(data.safetyInfo || '');
            setWeight(data.weight);
            setDeliveryType(data.deliveryType || 'free');
            setCustomDeliveryFee(data.customDeliveryFee);
            setStatus(data.status || 'published');
            setIsVisible(data.isVisible !== false);
            setIsFeatured(data.isFeatured || false);
            setIsBestseller(data.isBestseller || false);
            setIsNewArrival(data.isNewArrival || false);
            setIsSpotlight(data.isSpotlight || false);
            setSoldCount(data.soldCount ?? '');
            setMetaTitle(data.metaTitle || '');
            setMetaDescription(data.metaDescription || '');
            setProductDetailBlocks(data.productDetailBlocks || []);
            setProductDetailCustomCss(data.productDetailCustomCss || '');
            if (data.images) {
              setImages(data.images.map((img: any, index: number) => {
                const apiIndex = editingProduct?.images?.indexOf(img.url) ?? -1;
                return makeImage(
                  img.url,
                  String(index),
                  img.publicId,
                  false,
                  img.thumbnailUrl || (apiIndex >= 0 ? editingProduct?.imageThumbnailUrls?.[apiIndex] : undefined),
                  img.thumbnailPublicId || (apiIndex >= 0 ? editingProduct?.imageThumbnailPublicIds?.[apiIndex] : undefined)
                );
              }));
            }
            setIsDirty(true);
            if (id && editingProduct) initializedProductId.current = editingProduct.id;
          } else {
            sessionStorage.removeItem(DRAFT_KEY);
            initializeFromApi();
          }
        });
        return;
      } catch (e) {
        sessionStorage.removeItem(DRAFT_KEY);
      }
    }
    initializeFromApi();
  }, [editingProduct, id, productLoadFailed, confirm]);


  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    const warnBeforeLinkNavigation = (event: MouseEvent) => {
      if (!isDirty) return;
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a');
      if (!anchor || anchor.target === '_blank') return;
      const destination = new URL(anchor.href, (typeof window !== 'undefined' ? window.location.href : ''));
      if (destination.origin !== (typeof window !== 'undefined' ? window.location.origin : '') || destination.pathname === (typeof window !== 'undefined' ? window.location.pathname : '')) return;
      event.preventDefault();
      event.stopPropagation();
      void confirm({ title: 'You have unsaved changes.', description: 'Leaving now will discard the changes you have not saved.', cancelLabel: 'Stay on Page', confirmLabel: 'Discard Changes', destructive: true }).then(async leave => {
        if (!leave) return;
        await cleanupTemporaryUploads();
        router.push(`${destination.pathname}${destination.search}${destination.hash}`);
      });
    };
    document.addEventListener('click', warnBeforeLinkNavigation, true);
    return () => document.removeEventListener('click', warnBeforeLinkNavigation, true);
  }, [confirm, isDirty, router]);

  const cleanupTemporaryUploads = async () => {
    const publicIds = [
      ...images.filter(image => image.newlyUploaded).map(image => image.publicId),
      ...images.filter(image => image.newlyUploaded).map(image => image.thumbnailPublicId),
      ...productDetailBlocks.filter(block => block.image?.newlyUploaded).map(block => block.image?.publicId)
    ].filter((value): value is string => Boolean(value));
    await Promise.all([...new Set(publicIds)].map(publicId => api.deleteImage(publicId)));
  };

  const cancelEditing = async () => {
    if (isDirty && !await confirm({ title: 'You have unsaved changes.', description: 'Leaving now will discard the changes you have not saved.', cancelLabel: 'Stay on Page', confirmLabel: 'Discard Changes', destructive: true })) return;
    await cleanupTemporaryUploads();
    router.push('/admin/products');
  };



  const uploadImages = async (files: File[], target: 'main' | 'gallery') => {
    if (files.length === 0) return;
    const remainingGallerySlots = Math.max(0, 8 - Math.max(0, images.length - 1));
    if (target === 'gallery' && files.length > remainingGallerySlots) {
      showToast(`You can add ${remainingGallerySlots} more gallery image(s).`, 'error');
      return;
    }

    const acceptedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
    const validFiles = files.filter(file => {
      if (!acceptedTypes.has(file.type)) {
        showToast(`${file.name} must be JPG, PNG, or WebP.`, 'error');
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast(`${file.name} exceeds the 5MB limit.`, 'error');
        return false;
      }
      return true;
    });
    if (validFiles.length === 0) return;

    setUploadingTarget(target);
    const uploaded: OrderedImage[] = [];
    try {
      for (const file of validFiles) {
        const result = await api.uploadImage(file);
        if (result?.url && result?.publicId && result?.thumbnailUrl && result?.thumbnailPublicId) {
          uploaded.push(makeImage(
            result.url,
            '',
            result.publicId,
            true,
            result.thumbnailUrl,
            result.thumbnailPublicId
          ));
        } else {
          throw new Error('The upload response did not include the original and thumbnail Cloudinary assets.');
        }
      }
      if (uploaded.length > 0) {
        const replacedNewMain = target === 'main' && images[0]?.newlyUploaded
          ? images[0]
          : undefined;
        setImages(current =>
          target === 'main'
            ? [uploaded[0], ...current.slice(current.length > 0 ? 1 : 0)]
            : [...current, ...uploaded]
        );
        if (replacedNewMain) {
          void Promise.all(
            [replacedNewMain.publicId, replacedNewMain.thumbnailPublicId]
              .filter((value): value is string => Boolean(value))
              .map(publicId => api.deleteImage(publicId))
          );
        }
        markDirty();
        clearError('images');
        showToast(
          target === 'main'
            ? images.length > 0 ? 'Main image replaced.' : 'Main image uploaded.'
            : `${uploaded.length} gallery image${uploaded.length === 1 ? '' : 's'} uploaded.`,
          'success'
        );
      }
    } catch (error) {
      await Promise.all(
        uploaded.flatMap(image => [image.publicId, image.thumbnailPublicId]
          .filter((value): value is string => Boolean(value))
          .map(publicId => api.deleteImage(publicId)))
      );
      showToast(error instanceof Error ? error.message : 'Image upload failed.', 'error');
    } finally {
      setUploadingTarget(null);
    }
  };

  const removeImage = async (imageId: string) => {
    const imageIndex = images.findIndex(image => image.id === imageId);
    const removedImage = images[imageIndex];
    if (!removedImage || !await confirm({ title: 'Remove this image?', description: removedImage.newlyUploaded ? 'This temporary upload will be permanently removed from Cloudinary.' : 'The image will be removed when the product is saved, and its unused Cloudinary asset may be deleted.', cancelLabel: 'Keep Image', confirmLabel: 'Remove Image', destructive: true })) return;
    setImages(current => current.filter(image => image.id !== imageId));
    if (removedImage?.newlyUploaded) {
      void Promise.all(
        [removedImage.publicId, removedImage.thumbnailPublicId]
          .filter((value): value is string => Boolean(value))
          .map(publicId => api.deleteImage(publicId))
      ).then(results => {
        if (results.some(result => !result)) showToast('The image was removed from the form, but Cloudinary cleanup failed.', 'error');
      });
    }
    markDirty();
    showToast(imageIndex === 0 ? 'Main image removed.' : 'Gallery image removed.', 'info');
  };

  const moveGalleryImage = (imageIndex: number, direction: -1 | 1) => {
    const targetIndex = imageIndex + direction;
    if (targetIndex < 1 || targetIndex >= images.length) return;
    setImages(current => {
      const reordered = [...current];
      [reordered[imageIndex], reordered[targetIndex]] = [reordered[targetIndex], reordered[imageIndex]];
      return reordered;
    });
    markDirty();
    showToast('Gallery order updated.', 'success');
  };

  const makeMainImage = (imageIndex: number) => {
    setImages(current => {
      const reordered = [...current];
      const [selected] = reordered.splice(imageIndex, 1);
      reordered.unshift(selected);
      return reordered;
    });
    markDirty();
    showToast('Main product image updated.', 'success');
  };

  const validateForm = () => {
    const nextErrors: FieldErrors = {};
    const normalizedSlug = slugify(slug || name);
    const normalizedSku = sku.trim().toUpperCase();
    
    if (!name.trim()) nextErrors.name = 'Product name is required.';
    if (ageGroups.length === 0) nextErrors.ageGroups = 'Select at least one age recommendation.';
    // Detailed description is now optional, unified builder replaces it
    
    if (productType === 'simple') {
      if (!Number.isFinite(regularPrice) || regularPrice < 0) nextErrors.regularPrice = 'Enter a non-negative regular price.';
      if (salePrice !== undefined && (!Number.isFinite(salePrice) || salePrice < 0 || salePrice >= regularPrice)) {
        nextErrors.salePrice = 'Sale price must be non-negative and lower than regular price.';
      }
      if (trackInventory && (!Number.isInteger(stockQuantity) || Number(stockQuantity) < 0)) nextErrors.stockQuantity = 'Stock must be a non-negative whole number.';
      if (trackInventory && lowStockThreshold !== undefined && (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0)) {
        nextErrors.lowStockThreshold = 'Low stock alert must be a non-negative whole number.';
      }
      if (normalizedSku && products.some(product =>
        product.id !== id &&
        (product.sku?.toUpperCase() === normalizedSku || product.variants?.some(group =>
          group.options.some(option => option.sku?.toUpperCase() === normalizedSku)
        ))
      )) nextErrors.sku = 'This SKU is already in use.';
    }

    if (weight != null && (!Number.isFinite(weight) || weight < 0)) nextErrors.weight = 'Weight must be zero or greater.';
    if (deliveryType === 'fixed' && (customDeliveryFee == null || customDeliveryFee < 0)) {
      nextErrors.customDeliveryFee = 'Enter a non-negative custom shipping fee.';
    }
    if (images.length === 0) nextErrors.images = 'A main product image is required.';
    if (productDetailBlocks.some(block => block.type === 'image' && (!block.image?.secureUrl || !block.image.alt.trim()))) {
      nextErrors.productDetailBlocks = 'Every image block needs an uploaded image and descriptive alt text.';
    }
    if (productDetailBlocks.some(block => block.type === 'html' && !block.content?.trim())) {
      nextErrors.productDetailBlocks = 'Custom HTML blocks cannot be empty.';
    }
    if (productDetailCustomCss.length > 10000) nextErrors.productDetailBlocks = 'Custom CSS cannot exceed 10,000 characters.';
    if (!normalizedSlug) nextErrors.slug = 'URL slug is required.';
    if (products.some(product => product.id !== id && product.slug === normalizedSlug)) {
      nextErrors.slug = 'This URL slug is already used by another product.';
    }

    if (productType === 'variable') {
      const activeVars = variations.filter(v => v.enabled);
      if (activeVars.length === 0) {
        nextErrors.variations = 'You must have at least one enabled variation.';
      } else {
        const vSkus = activeVars.map(v => v.sku?.trim().toUpperCase()).filter(Boolean);
        if (new Set(vSkus).size !== vSkus.length || (normalizedSku && vSkus.includes(normalizedSku))) {
          nextErrors.variations = 'Variation SKUs must be unique.';
        }
        
        for (const v of activeVars) {
          if (!Number.isFinite(v.regularPrice) || v.regularPrice < 0) {
            nextErrors.variations = `Regular price is required for ${v.id}.`;
            break;
          }
          if (v.salePrice !== undefined && v.salePrice !== null && (v.salePrice < 0 || v.salePrice >= v.regularPrice)) {
            nextErrors.variations = `Sale price cannot exceed regular price for ${v.id}.`;
            break;
          }
        }
      }

      // Check for duplicate attributes
      const attrSlugs = attributes.filter(a => a.name.trim()).map(a => a.slug || slugify(a.name));
      if (new Set(attrSlugs).size !== attrSlugs.length) {
        nextErrors.attributes = 'Duplicate attribute names are not allowed.';
      }
      
      const customAttrsMissingTerms = attributes.some(a => a.source === 'custom' && (!a.terms || a.terms.length === 0));
      if (customAttrsMissingTerms) {
        nextErrors.attributes = 'Add at least one value to every custom attribute.';
      }

      if (Object.keys(defaultAttributes).length > 0) {
        const isValidDefault = activeVars.some(v => 
          Object.entries(defaultAttributes).every(([attrSlug, attrVal]) => v.attributes[attrSlug] === attrVal)
        );
        if (!isValidDefault) {
          nextErrors.defaultAttributes = 'Select a default variation.';
        }
      } else {
         nextErrors.defaultAttributes = 'Select a default variation.';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0 ? null : nextErrors;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSaving) return;

    try {
      const currentErrors = validateForm();
    if (currentErrors) {
      const firstError = Object.values(currentErrors)[0];
      showToast(firstError, 'error');
      
      setTimeout(() => {
        const errorElement = document.querySelector('.border-rose-500, .text-rose-500');
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const input = errorElement.querySelector('input, select, textarea') as HTMLElement;
          if (input) input.focus();
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
      return;
    }

    let activePrice = salePrice === undefined ? regularPrice : salePrice;
    let computedOriginalPrice = salePrice === undefined ? null : Number(regularPrice);
    
    if (productType === 'variable') {
      const activeVars = variations.filter(v => v.enabled);
      if (activeVars.length > 0) {
         activePrice = Math.min(...activeVars.map(v => v.salePrice ?? v.regularPrice));
         const maxRegular = Math.max(...activeVars.map(v => v.regularPrice));
         computedOriginalPrice = activePrice < maxRegular ? maxRegular : null;
      } else {
         activePrice = 0;
         computedOriginalPrice = null;
      }
    }

    const normalizedSku = productType === 'simple' && sku ? sku.trim().toUpperCase() : undefined;

    const payload: ProductInput = {
      productSchemaVersion: 2,
      name: name.trim(),
      slug: slugify(slug || name),
      sku: normalizedSku,
      price: Number(activePrice),
      originalPrice: computedOriginalPrice,
      discountPercent: computedOriginalPrice ? Math.round(((computedOriginalPrice - activePrice) / computedOriginalPrice) * 100) : 0,
      rating: editingProduct?.rating ?? 0,
      reviewCount: editingProduct?.reviewCount ?? 0,
      category,
      categoryId: categoryId || '',
      categorySlug: categoryId ? categorySlug : '',
      categoryIds,
      categoryNames: categoryIds.map(selectedId => categories.find(item => item.id === selectedId)?.name).filter((value): value is string => Boolean(value)),
      categorySlugs: categoryIds.map(selectedId => categories.find(item => item.id === selectedId)?.slug).filter((value): value is string => Boolean(value)),
      ageGroups,
      brand: editingProduct?.brand || 'PlayBimboo',
      ...normalizeInventory({ trackInventory, stockQuantity, stockStatus }),
      stockQuantity: stockQuantity !== undefined ? Number(stockQuantity) : null,
      lowStockThreshold: lowStockThreshold ?? null,
      images: images.map(image => image.url),
      imagePublicIds: images.map(image => image.publicId || ''),
      imageThumbnailUrls: images.map(image => image.thumbnailUrl || ''),
      imageThumbnailPublicIds: images.map(image => image.thumbnailPublicId || ''),
      shortDescription: shortDescription.trim(),
      description,
      features: editingProduct?.features || [],
      safetyInfo: safetyInfo.trim(),
      specifications: {
        ...(editingProduct?.specifications || {}),
        Material: material.trim()
      },
      isFeatured,
      isNewArrival,
      isBestseller,
      isSpotlight,
      soldCount: soldCount === '' ? null : soldCount,
      isVisible,
      status,
      weight: weight ?? null,
      tags: editingProduct?.tags || [],

      productType,
      attributes,
      variations,
      defaultAttributes,
      defaultVariationId,
      deliveryType,
      customDeliveryFee: deliveryType === 'fixed' ? customDeliveryFee ?? null : null,
      metaTitle: metaTitle.trim(),
      metaDescription: metaDescription.trim(),
      productDetailBlocks: productDetailBlocks.map((block, order) => ({
        ...block,
        order,
        image: block.image ? {
          secureUrl: block.image.secureUrl,
          publicId: block.image.publicId,
          alt: block.image.alt,
          caption: block.image.caption
        } : undefined
      })),
      sizeGuide,
      ...(superAdmin ? { productDetailCustomCss } : {}),
      pricingOffers
    };

    setIsSaving(true);
    const savedProduct = id ? await updateProduct(id, payload) : await addProduct(payload);
    if (!savedProduct) {
      const apiError = getLastApiError() || `Could not ${isEditing ? 'update' : 'create'} the product.`;
      if (/slug/i.test(apiError)) setErrors(current => ({ ...current, slug: apiError }));
      if (/sku/i.test(apiError)) setErrors(current => ({ ...current, sku: apiError }));
      if (/Selector/i.test(apiError) || /Custom CSS/i.test(apiError)) setErrors(current => ({ ...current, productDetailBlocks: apiError }));
      await cleanupTemporaryUploads();
      setImages(current => current.filter(image => !image.newlyUploaded));
      setProductDetailBlocks(current => current.filter(block => !block.image?.newlyUploaded));
      showToast(apiError, 'error');
      setTimeout(() => {
        const errorElement = document.querySelector('.border-rose-500, .text-rose-500');
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const input = errorElement.querySelector('input, select, textarea') as HTMLElement;
          if (input) input.focus();
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
      return;
    }

    setIsDirty(false);
    showToast(`${isEditing ? 'Updated' : 'Created'} ${savedProduct.name} successfully.`, 'success');
    router.push('/admin/products');
    
    } catch (err: any) {
      showToast(err.message || 'An unexpected error occurred during save.', 'error');
      console.error('Submit error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing && productLoadFailed) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center rounded-3xl border border-slate-200 bg-white p-6 text-center">
        <div>
          <Box className="mx-auto h-9 w-9 text-slate-300" />
          <h1 className="mt-3 font-heading text-lg font-black text-slate-900">Product not found</h1>
          <button onClick={() => router.push('/admin/products')} className="mt-5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white">Back to Products</button>
        </div>
      </div>
    );
  }

  if (isEditing && !editingProduct) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center rounded-3xl border border-slate-200 bg-white">
        <div className="text-center"><Loader2 className="mx-auto h-7 w-7 animate-spin text-rose-500" /><p className="mt-3 text-sm font-bold text-slate-600">Loading product details…</p></div>
      </div>
    );
  }

  const inputClass = (field: string) => `${fieldClassName} ${errors[field] ? errorFieldClassName : ''}`;
  const galleryImages = images.slice(1);

  const enabledVariations = variations.filter(variation => variation.enabled);
  const selectedDefaultVariation = resolveDefaultVariation(
    enabledVariations,
    defaultVariationId,
    defaultAttributes
  );
  const defaultVariationSelectValue = selectedDefaultVariation ? String(selectedDefaultVariation.id) : '';

  return (<>
    <div className="mx-auto max-w-[1440px] space-y-6 pb-8 font-sans">
      
      <div>
        <button type="button" onClick={cancelEditing} className="mb-2 inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-rose-600">
          <ChevronLeft className="h-4 w-4" /> Back to Products
        </button>
        <h1 className="font-heading text-2xl font-black text-slate-900 sm:text-3xl">{isEditing ? 'Edit Toy Product' : 'Add New Toy Product'}</h1>
        <p className="mt-1 text-xs font-medium text-slate-500">{isEditing ? 'Update this product and publish changes to the PlayBimboo storefront.' : 'Create and publish a new product on the PlayBimboo storefront.'}</p>
      </div>

      <form onSubmit={handleSubmit} className="grid min-w-0 grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.9fr)]">
        <div className="min-w-0 space-y-6">
          <FormCard title="Basic Information" icon={Info}>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-bold text-slate-700">Product Type</span>
                <select value={productType} onChange={event => setProductType(event.target.value as 'simple' | 'variable')} className={fieldClassName}>
                  <option value="simple">Simple Product</option>
                  <option value="variable">Variable Product</option>
                </select>
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-bold text-slate-700">Product Name <span className="text-rose-500">*</span></span>
                <input value={name} onChange={event => { setName(event.target.value); markDirty(); clearError('name'); }} className={inputClass('name')} placeholder="e.g. Magnetic Building Blocks 64 PCS" />
                <FieldError message={errors.name} />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-bold text-slate-700">Short Description</span>
                <input value={shortDescription} maxLength={300} onChange={event => { setShortDescription(event.target.value); markDirty(); }} className={fieldClassName} placeholder="Short summary for product listings" />
                <span className="mt-1 block text-right text-[10px] text-slate-400">{shortDescription.length}/300</span>
              </label>
              <fieldset className="sm:col-span-2">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <legend className="text-xs font-bold text-slate-700">Categories</legend>
                  {superAdmin && <button type="button" onClick={() => setCategoryModalOpen(true)} className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700"><Plus className="h-3.5 w-3.5" /> Add category</button>}
                </div>
                {categoryIds.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2" aria-label="Selected categories">
                    {categoryIds.map((selectedId, index) => {
                      const selected = categories.find(item => item.id === selectedId);
                      if (!selected) return null;
                      return <button key={selected.id} type="button" onClick={() => applyCategorySelection(categoryIds.filter(idValue => idValue !== selected.id))} className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-indigo-50 px-3 text-xs font-bold text-indigo-700 ring-1 ring-indigo-200" aria-label={`Remove ${selected.name}`}>{selected.name}{index === 0 && <span className="text-[9px] font-black uppercase tracking-wide text-indigo-400">Primary</span>}<span aria-hidden="true">&times;</span></button>;
                    })}
                  </div>
                )}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                  <label className="relative block">
                    <span className="sr-only">Search categories</span>
                    <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input value={categorySearch} onChange={event => setCategorySearch(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" placeholder="Search categories…" />
                  </label>
                  <div className="mt-2 grid max-h-44 gap-2 overflow-y-auto pr-1 sm:grid-cols-2" role="group" aria-label="Product categories">
                    {categories.filter(item => item.isActive !== false && item.name.toLowerCase().includes(categorySearch.trim().toLowerCase())).map(item => {
                      const checked = categoryIds.includes(item.id);
                      return <label key={item.id || item.slug} className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition ${checked ? 'border-indigo-300 bg-white text-indigo-700 shadow-sm' : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-white'}`}><input type="checkbox" checked={checked} onChange={event => applyCategorySelection(event.target.checked ? [...categoryIds, item.id] : categoryIds.filter(idValue => idValue !== item.id))} />{item.name}</label>;
                    })}
                  </div>
                </div>
                <p className="mt-1.5 text-[10px] text-slate-400">The first selected category is used as the primary category on cards and breadcrumbs.</p>
                <FieldError message={errors.categories} />
              </fieldset>
            </div>
          </FormCard>

          {productType === 'simple' && (
            <FormCard title="Pricing & Stock" icon={CircleDollarSign}>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <label>
                  <span className="mb-1.5 block text-xs font-bold text-slate-700">Regular Price (Rs.) <span className="text-rose-500">*</span></span>
                  <input type="number" min="0" step="1" value={regularPrice} onChange={event => { setRegularPrice(Number(event.target.value)); markDirty(); clearError('regularPrice'); }} className={inputClass('regularPrice')} />
                  <FieldError message={errors.regularPrice} />
                </label>
                <label>
                  <span className="mb-1.5 block text-xs font-bold text-slate-700">Sale Price (Rs.)</span>
                  <input type="number" min="0" step="1" value={salePrice ?? ''} onChange={event => { setSalePrice(event.target.value === '' ? undefined : Number(event.target.value)); markDirty(); clearError('salePrice'); }} className={inputClass('salePrice')} placeholder="Leave empty if not on sale" />
                  <FieldError message={errors.salePrice} />
                </label>
                <label>
                  <span className="mb-1.5 block text-xs font-bold text-slate-700">SKU</span>
                  <input value={sku} onChange={event => { setSku(event.target.value.toUpperCase()); markDirty(); clearError('sku'); }} className={inputClass('sku')} placeholder="e.g. PB-064" />
                  <FieldError message={errors.sku} />
                </label>
                <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-3 py-2.5">
                  <div><span className="block text-xs font-bold text-slate-700">Track Inventory</span><span className="text-[10px] text-slate-400">Reduce exact quantity after orders</span></div>
                  <button type="button" role="switch" aria-checked={trackInventory} onClick={() => { setTrackInventory(value => !value); markDirty(); clearError('stockQuantity'); }} className={`relative h-6 w-11 rounded-full transition ${trackInventory ? 'bg-rose-500' : 'bg-slate-200'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${trackInventory ? 'left-6' : 'left-1'}`} /></button>
                </div>
                {trackInventory ? <>
                  <label>
                    <span className="mb-1.5 block text-xs font-bold text-slate-700">Stock Quantity <span className="text-rose-500">*</span></span>
                    <input type="number" min="0" step="1" value={stockQuantity ?? ''} onChange={event => { setStockQuantity(event.target.value === '' ? undefined : Number(event.target.value)); markDirty(); clearError('stockQuantity'); }} className={inputClass('stockQuantity')} />
                    <FieldError message={errors.stockQuantity} />
                  </label>
                  <label>
                    <span className="mb-1.5 block text-xs font-bold text-slate-700">Computed Availability</span>
                    <span className={`flex h-[42px] items-center rounded-xl border px-3 text-sm font-bold ${(stockQuantity || 0) > 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>{(stockQuantity || 0) > 0 ? 'In Stock' : 'Out of Stock'}</span>
                  </label>
                  <label>
                    <span className="mb-1.5 block text-xs font-bold text-slate-700">Low Stock Alert</span>
                    <input type="number" min="0" step="1" value={lowStockThreshold ?? ''} onChange={event => { setLowStockThreshold(event.target.value === '' ? undefined : Number(event.target.value)); markDirty(); clearError('lowStockThreshold'); }} className={inputClass('lowStockThreshold')} placeholder="e.g. 5" />
                    <FieldError message={errors.lowStockThreshold} />
                  </label>
                </> : <label>
                  <span className="mb-1.5 block text-xs font-bold text-slate-700">Manual Stock Status</span>
                  <select value={stockStatus} onChange={event => { setStockStatus(event.target.value as StockStatus); markDirty(); }} className={fieldClassName}>
                    <option value="in_stock">In Stock</option><option value="out_of_stock">Out of Stock</option>
                  </select>
                </label>}
              </div>
            </FormCard>
          )}



          {productType === 'variable' && (
            <>
              <FormCard title="Attributes" description="Define the attributes that will be used to generate variations." icon={List}>
                <AttributesManager attributes={attributes} onChange={(newAttrs) => { setAttributes(newAttrs); markDirty(); }} />
              </FormCard>

              {attributes.some(a => a.slug === 'size') && (
                <FormCard title="Size Guide" description="Add a size chart or measurements. If provided, a 'Size Guide' button will appear on the product page." icon={Info}>
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <textarea 
                      value={sizeGuide} 
                      onChange={e => { setSizeGuide(e.target.value); markDirty(); }} 
                      rows={6}
                      className="w-full p-4 text-sm outline-none"
                      placeholder="Size guide content (e.g. S: 36, M: 38...)" 
                    />
                  </div>
                </FormCard>
              )}

              <FormCard title="Variations" description="Generate and manage product variations." icon={PackageCheck}>
                <VariationsGenerator attributes={attributes} variations={variations} onChange={handleVariationsChange} basePrice={regularPrice} productImages={images} />
                
                {variations.length > 0 && (
                  <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <label className="block text-sm font-bold text-slate-800 mb-2">Default Variation</label>
                    <p className="text-xs text-slate-500 mb-3">This variation will be pre-selected when customers open the product page.</p>
                    <select
                      value={defaultVariationSelectValue}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        const v = enabledVariations.find(variation => String(variation.id) === selectedId);
                        setDefaultVariationId(selectedId);
                        if (v) setDefaultAttributes({ ...v.attributes });
                        markDirty();
                        clearError('defaultAttributes');
                      }}
                      className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-1 ${errors.defaultAttributes ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-300 focus:border-rose-400 focus:ring-rose-400'}`}
                    >
                      <option value="" disabled>Select a default variation...</option>
                      {enabledVariations.map((v, i) => (
                        <option key={String(v.id)} value={String(v.id)} className="text-slate-800">
                          {getVariationDisplayLabel(v, attributes, i)}
                        </option>
                      ))}
                    </select>
                    <FieldError message={errors.defaultAttributes} />
                  </div>
                )}
                
                <FieldError message={errors.variations} />
              </FormCard>
            </>
          )}



          {/* ── Pricing Offers ── */}
          <FormCard
            title="Pricing Offers"
            description="Configure tiered pricing and BOGO deals shown on the product page. Both features are independent and can be enabled together."
            icon={CircleDollarSign}
          >
            <PricingOffersSection
              value={pricingOffers}
              onChange={next => { setPricingOffers(next); markDirty(); }}
              basePrice={salePrice !== undefined ? salePrice : regularPrice}
            />
          </FormCard>



          <FormCard title="Delivery & Shipping" icon={Truck}>
            <div className="grid gap-5 sm:grid-cols-2">
              <label>
                <span className="mb-1.5 block text-xs font-bold text-slate-700">Weight (kg)</span>
                <input type="number" min="0" step="0.01" value={weight ?? ''} onChange={event => { setWeight(event.target.value === '' ? undefined : Number(event.target.value)); markDirty(); clearError('weight'); }} className={inputClass('weight')} placeholder="e.g. 1.20" />
                <FieldError message={errors.weight} />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-bold text-slate-700">Delivery Charge Model</span>
                <select value={deliveryType} onChange={event => { setDeliveryType(event.target.value as DeliveryChargeType); markDirty(); clearError('customDeliveryFee'); }} className={fieldClassName}>
                  <option value="store_threshold">Default Store Shipping Fee</option><option value="free">Free Shipping</option><option value="fixed">Custom Shipping Fee</option>
                </select>
                <span className="mt-1.5 block text-[10px] text-slate-400">Product overrides take priority over the store-wide threshold.</span>
              </label>
              {deliveryType === 'fixed' && <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-700">Custom Shipping Fee (Rs.) <span className="text-rose-500">*</span></span><input type="number" min="0" step="1" value={customDeliveryFee ?? ''} onChange={event => { setCustomDeliveryFee(event.target.value === '' ? undefined : Number(event.target.value)); markDirty(); clearError('customDeliveryFee'); }} className={inputClass('customDeliveryFee')} /><FieldError message={errors.customDeliveryFee} /></label>}
            </div>
          </FormCard>



          <ProductDetailContentBuilder
            blocks={productDetailBlocks}
            customCss={productDetailCustomCss}
            isSuperAdmin={superAdmin}
            onBlocksChange={next => { setProductDetailBlocks(next); markDirty(); clearError('productDetailBlocks'); }}
            onCustomCssChange={next => { setProductDetailCustomCss(next); markDirty(); clearError('productDetailBlocks'); }}
          />
          <FieldError message={errors.productDetailBlocks} />
        </div>

        <aside className="min-w-0 space-y-6 xl:sticky xl:top-20">
          <FormCard title="Publish" icon={Send}>
            <div className="space-y-4">
              <label><span className="mb-1.5 block text-xs font-bold text-slate-700">Status</span><select value={status} onChange={event => { setStatus(event.target.value as 'draft' | 'published'); markDirty(); }} className={fieldClassName}><option value="published">Published</option><option value="draft">Draft</option></select></label>
              <label><span className="mb-1.5 block text-xs font-bold text-slate-700">Visibility</span><select value={isVisible ? 'visible' : 'hidden'} onChange={event => { setIsVisible(event.target.value === 'visible'); markDirty(); }} className={fieldClassName}><option value="visible">Visible to Customers</option><option value="hidden">Hidden</option></select></label>
              <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
                <div><span className="block text-xs font-bold text-slate-700">Featured Product</span><span className="text-[10px] text-slate-400">Show in the homepage featured section</span></div>
                <button type="button" role="switch" aria-checked={isFeatured} onClick={() => { setIsFeatured(value => !value); markDirty(); }} className={`relative h-6 w-11 rounded-full transition ${isFeatured ? 'bg-rose-500' : 'bg-slate-200'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${isFeatured ? 'left-6' : 'left-1'}`} /></button>
              </div>
              {[
                { label: 'Bestseller', help: 'Include in Featured Toys & Bestsellers', value: isBestseller, setValue: setIsBestseller },
                { label: 'New Arrival', help: 'Include in New Arrivals & Restocks', value: isNewArrival, setValue: setIsNewArrival },
                { label: 'Homepage Spotlight', help: 'Large homepage promotion; replaces the current spotlight', value: isSpotlight, setValue: setIsSpotlight }
              ].map(option => (
                <div key={option.label} className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
                  <div><span className="block text-xs font-bold text-slate-700">{option.label}</span><span className="text-[10px] text-slate-400">{option.help}</span></div>
                  <button type="button" role="switch" aria-label={option.label} aria-checked={option.value} onClick={() => { option.setValue(value => !value); markDirty(); }} className={`relative h-6 w-11 shrink-0 rounded-full transition ${option.value ? 'bg-rose-500' : 'bg-slate-200'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${option.value ? 'left-6' : 'left-1'}`} /></button>
                </div>
              ))}
              <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4 mt-4">
                <div><span className="block text-xs font-bold text-slate-700">Sold Count (Social Proof)</span><span className="text-[10px] text-slate-400">Override the generated X+ Sold number</span></div>
                <input type="number" min="0" placeholder="e.g. 150" value={soldCount} onChange={e => { setSoldCount(e.target.value === '' ? '' : parseInt(e.target.value, 10)); markDirty(); }} className="w-24 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-rose-300 focus:ring-1 focus:ring-rose-300 transition" />
              </div>
            </div>
          </FormCard>

          <FormCard title="Product Images" icon={ImagePlus}>
            <div className="space-y-5">
              <div>
                <span className="mb-2 block text-xs font-bold text-slate-700">Main Product Image <span className="text-rose-500">*</span></span>
                {images[0] ? (
                  <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"><img src={getSafeImageSrc(images[0].url)} alt="Main product preview" className="aspect-[4/3] w-full object-cover" /><div className="absolute inset-x-0 bottom-0 flex gap-2 bg-slate-900/70 p-2 backdrop-blur"><label className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg bg-white px-2 py-2 text-[10px] font-bold text-slate-700"><ImagePlus className="h-3.5 w-3.5" /> Replace<input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" disabled={uploadingTarget !== null} onChange={event => { void uploadImages(Array.from(event.target.files || []), 'main'); event.target.value = ''; }} /></label><button type="button" onClick={() => { void removeImage(images[0].id); }} className="rounded-lg bg-white px-2.5 text-rose-500" aria-label="Remove main image"><Trash2 className="h-4 w-4" /></button></div></div>
                ) : (
                  <label className={`flex aspect-[4/3] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-slate-50 text-center transition hover:border-indigo-300 hover:bg-indigo-50/40 ${errors.images ? 'border-rose-400' : 'border-slate-200'}`}><input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" disabled={uploadingTarget !== null} onChange={event => { void uploadImages(Array.from(event.target.files || []), 'main'); event.target.value = ''; }} />{uploadingTarget === 'main' ? <Loader2 className="h-7 w-7 animate-spin text-rose-500" /> : <ImageIcon className="h-7 w-7 text-indigo-500" />}<span className="mt-2 text-xs font-bold text-slate-600">Upload main image</span><span className="mt-1 text-[10px] text-slate-400">JPG, PNG, WebP · Max 5MB</span></label>
                )}
                <FieldError message={errors.images} />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between"><span className="text-xs font-bold text-slate-700">Gallery Images</span><span className="text-[10px] text-slate-400">{galleryImages.length}/8</span></div>
                {galleryImages.length > 0 && <div className="mb-3 grid grid-cols-2 gap-2">{galleryImages.map((image, galleryIndex) => { const imageIndex = galleryIndex + 1; return <div key={image.id} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50"><img src={getSafeImageSrc(image.url)} alt={`Gallery preview ${imageIndex}`} className="aspect-square w-full object-cover" /><div className="flex items-center justify-between gap-1 p-1.5"><button type="button" title="Make main image" onClick={() => makeMainImage(imageIndex)} className="rounded-md px-1.5 py-1 text-[9px] font-bold text-indigo-600 hover:bg-indigo-50">Main</button><button type="button" disabled={galleryIndex === 0} onClick={() => moveGalleryImage(imageIndex, -1)} className="rounded-md p-1 text-slate-500 disabled:opacity-30" aria-label="Move image left"><ArrowLeft className="h-3 w-3" /></button><button type="button" disabled={galleryIndex === galleryImages.length - 1} onClick={() => moveGalleryImage(imageIndex, 1)} className="rounded-md p-1 text-slate-500 disabled:opacity-30" aria-label="Move image right"><ArrowRight className="h-3 w-3" /></button><button type="button" onClick={() => { void removeImage(image.id); }} className="rounded-md p-1 text-rose-500" aria-label="Remove gallery image"><Trash2 className="h-3 w-3" /></button></div></div>; })}</div>}
                <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-3 text-xs font-bold text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/40 ${galleryImages.length >= 8 ? 'pointer-events-none opacity-50' : ''}`}>{uploadingTarget === 'gallery' ? <Loader2 className="h-4 w-4 animate-spin text-rose-500" /> : <ImagePlus className="h-4 w-4 text-indigo-500" />} Add Gallery Images<input type="file" multiple className="hidden" accept="image/jpeg,image/png,image/webp" disabled={uploadingTarget !== null || galleryImages.length >= 8} onChange={event => { void uploadImages(Array.from(event.target.files || []), 'gallery'); event.target.value = ''; }} /></label>
              </div>
            </div>
          </FormCard>

          <FormCard title="Product Details" icon={Box}>
            <div className="space-y-4">
              <fieldset>
                <legend className="mb-2 block text-xs font-bold text-slate-700">Age Recommendations <span className="text-rose-500">*</span></legend>
                <div className="grid grid-cols-2 gap-2">
                  {AGE_GROUPS.map(group => <label key={group.id} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition ${ageGroups.includes(group.id) ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600'}`}><input type="checkbox" checked={ageGroups.includes(group.id)} onChange={event => { setAgeGroups(current => event.target.checked ? [...current, group.id] : current.filter(value => value !== group.id)); markDirty(); clearError('ageGroups'); }} />{group.label}</label>)}
                </div>
                <FieldError message={errors.ageGroups} />
              </fieldset>
              <label><span className="mb-1.5 block text-xs font-bold text-slate-700">Material</span><input value={material} onChange={event => { setMaterial(event.target.value); markDirty(); }} className={fieldClassName} placeholder="e.g. ABS Plastic (BPA Free)" /></label>
              <label><span className="mb-1.5 block text-xs font-bold text-slate-700">Safety Notes</span><textarea rows={3} value={safetyInfo} onChange={event => { setSafetyInfo(event.target.value); markDirty(); }} className={fieldClassName} placeholder="Child-safe materials and relevant warnings" /></label>
            </div>
          </FormCard>

          <FormCard title="SEO Settings" icon={Search}>
            <div className="space-y-4">
              <label><span className="mb-1.5 block text-xs font-bold text-slate-700">SEO Title</span><input value={metaTitle} maxLength={70} onChange={event => { setMetaTitle(event.target.value); markDirty(); }} className={fieldClassName} placeholder={`${name || 'Product name'} – PlayBimboo`} /><span className={`mt-1 block text-right text-[10px] ${metaTitle.length > 60 ? 'text-amber-600' : 'text-slate-400'}`}>{metaTitle.length}/60 recommended · 70 max</span></label>
              <label><span className="mb-1.5 block text-xs font-bold text-slate-700">Meta Description</span><textarea rows={3} value={metaDescription} maxLength={180} onChange={event => { setMetaDescription(event.target.value); markDirty(); }} className={fieldClassName} placeholder="Short summary for search engines" /><span className={`mt-1 block text-right text-[10px] ${metaDescription.length > 160 ? 'text-amber-600' : 'text-slate-400'}`}>{metaDescription.length}/160 recommended · 180 max</span></label>
              <label><span className="mb-1.5 block text-xs font-bold text-slate-700">URL Slug</span><input value={slug} onChange={event => { const next = slugify(event.target.value); setSlug(next); setSlugManuallyEdited(next.length > 0); markDirty(); clearError('slug'); }} className={inputClass('slug')} placeholder="auto-generated-from-product-name" /><span className="mt-1 block break-all text-[10px] text-slate-400">/product/{slug || 'product-slug'}</span><FieldError message={errors.slug} /></label>
            </div>
          </FormCard>
        </aside>

        <div className="sticky bottom-4 z-20 flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur sm:flex-row sm:justify-end xl:col-span-2">
          <button type="button" disabled={isSaving} onClick={() => { void cancelEditing(); }} className="rounded-xl bg-slate-100 px-5 py-3 text-xs font-bold text-slate-700 disabled:opacity-50">Cancel</button>
          <button type="submit" disabled={isSaving || uploadingTarget !== null} className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500 px-6 py-3 text-xs font-bold text-white shadow-md transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60">{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{isSaving ? 'Saving…' : isEditing ? 'Update Product' : 'Save Product'}</button>
        </div>
      </form>
    </div>
      {categoryModalOpen && <CategoryFormModal compact categories={categories} onClose={() => setCategoryModalOpen(false)} onSave={addCategory} onSaved={created => { applyCategorySelection([...categoryIds, created.id]); showToast(`${created.name} added to this product.`, 'success'); }} />}
    </>
  );
};
