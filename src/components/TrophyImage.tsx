import React, { useState } from 'react';
import { TROPHY_BASE64 } from '../assets/trophyData';

interface TrophyImageProps {
  className?: string;
  imageClassName?: string;
}

export const TrophyImage: React.FC<TrophyImageProps> = ({
  className = '',
  imageClassName = '',
}) => {
  const [imgSrc, setImgSrc] = useState<string>(TROPHY_BASE64 || '/Trophy.png');

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <img
        src={imgSrc}
        alt="Trophy"
        decoding="async"
        loading="eager"
        onError={() => {
          if (imgSrc !== TROPHY_BASE64) {
            setImgSrc(TROPHY_BASE64);
          } else if (imgSrc !== '/Trophy.png') {
            setImgSrc('/Trophy.png');
          }
        }}
        className={`w-full h-full object-contain drop-shadow-sm ${imageClassName}`}
      />
    </div>
  );
};

export default TrophyImage;

