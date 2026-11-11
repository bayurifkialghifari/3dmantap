import type { ProductTemplate } from '@3dmantap/shared';
export function ProductIllustration({ template: t }: { template: ProductTemplate }) {
  const color = t.color;
  return (
    <svg viewBox="0 0 320 270" className="product-illustration" aria-label={t.name} role="img">
      <defs>
        <filter id={'shadow-' + t.id}>
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <linearGradient id={'paint-' + t.id} x1="0" x2="1" y1="0" y2="1">
          <stop stopColor={color} />
          <stop offset="1" stopColor={color} stopOpacity=".7" />
        </linearGradient>
      </defs>
      <ellipse
        cx="160"
        cy="232"
        rx="78"
        ry="10"
        fill="#344b3e"
        opacity=".12"
        filter={'url(#shadow-' + t.id + ')'}
      />
      <g fill={'url(#paint-' + t.id + ')'} stroke="#28372d" strokeWidth="1.4" strokeOpacity=".15">
        {['shirt', 'hoodie', 'jacket'].includes(t.modelKind) ? (
          <>
            <path d="M113 50 135 41Q160 57 185 41L207 50 246 98 213 127 196 103 201 218Q160 228 119 218L124 103 107 127 74 98Z" />
            <path d="M137 42Q160 86 183 42" fill="none" strokeWidth="5" />
            <path d="m128 102-8 111m73-111 8 111" fill="none" />
            {t.modelKind === 'hoodie' && <path d="M136 47q-20-51 24-47 44-4 24 47" />}
            {t.modelKind === 'jacket' && <path d="M160 65v153m-36-86h29m15 0h28" fill="none" />}
            <path d="M144 116h32v30h-32z" fill="#fff" opacity=".1" />
          </>
        ) : t.modelKind === 'pants' ? (
          <>
            <path d="M112 42h96l-7 89 2 96h-41l-5-102-8 102h-42l5-96Z" />
            <path d="M111 53h96m-49 0v68m-38-61q0 27-11 35m83-35q0 27 14 35" fill="none" />
          </>
        ) : t.modelKind === 'cap' ? (
          <>
            <path d="M94 155q-5-103 71-103 72 0 76 101Z" />
            <path d="M96 155q51-19 144-2l-59 48q-62-1-93-18Z" />
            <path d="M164 53v96m-16-94q-22 44-20 95" fill="none" />
          </>
        ) : t.modelKind === 'shoe' ? (
          <>
            <path d="m88 165 13-75 47-6 30 54 64 26q26 6 23 36H81Z" />
            <path d="M82 194h184v20H80Z" fill="#faf9f4" />
            <path d="m125 110 44 6m-42 13 50 3m-46 13 53 2" stroke="#f6f5ef" strokeWidth="7" />
          </>
        ) : t.modelKind === 'bag' ? (
          <>
            <path d="M111 93q0-63 50-63 48 0 48 63" fill="none" stroke={color} strokeWidth="13" />
            <path d="M94 85h137l8 145H85Z" />
            <path d="m105 100-5 110m120-110 6 110" fill="none" />
          </>
        ) : t.modelKind === 'desk' ? (
          <>
            <path d="m69 107 147-31 55 29-149 35Z" />
            <path d="m78 110 19 5v109l-19-9Zm155 3 22-5v109l-22 7Z" />
            <path d="m122 140 149-35v12l-149 36Z" fill="#684f39" opacity=".5" />
          </>
        ) : ['door', 'panel'].includes(t.modelKind) ? (
          <>
            <path d="m106 41 116-15v189l-116 17Z" />
            <path d="m222 26 9 6v183l-9 0Z" />
            <path d="m122 62 83-9v67l-83 9Zm0 79 83-9v67l-83 10Z" fill="none" />
            <circle cx="195" cy="138" r="4" fill="#3a3932" />
          </>
        ) : (
          <>
            <path d="m85 48 145-18v183l-145 24Z" />
            <path d="m230 30 27 21v166l-27-4Z" fill="#6e5b45" opacity=".7" />
            <path d="m85 48 26 15 146-12-27-21Z" fill="#e8d6b9" />
            <path d="m98 68 120-14v145l-120 20Z" fill="#423a2c" opacity=".25" />
            {t.modelKind === 'shelf' ? (
              <>
                <path
                  d="m100 107 119-16m-119 53 119-17m-119 54 119-19M157 61v148"
                  fill="none"
                  stroke={color}
                  strokeWidth="9"
                />
                <rect x="112" y="84" width="12" height="21" fill="#eee5d6" />
                <rect x="129" y="79" width="9" height="24" fill="#a2b4a0" />
              </>
            ) : (
              <>
                <path d="m100 69 37-4v147l-37 7Zm40-5 36-5v146l-36 7Zm39-5 40-5v145l-40 7Z" />
                <path d="m132 120 0 27m40-30v26m42-32v26" stroke="#76634b" strokeWidth="3" />
              </>
            )}
          </>
        )}
      </g>
    </svg>
  );
}
