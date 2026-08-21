import {
  AgeGroupCategory,
  Product,
  ProductAttribute,
  ProductVariation,
  ProductVariantOption,
  StockStatus
} from '../types';

type InventorySource = {
  trackInventory?: boolean;
  manageStock?: boolean;
  stockQuantity?: number | null;
  stockStatus?: StockStatus;
  inStock?: boolean;
};

export type NormalizedInventory = {
  trackInventory: boolean;
  stockQuantity?: number;
  stockStatus: StockStatus;
  inStock: boolean;
};

export const normalizeInventory = (source: InventorySource): NormalizedInventory => {
  const hasQuantity = source.stockQuantity !== undefined && source.stockQuantity !== null &&
    String(source.stockQuantity).trim() !== '' &&
    Number.isInteger(Number(source.stockQuantity)) && Number(source.stockQuantity) >= 0;
  const trackInventory = typeof source.trackInventory === 'boolean'
    ? source.trackInventory
    : typeof source.manageStock === 'boolean'
      ? source.manageStock
      : hasQuantity;
  if (trackInventory) {
    const stockQuantity = hasQuantity ? Number(source.stockQuantity) : 0;
    return {
      trackInventory: true,
      stockQuantity,
      stockStatus: stockQuantity > 0 ? 'in_stock' : 'out_of_stock',
      inStock: stockQuantity > 0
    };
  }
  const stockStatus: StockStatus = source.stockStatus === 'out_of_stock' || source.inStock === false
    ? 'out_of_stock'
    : 'in_stock';
  return { trackInventory: false, stockStatus, inStock: stockStatus === 'in_stock' };
};

export const isVariantOptionAvailable = (option: ProductVariantOption) =>
  normalizeInventory(option).inStock;

export const getEffectiveProductAvailability = (
  product: Product,
  selectedVariants?: Record<string, string>
) => {
  if (product.productType === 'variable' && product.variations && product.variations.length > 0) {
    if (selectedVariants && Object.keys(selectedVariants).length > 0) {
      const matched = product.variations.find(v => {
        if (!v.enabled) return false;
        return Object.entries(selectedVariants).every(([k, val]) => {
          if (v.attributes[k] === val) return true;
          const group = product.variants?.find(g => g.name === k);
          if (group) {
            const optId = group.options.find(o => o.name === val)?.id;
            const groupSlug = k.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            if (optId && v.attributes && v.attributes[groupSlug] === optId) return true;
          }
          return false;
        });
      });
      return matched ? normalizeInventory(matched).inStock : false;
    }
    return product.variations.some(v => v.enabled && normalizeInventory(v).inStock);
  }

  const groups = (product.variants || []).filter(group => group.options.length > 0);
  if (groups.length === 0) return normalizeInventory(product).inStock;
  return groups.every(group => {
    const selected = selectedVariants?.[group.name];
    return selected
      ? group.options.some(option => option.name === selected && isVariantOptionAvailable(option))
      : group.options.some(isVariantOptionAvailable);
  });
};

export const getEffectiveAvailableQuantity = (
  product: Product,
  selectedVariants?: Record<string, string>
): number | undefined => {
  if (product.productType === 'variable' && product.variations && product.variations.length > 0) {
    if (selectedVariants && Object.keys(selectedVariants).length > 0) {
      const matched = product.variations.find(v => {
        if (!v.enabled) return false;
        return Object.entries(selectedVariants).every(([k, val]) => {
          if (v.attributes[k] === val) return true;
          const group = product.variants?.find(g => g.name === k);
          if (group) {
            const optId = group.options.find(o => o.name === val)?.id;
            const groupSlug = k.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            if (optId && v.attributes && v.attributes[groupSlug] === optId) return true;
          }
          return false;
        });
      });
      if (matched) {
        const inv = normalizeInventory(matched);
        return inv.trackInventory ? inv.stockQuantity : undefined;
      }
    }
    const trackedQuantities = product.variations
      .filter(v => v.enabled)
      .map(normalizeInventory)
      .filter(inv => inv.trackInventory)
      .map(inv => inv.stockQuantity || 0);
    return trackedQuantities.length > 0 ? Math.max(...trackedQuantities) : undefined;
  }

  const groups = (product.variants || []).filter(group => group.options.length > 0);
  if (groups.length === 0) return normalizeInventory(product).stockQuantity;
  const selected = groups
    .map(group => group.options.find(option => option.name === selectedVariants?.[group.name]))
    .filter((option): option is ProductVariantOption => Boolean(option));
  if (selected.length !== groups.length) return undefined;
  const trackedQuantities = selected
    .map(normalizeInventory)
    .filter(inventory => inventory.trackInventory)
    .map(inventory => inventory.stockQuantity || 0);
  return trackedQuantities.length > 0 ? Math.min(...trackedQuantities) : undefined;
};

