"use client";
import React from 'react';
import { Product } from '../../types';
import { getSafeImageSrc } from '../../utils/images';

const normalizeLegacyTemplateHtml = (html: string) =>
  html.replace(
    /(<div\b[^>]*class=["'][^"']*\bpb-eyebrow\b[^"']*["'][^>]*>[\s\S]*?<\/div>)\s*([\s\S]*?)\s*(<p\b[^>]*class=["'][^"']*\bpb-lede\b)/i,
    (match, eyebrow: string, heading: string, lede: string) =>
      /^\s*<h[12]\b/i.test(heading) ? match : `${eyebrow}<h2>${heading.trim()}</h2>${lede}`
  );

const productDetailPolishCss = `
  .product-custom-content[data-product-slug] .pb-desc {
    margin-left: -16px;
    margin-right: -16px;
  }
  @media (min-width: 640px) {
    .product-custom-content[data-product-slug] .pb-desc {
      margin-left: -24px;
      margin-right: -24px;
    }
  }
  .product-custom-content[data-product-slug] .pb-desc .pb-hero {
    padding: 40px 24px 44px;
  }
  .product-custom-content[data-product-slug] .pb-desc .pb-hero-inner {
    font-size: clamp(2rem, 4vw, 2.75rem);
    font-weight: 800;
    line-height: 1.15;
  }
  .product-custom-content[data-product-slug] .pb-desc .pb-eyebrow {
    margin-bottom: 16px;
  }
  .product-custom-content[data-product-slug] .pb-desc .pb-hero h2 {
    font-size: inherit;
    margin-bottom: 14px;
  }
  .product-custom-content[data-product-slug] .pb-desc .pb-hero p.pb-lede {
    margin-bottom: 20px;
    font-size: 16px;
    line-height: 1.6;
  }
  .product-custom-content[data-product-slug] .pb-desc .pb-snap {
    height: 44px;
  }
  .product-custom-content[data-product-slug] .pb-desc .pb-hero-badges {
    gap: 10px;
  }
  .product-custom-content[data-product-slug] .pb-desc .pb-hero-badge {
    padding: 8px 14px;
    font-size: 13px;
  }
  .product-custom-content[data-product-slug] .pb-desc .pb-banner {
    padding: 30px 24px;
  }
  .product-custom-content[data-product-slug] .pb-desc .pb-banner h2 {
    font-size: 28px;
  }
  .product-custom-content[data-product-slug] .pb-desc .pb-section {
    padding: 48px 24px;
  }
  .product-custom-content[data-product-slug] .pb-desc .pb-section-head {
    margin-bottom: 28px;
  }
  .product-custom-content[data-product-slug] .pb-desc .pb-section-head h3 {
    font-size: 27px;
  }
  .product-custom-content[data-product-slug] .pb-desc .pb-features-grid,
  .product-custom-content[data-product-slug] .pb-desc .pb-sizes-grid,
  .product-custom-content[data-product-slug] .pb-desc .pb-two-col {
    gap: 16px;
  }
  .product-custom-content[data-product-slug] .pb-desc .pb-feature-card {
    padding: 20px;
  }
  .product-custom-content[data-product-slug] .pb-desc .pb-feature-icon {
    width: 44px;
    height: 44px;
    margin-bottom: 12px;
    font-size: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .product-custom-content[data-product-slug] .pb-desc .pb-feature-icon svg {
    width: 24px;
    height: 24px;
  }
  .product-custom-content[data-product-slug] .pb-desc .pb-size-card {
    padding: 24px;
  }
  .product-custom-content[data-product-slug] .pb-desc .pb-info-card {
    padding: 24px;
  }
  .product-custom-content[data-product-slug] .pb-desc .pb-info-card li {
    padding: 6px 0;
  }
  .product-custom-content[data-product-slug] .pb-desc .pb-age-banner {
    gap: 16px;
    padding: 20px 24px;
  }
  .product-custom-content[data-product-slug] .pb-desc .pb-age-icon {
    width: 48px;
    height: 48px;
    font-size: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .product-custom-content[data-product-slug] .pb-desc .pb-age-icon svg {
    width: 28px;
    height: 28px;
  }
  .product-custom-content[data-product-slug] .pb-desc .pb-gift-grid {
    gap: 10px;
  }
  .product-custom-content[data-product-slug] .pb-desc .pb-gift-pill {
    padding: 10px 16px;
    font-size: 14px;
  }
  .product-custom-content[data-product-slug] .pb-desc .pb-closing {
    padding: 42px 24px;
  }
  @media (max-width: 640px) {
    .product-custom-content[data-product-slug] .pb-desc .pb-hero {
      padding: 32px 16px 36px;
    }
    .product-custom-content[data-product-slug] .pb-desc .pb-hero-inner {
      font-size: 1.875rem;
    }
    .product-custom-content[data-product-slug] .pb-desc .pb-eyebrow {
      padding: 7px 12px;
      font-size: 11px;
      letter-spacing: 1.25px;
    }
    .product-custom-content[data-product-slug] .pb-desc .pb-hero p.pb-lede {
      font-size: 15px;
    }
    .product-custom-content[data-product-slug] .pb-desc .pb-banner {
      padding: 26px 16px;
    }
    .product-custom-content[data-product-slug] .pb-desc .pb-banner h2 {
      font-size: 23px;
    }
    .product-custom-content[data-product-slug] .pb-desc .pb-section {
      padding: 34px 16px;
    }
    .product-custom-content[data-product-slug] .pb-desc .pb-section-head {
      margin-bottom: 22px;
    }
    .product-custom-content[data-product-slug] .pb-desc .pb-section-head h3 {
      font-size: 24px;
    }
    .product-custom-content[data-product-slug] .pb-desc .pb-feature-card,
    .product-custom-content[data-product-slug] .pb-desc .pb-size-card,
    .product-custom-content[data-product-slug] .pb-desc .pb-info-card {
      padding: 18px;
    }
    .product-custom-content[data-product-slug] .pb-desc .pb-age-banner {
      align-items: flex-start;
      gap: 12px;
      padding: 18px;
    }
    .product-custom-content[data-product-slug] .pb-desc .pb-closing {
      padding: 34px 18px;
    }
    .product-custom-content[data-product-slug] .pb-desc .pb-closing h3 {
      font-size: 25px;
    }
  }
`;

