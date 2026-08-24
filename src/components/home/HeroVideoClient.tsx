import React from 'react';
import Image from 'next/image';

export const HeroVideoClient: React.FC = () => {
  return (
    <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-[#E2F1F8]">
      <Image
        src="/herowebp-mobile.webp"
        alt="Play Bimboo Hero"
        fill
        priority
        unoptimized
        className="object-cover object-[42%_center]"
        sizes="100vw"
      />
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover object-[42%_center]"
      >
        <source media="(min-width: 1024px)" src="https://res.cloudinary.com/dn2bcvcvg/video/upload/v1786438386/newplaybimboo_xfnt47.mp4" type="video/mp4" />
      </video>
    </div>
  );
};
