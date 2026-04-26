import { calcConnectors, Layout } from "./zigzag-layout";

interface SvgConnectorsProps {
  layout: Layout;
}

export function SvgConnectors({ layout }: SvgConnectorsProps) {
  const connectors = calcConnectors(layout);

  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: layout.totalWidth,
        height: layout.totalHeight,
        pointerEvents: "none",
      }}
    >
      <defs>
        <marker
          id="zzArrow"
          markerWidth="6"
          markerHeight="6"
          refX="3"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6 Z" fill="rgba(0,0,0,0.18)" />
        </marker>
      </defs>

      {/* Bezier connector paths */}
      {connectors.map((c, i) => (
        <path
          key={`path-${i}`}
          d={c.path}
          fill="none"
          stroke="rgba(0,0,0,0.14)"
          strokeWidth="1.5"
          strokeDasharray={c.dashed ? "4 3" : "none"}
          markerEnd="url(#zzArrow)"
        />
      ))}

      {/* Step number dots at midpoints */}
      {connectors.map((c, i) => (
        <g key={`dot-${i}`}>
          <circle
            cx={c.midpoint.x}
            cy={c.midpoint.y}
            r={9}
            fill="white"
            stroke="rgba(0,0,0,0.1)"
            strokeWidth={1}
          />
          <text
            x={c.midpoint.x}
            y={c.midpoint.y + 3.5}
            textAnchor="middle"
            fill="rgba(0,0,0,0.3)"
            style={{
              fontSize: 8,
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
            }}
          >
            {i + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}