export const ProductDetailContent: React.FC<{ product: Product }> = ({ product }) => {
  const blocks = (product.productDetailBlocks || [])
    .filter(block => block.enabled)
    .sort((a, b) => a.order - b.order);
  if (blocks.length === 0) return null;

  return (
    <section
      className="product-custom-content space-y-6"
      data-product-slug={product.slug}
      aria-label="Additional product information"
    >
      {product.productDetailCustomCss && <style>{product.productDetailCustomCss}</style>}
      <style>{productDetailPolishCss}</style>
      {blocks.map(block => {
        const width = block.settings?.width === 'medium' ? 'max-w-3xl' : block.settings?.width === 'large' ? 'max-w-5xl' : 'max-w-none';
        const alignment = block.settings?.alignment === 'left' ? 'mr-auto text-left' : block.settings?.alignment === 'right' ? 'ml-auto text-right' : 'mx-auto text-center';
        if (block.type === 'divider') return <hr key={block.id} className="border-slate-200" />;
        if (block.type === 'image' && block.image) return (
          <figure key={block.id} className={`${width} ${alignment}`}>
            <img src={getSafeImageSrc(block.image.secureUrl)} alt={block.image.alt || ''} loading="lazy" className="h-auto max-w-full rounded-2xl object-contain" />
            {block.image.caption && <figcaption className="mt-2 text-xs text-slate-500">{block.image.caption}</figcaption>}
          </figure>
        );
        return (
          <article key={block.id} className={`${width} ${alignment} overflow-x-auto`}>
            {block.heading && (
              <h2 className="mb-3 font-heading text-2xl font-black text-slate-900">
                {(() => {
                  const match = block.heading.match(/^(\S+)\s+(.+)$/);
                  // Check if the first word is just an emoji
                  if (match && /\p{Emoji}/u.test(match[1])) {
                    return (
                      <span className="inline-flex items-center gap-2">
                        <span className="shrink-0 leading-none">{match[1]}</span>
                        <span>{match[2]}</span>
                      </span>
                    );
                  }
                  return block.heading;
                })()}
              </h2>
            )}
            <div
              className="space-y-3 text-sm leading-7 text-slate-700 [&_a]:text-sky-600 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-slate-200 [&_blockquote]:pl-4 [&_img]:h-auto [&_img]:max-w-full [&_ol]:list-decimal [&_ol]:pl-6 [&_table]:min-w-full [&_td]:border [&_td]:p-2 [&_th]:border [&_th]:p-2 [&_ul]:list-disc [&_ul]:pl-6"
              dangerouslySetInnerHTML={{ __html: normalizeLegacyTemplateHtml(block.content || '') }}
            />
          </article>
        );
      })}
    </section>
  );
};
