import React from "react";

export const Watermark = () => {
  return (
    <div className="jgi-watermark select-none" aria-hidden="true">
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="95" fill="#1a365d" />
        <text
          x="50%"
          y="52%"
          dominantBaseline="middle"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="60"
          fontFamily="Manrope, sans-serif"
          fontWeight="700"
        >
          JGi
        </text>
        <circle cx="155" cy="60" r="12" fill="#f59e0b" />
      </svg>
    </div>
  );
};

export const JGILogo = ({ size = 48, className = "" }) => {
  return (
    <svg 
      viewBox="0 0 200 200" 
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      className={className}
    >
      <circle cx="100" cy="100" r="95" fill="#1a365d" />
      <text
        x="50%"
        y="52%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="60"
        fontFamily="Manrope, sans-serif"
        fontWeight="700"
      >
        JGi
      </text>
      <circle cx="155" cy="60" r="12" fill="#f59e0b" />
    </svg>
  );
};