export const normalizeProductAgeGroups = (ageGroups: unknown, legacyAgeGroup?: unknown): AgeGroupCategory[] => {
  const submitted = Array.isArray(ageGroups) && ageGroups.length > 0
    ? ageGroups.map(String)
    : legacyAgeGroup ? [String(legacyAgeGroup)] : [];
  const normalized = submitted.flatMap(value =>
    value === '9-11' ? ['9-12'] : value === '8+' ? ['9-12', '13+'] : [value]
  );
  const supported = new Set<AgeGroupCategory>(['0-2', '3-5', '6-8', '9-12', '13+']);
  return [...new Set(normalized.filter((value): value is AgeGroupCategory => supported.has(value as AgeGroupCategory)))];
};

export const isProductVisibleOnStorefront = (product: Product): boolean =>
  product.isVisible !== false && product.status !== 'draft';

export const getProductDeliveryType = (product: Product) =>
  product.deliveryType || product.deliveryChargeType || 'store_threshold';

export const getProductAgeGroups = (product: Product): AgeGroupCategory[] =>
  normalizeProductAgeGroups(product.ageGroups, product.ageGroup);

export const formatProductAgeGroups = (product: Product) => {
  const groups = getProductAgeGroups(product);
  return groups.length ? `Ages ${groups.join(', ')}` : 'All ages';
};

export const getProductCategoryNames = (product: Product): string[] => {
  const values: unknown[] = Array.isArray(product.categoryNames) && product.categoryNames.length > 0
    ? product.categoryNames
    : product.category ? [product.category] : [];
  return [...new Set(values.map(value => {
    if (typeof value === 'string') return value.trim();
    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      return String(record.name || record.label || '').trim();
    }
    return '';
  }).filter(Boolean))];
};

export const formatProductCategories = (product: Product, limit = 1) => {
  const names = getProductCategoryNames(product);
  if (names.length === 0) return 'Uncategorized';
  const visible = names.slice(0, Math.max(1, limit));
  const remaining = names.length - visible.length;
  return `${visible.join(', ')}${remaining > 0 ? ` +${remaining}` : ''}`;
};


export const getVariationAttributeValue = (
  variation: Pick<ProductVariation, 'attributes'>,
  attribute: ProductAttribute
): string => {
  const candidates = [attribute.slug, attribute.id, attribute.globalAttributeId, attribute.name]
    .filter((candidate): candidate is string => Boolean(candidate));
  for (const key of candidates) {
    const value = variation.attributes?.[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
};

export const getAttributeTermLabel = (attribute: ProductAttribute, value: string): string => {
  const normalizedValue = String(value || '').trim();
  if (!normalizedValue) return '';
  const normalizedLower = normalizedValue.toLowerCase();
  const term = attribute.terms?.find(item =>
    [item.id, item.value, item.slug, item.label].some(candidate =>
      String(candidate || '').trim().toLowerCase() === normalizedLower
    )
  );
  return String(term?.label || term?.value || normalizedValue).trim();
};

export const getVariationDisplayLabel = (
  variation: ProductVariation,
  productAttributes: ProductAttribute[],
  index: number
): string => {
  if (!variation || !variation.attributes || Object.keys(variation.attributes).length === 0) {
    if (variation?.sku) return variation.sku;
    return `Variation ${index + 1}`;
  }

  const parts: string[] = [];
  const varAttrs = productAttributes.filter(a => a.usedForVariations);

  for (const attr of varAttrs) {
    const value = getVariationAttributeValue(variation, attr);
    const label = getAttributeTermLabel(attr, value);
    if (label) parts.push(`${attr.name}: ${label}`);
  }

  if (parts.length > 0) {
    return parts.join(' / ');
  }

  // 6. any remaining non-empty variation attribute values
  const allVals = Object.values(variation.attributes)
    .map(value => String(value || '').trim())
    .filter(Boolean);
  if (allVals.length > 0) {
    return allVals.map(String).join(' / ');
  }

  // 7. variation SKU
  if (variation.sku) return variation.sku;

  // 8. Variation ${index + 1}
  return `Variation ${index + 1}`;
};
