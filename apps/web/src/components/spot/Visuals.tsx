// Decorative SVG illustrations + map
export function SpotLogo({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <path
        d="M32 6c-11 0-20 8.7-20 19.4 0 14.6 18.5 31.4 19.3 32.1.4.4 1 .4 1.4 0C33.5 56.8 52 40 52 25.4 52 14.7 43 6 32 6z"
        fill="#E76F51"
      />
      <circle cx="32" cy="25" r="7" fill="#FEF3E2" />
      <circle cx="32" cy="25" r="3" fill="#264653" />
      <path
        d="M14 50c4 4 11 6 18 6s14-2 18-6"
        stroke="#264653"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="1 4"
        fill="none"
      />
    </svg>
  );
}

export function HandRain({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M6 13c-1.5-2 0-5 2-5 .5-2 3-3 5-2 1-2 4-2 5 0 2 0 3 2 2 4 1 1 1 3 0 4H6z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M9 18l-1 2M13 18l-1 2M17 18l-1 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function MapStylized({ children }: { children?: React.ReactNode }) {
  return (
    <div className="relative w-full h-full spot-map spot-map-streets overflow-hidden">
      {/* Park */}
      <div className="absolute left-6 top-16 w-32 h-24 rounded-3xl bg-[oklch(0.85_0.07_140)] opacity-70" />
      {/* River */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 393 600" preserveAspectRatio="none">
        <path
          d="M-20 380 Q 100 320 200 360 T 420 300"
          stroke="oklch(0.8 0.06 220)"
          strokeWidth="22"
          fill="none"
          opacity="0.6"
        />
      </svg>
      {/* Building blocks */}
      <div className="absolute right-8 top-24 w-16 h-16 rounded-md bg-white/60 rotate-12" />
      <div className="absolute right-16 bottom-32 w-20 h-12 rounded-md bg-white/50 -rotate-6" />
      <div className="absolute left-20 bottom-20 w-14 h-20 rounded-md bg-white/55 rotate-3" />
      {children}
    </div>
  );
}

export function HandPin({
  color = "#E76F51",
  label,
  pulsing = false,
}: {
  color?: string;
  label?: string;
  pulsing?: boolean;
}) {
  return (
    <div className="relative flex flex-col items-center">
      {pulsing && (
        <span
          className="absolute top-2 w-10 h-10 rounded-full pulse-ring"
          style={{ background: color }}
        />
      )}
      <svg width="36" height="44" viewBox="0 0 36 44" className="relative drop-shadow-md">
        <path
          d="M18 2C9.7 2 3 8.5 3 16.5c0 11 13 24.5 14 25.4.6.5 1.4.5 2 0 1-.9 14-14.4 14-25.4C33 8.5 26.3 2 18 2z"
          fill={color}
          stroke="#264653"
          strokeWidth="1.5"
        />
        <circle cx="18" cy="16" r="5" fill="#FEF3E2" />
      </svg>
      {label && (
        <span className="mt-1 px-2 py-0.5 rounded-full bg-white/95 text-[10px] font-semibold text-[var(--forest)] shadow whitespace-nowrap">
          {label}
        </span>
      )}
    </div>
  );
}

export function QrCode({ size = 220, withLogo = false }: { size?: number; withLogo?: boolean }) {
  // Stylized but dense QR-like matrix
  const cells = 29;
  const rng = (i: number) => {
    const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  const cellSize = size / cells;
  const dots: React.ReactNode[] = [];
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      // Skip finder regions
      const inFinder =
        (r < 8 && c < 8) ||
        (r < 8 && c > cells - 9) ||
        (r > cells - 9 && c < 8);
      if (inFinder) continue;
      const timing = (r === 6 || c === 6) && r > 7 && c > 7 && (r + c) % 2 === 0;
      const structured = ((r * 3 + c * 5) % 11 === 0) || ((r + c * 2) % 13 === 0);
      const denseNoise = rng(r * cells + c + 17) > 0.43;
      if (timing || structured || denseNoise) {
        dots.push(
          <rect
            key={`${r}-${c}`}
            x={c * cellSize}
            y={r * cellSize}
            width={cellSize * 0.96}
            height={cellSize * 0.96}
            rx={cellSize * 0.06}
            fill="var(--forest)"
          />
        );
      }
    }
  }
  // Finder pattern matching screenshot: terracotta outer ring, cream gap, dark inner block
  const finder = (x: number, y: number) => (
    <g transform={`translate(${x},${y})`}>
      <rect width={cellSize * 7} height={cellSize * 7} rx={cellSize * 0.14} fill="var(--terracotta)" />
      <rect
        x={cellSize}
        y={cellSize}
        width={cellSize * 5}
        height={cellSize * 5}
        rx={cellSize * 0.08}
        fill="var(--cream)"
      />
      <rect
        x={cellSize * 2}
        y={cellSize * 2}
        width={cellSize * 3}
        height={cellSize * 3}
        rx={cellSize * 0.06}
        fill="var(--forest)"
      />
    </g>
  );

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect width={size} height={size} rx="14" fill="var(--cream)" />
      {dots}
      {finder(0, 0)}
      {finder(size - cellSize * 7, 0)}
      {finder(0, size - cellSize * 7)}
      <g transform={`translate(${cellSize * 20},${cellSize * 20})`}>
        <rect width={cellSize * 5} height={cellSize * 5} rx={cellSize * 0.08} fill="var(--forest)" />
        <rect x={cellSize} y={cellSize} width={cellSize * 3} height={cellSize * 3} rx={cellSize * 0.06} fill="var(--cream)" />
        <rect x={cellSize * 2} y={cellSize * 2} width={cellSize} height={cellSize} rx={cellSize * 0.04} fill="var(--forest)" />
      </g>
      {withLogo && (
        <>
          <circle cx={size / 2} cy={size / 2} r={cellSize * 2.6} fill="#FEF3E2" />
          <circle cx={size / 2} cy={size / 2} r={cellSize * 2} fill="#E76F51" />
          <text
            x={size / 2}
            y={size / 2 + cellSize * 0.6}
            textAnchor="middle"
            fontFamily="serif"
            fontWeight="700"
            fontSize={cellSize * 2.4}
            fill="#FEF3E2"
          >
            S
          </text>
        </>
      )}
    </svg>
  );
}
