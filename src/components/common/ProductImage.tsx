"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import { getSafeImageSrc } from '../../utils/images';

interface ProductImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  width?: number;
  height?: number;
  crop?: string;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  className = '',
  wrapperClassName = '',
  loading = 'lazy',
  width,
  height,
  crop,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const safeSrc = getSafeImageSrc(src, { width, height, crop });

  return (
    <div className={`relative overflow-hidden ${wrapperClassName}`}>
      {/* Skeleton loader shown while image is loading */}
      <div 
        className={`absolute inset-0 bg-slate-200 animate-pulse transition-opacity duration-300 ${isLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      />
      
      {/* Actual image */}
      <Image
        src={safeSrc}
        alt={alt}
        fill
        sizes={props.sizes || "(max-width: 768px) 100vw, 50vw"}
        priority={loading === 'eager'}
        onLoad={() => setIsLoaded(true)}
        className={`object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
      />
    </div>
  );
};

