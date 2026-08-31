import React from 'react';

interface CoinIconProps {
  className?: string;
  size?: number | string;
}

export default function CoinIcon({ className = 'w-5 h-5', size }: CoinIconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block select-none shrink-0 ${className}`}
      style={size ? { width: size, height: size } : undefined}
    >
      {/* Outer black edge / shadow border */}
      <circle cx="16" cy="16" r="14.5" fill="#B45309" stroke="#000000" strokeWidth="2.5" />
      
      {/* Gold coin surface */}
      <circle cx="16" cy="16" r="12.5" fill="#F59E0B" />
      
      {/* Inner embossed bevel ridge */}
      <circle cx="16" cy="16" r="10" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5" />
      
      {/* Embossed football/star coin emblem */}
      <path
        d="M16 9.5L18 13.5L22.5 14.1L19.2 17.3L20 21.8L16 19.6L12 21.8L12.8 17.3L9.5 14.1L14 13.5L16 9.5Z"
        fill="#FEF08A"
        stroke="#78350F"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      
      {/* Top light sheen arc */}
      <path
        d="M10 9C11.6 7.8 13.7 7.2 16 7.2C18.3 7.2 20.4 7.8 22 9"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}
