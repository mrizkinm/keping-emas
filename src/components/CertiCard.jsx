import React from 'react';

/**
 * Architectural Precision CertiCard Component
 * Quiet Luxury: Minimal, accurate proportions, no cartoonish glossy effects.
 */
const CertiCard = React.memo(function CertiCard({
  brand = 'antam',
  customBrand = '',
  weight = 1,
  serialNumber = '',
  size = 'md',
  className = ''
}) {
  const b = brand.toLowerCase();

  const dimensions = {
    sm: { width: 120, height: 180 },
    md: { width: 160, height: 240 },
    lg: { width: 220, height: 330 }
  }[size] || { width: 160, height: 240 };

  const numWeight = parseFloat(weight) || 1;

  // Ingot scaling (width x height) based on actual physical proportions
  let ingotW = 40;
  let ingotH = 56;
  if (numWeight <= 0.1) {
    ingotW = 24;
    ingotH = 30;
  } else if (numWeight <= 0.5) {
    ingotW = 30;
    ingotH = 40;
  } else if (numWeight <= 1) {
    ingotW = 38;
    ingotH = 52;
  } else if (numWeight <= 3) {
    ingotW = 46;
    ingotH = 64;
  } else if (numWeight <= 10) {
    ingotW = 56;
    ingotH = 78;
  } else if (numWeight <= 50) {
    ingotW = 68;
    ingotH = 96;
  } else {
    ingotW = 76;
    ingotH = 110;
  }

  const customName = (customBrand?.trim() || 'LAINNYA').toUpperCase();

  const brandMeta = {
    antam: {
      name: 'ANTAM',
      sub: 'LOGAM MULIA',
      accent: '#10B981'
    },
    ubs: {
      name: 'UBS GOLD',
      sub: 'FINE GOLD',
      accent: '#A855F7'
    },
    galeri24: {
      name: 'GALERI 24',
      sub: 'PEGADAIAN GROUP',
      accent: '#F43F5E'
    },
    hrta: {
      name: 'EMASKU®',
      sub: 'HARTADINATA',
      accent: '#EAB308'
    },
    other: {
      name: customName.slice(0, 15),
      sub: 'FINE GOLD 999.9',
      accent: '#D4A346'
    }
  }[b] || {
    name: (customName || brand.toUpperCase()).slice(0, 15),
    sub: 'FINE GOLD 999.9',
    accent: '#D4A346'
  };

  const cardW = 200;
  const cardH = 300;
  const cX = cardW / 2;
  const cY = cardH / 2 - 8;
  const ingotX = cX - ingotW / 2;
  const ingotY = cY - ingotH / 2;

  const reactId = React.useId().replace(/:/g, '_');
  const id = `cc_${reactId}_${b}_${String(weight).replace('.', '_')}`;

  return (
    <div
      className={`relative inline-block select-none ${className}`}
      style={{ width: dimensions.width, height: dimensions.height }}
    >
      <svg
        viewBox={`0 0 ${cardW} ${cardH}`}
        className="w-full h-full rounded-xl overflow-hidden"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Subtle satin metallic ingot gradient */}
          <linearGradient id={`${id}_gold`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5DF9E" />
            <stop offset="35%" stopColor="#DFB254" />
            <stop offset="70%" stopColor="#C99432" />
            <stop offset="100%" stopColor="#A8741B" />
          </linearGradient>

          {/* Minimal 1px inner bevel */}
          <linearGradient id={`${id}_bevel`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
          </linearGradient>
        </defs>

        {/* 1. Card Base */}
        <rect width={cardW} height={cardH} rx="12" fill="#16181A" />
        <rect
          x="0.5"
          y="0.5"
          width={cardW - 1}
          height={cardH - 1}
          rx="11.5"
          fill="none"
          stroke="#26292D"
          strokeWidth="1"
        />

        {/* Brand Accent Line Top */}
        <line
          x1="20"
          y1="22"
          x2="48"
          y2="22"
          stroke={brandMeta.accent}
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* 2. Brand Typography */}
        <text
          x={cardW - 20}
          y="26"
          textAnchor="end"
          fill="#F4F5F6"
          fontSize="11"
          fontWeight="700"
          letterSpacing="1.5"
          fontFamily="-apple-system, system-ui, sans-serif"
        >
          {brandMeta.name}
        </text>
        <text
          x={cardW - 20}
          y="37"
          textAnchor="end"
          fill="#8B9097"
          fontSize="7"
          fontWeight="500"
          letterSpacing="1"
          fontFamily="-apple-system, system-ui, sans-serif"
        >
          {brandMeta.sub}
        </text>

        {/* 3. Ingot Pocket (Precision Recessed Frame) */}
        <rect
          x={ingotX - 8}
          y={ingotY - 8}
          width={ingotW + 16}
          height={ingotH + 16}
          rx="6"
          fill="#0C0D0E"
          stroke="#26292D"
          strokeWidth="1"
        />

        {/* 4. Gold Ingot Body */}
        <rect
          x={ingotX}
          y={ingotY}
          width={ingotW}
          height={ingotH}
          rx="3"
          fill={`url(#${id}_gold)`}
        />
        <rect
          x={ingotX}
          y={ingotY}
          width={ingotW}
          height={ingotH}
          rx="3"
          fill={`url(#${id}_bevel)`}
          stroke="#FDF0CD"
          strokeOpacity="0.4"
          strokeWidth="0.5"
        />

        {/* Embossed Text on Ingot */}
        <g
          textAnchor="middle"
          fill="#533706"
          fontFamily="-apple-system, system-ui, sans-serif"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          <text
            x={cX}
            y={ingotY + (ingotH > 50 ? 14 : 10)}
            fontSize={ingotW > 45 ? '7' : '5'}
            fontWeight="700"
            letterSpacing="0.8"
          >
            {b === 'hrta' ? 'EMASKU' : b === 'other' ? (customBrand?.trim()?.slice(0, 8) || 'GOLD').toUpperCase() : b.toUpperCase()}
          </text>
          <text
            x={cX}
            y={cY + (ingotH > 60 ? 3 : 2)}
            fontSize={ingotW > 50 ? '11' : ingotW > 35 ? '9' : '7'}
            fontWeight="800"
          >
            {numWeight}g
          </text>
          <text
            x={cX}
            y={ingotY + ingotH - (ingotH > 50 ? 8 : 5)}
            fontSize={ingotW > 45 ? '6' : '4.5'}
            fontWeight="600"
            letterSpacing="0.5"
          >
            999.9
          </text>
        </g>

        {/* 5. Ingot Weight Specifier below pocket */}
        <text
          x={cX}
          y={ingotY + ingotH + 26}
          textAnchor="middle"
          fill="#F4F5F6"
          fontSize="11"
          fontWeight="600"
          fontFamily="-apple-system, system-ui, sans-serif"
          letterSpacing="0.5"
        >
          {numWeight} GRAM
        </text>
        <text
          x={cX}
          y={ingotY + ingotH + 37}
          textAnchor="middle"
          fill="#8B9097"
          fontSize="7.5"
          fontWeight="500"
          fontFamily="-apple-system, system-ui, sans-serif"
          letterSpacing="1.2"
        >
          FINE GOLD 999.9
        </text>

        {/* 6. Footer Divider & Micro Serial */}
        <line x1="20" y1={cardH - 32} x2={cardW - 20} y2={cardH - 32} stroke="#26292D" strokeWidth="1" />
        <text
          x="20"
          y={cardH - 18}
          fill="#565A61"
          fontSize="7"
          fontWeight="600"
          fontFamily="monospace"
        >
          CERTIEYE
        </text>
        <text
          x={cardW - 20}
          y={cardH - 18}
          textAnchor="end"
          fill="#8B9097"
          fontSize="7.5"
          fontWeight="500"
          fontFamily="monospace"
        >
          {serialNumber ? `SN: ${serialNumber}` : `ID: ${b.toUpperCase()}-${Math.round(numWeight * 10)}`}
        </text>
      </svg>
    </div>
  );
});

export default CertiCard;
