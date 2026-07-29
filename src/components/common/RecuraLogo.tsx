import React from 'react';

interface RecuraLogoProps {
  iconOnly?: boolean;
  className?: string;
  iconClassName?: string;
}

export const RecuraLogoIcon: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Black Outer Ring Arc */}
      <path
        d="M 68 14 C 40 2, 14 22, 8 50 C 2 78, 18 100, 46 106 C 72 111, 94 92, 98 66 C 99 62, 92 61, 91 65 C 87 86, 68 101, 46 97 C 24 92, 10 73, 15 50 C 20 26, 42 10, 66 20 C 70 22, 72 16, 68 14 Z"
        fill="#111827"
      />
      {/* Lower Blue Arc Swoosh */}
      <path
        d="M 14 52 C 17 70, 32 80, 52 73 C 66 68, 76 56, 83 43 C 73 56, 60 64, 46 66 C 28 69, 16 61, 14 52 Z"
        fill="#0066FF"
      />
      {/* Upper Blue Arrow & Swoosh */}
      <path
        d="M 20 44 C 28 33, 46 26, 66 33 L 70 18 L 84 50 L 50 46 L 63 37 C 46 32, 30 38, 20 44 Z"
        fill="#0066FF"
      />
      {/* Sparkle 4-Point Star Top Right */}
      <path
        d="M 84 6 C 84 12, 87 15, 93 15 C 87 15, 84 18, 84 24 C 84 18, 81 15, 75 15 C 81 15, 84 12, 84 6 Z"
        fill="#0066FF"
      />
    </svg>
  );
};

export const RecuraWordmark: React.FC<{ className?: string }> = ({ className = "text-2xl" }) => {
  return (
    <div className={`inline-flex items-center tracking-tight font-extrabold ${className}`}>
      <span className="text-[#0066FF] font-sans">R</span>
      <span className="text-[#111827] font-sans">ecura</span>
    </div>
  );
};

export const RecuraLogo: React.FC<RecuraLogoProps> = ({
  iconOnly = false,
  className = "",
  iconClassName = "w-10 h-10",
}) => {
  if (iconOnly) {
    return <RecuraLogoIcon className={iconClassName} />;
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <RecuraLogoIcon className={iconClassName} />
      <RecuraWordmark />
    </div>
  );
};
