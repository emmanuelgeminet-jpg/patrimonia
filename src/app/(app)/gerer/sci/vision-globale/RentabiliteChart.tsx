export type PointRentabilite = { lot: string; rentabiliteBrute: number };

export default function RentabiliteChart({ points }: { points: PointRentabilite[] }) {
  const width = 612;
  const height = 155;
  const padLeft = 15;
  const padRight = 15;
  const chartBottom = 120;
  const chartTop = 15;
  const maxValue = Math.max(1, ...points.map((p) => p.rentabiliteBrute));

  const usableWidth = width - padLeft - padRight;
  const groupWidth = usableWidth / points.length;
  const barWidth = Math.min(40, groupWidth * 0.5);
  const scaleY = (v: number) => chartBottom - (v / maxValue) * (chartBottom - chartTop);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
      <line x1={padLeft} y1={chartBottom} x2={width - padRight} y2={chartBottom} stroke="#DEDACE" strokeWidth="1" />
      {points.map((p, i) => {
        const x = padLeft + i * groupWidth + (groupWidth - barWidth) / 2;
        const y = scaleY(p.rentabiliteBrute);
        return (
          <g key={p.lot}>
            <rect x={x} y={y} width={barWidth} height={chartBottom - y} fill="#5C7A5B" />
            <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="10" fill="#22261F">
              {p.rentabiliteBrute.toFixed(1)} %
            </text>
            <text x={x + barWidth / 2} y={136} textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="9" fill="#5B5F53">
              {p.lot}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
