export const Stat = ({ label, value, sub, onClick }) => (
  <div className={'stat' + (onClick ? ' click' : '')} onClick={onClick}>
    <div className="muted">{label}</div><div className="big">{value}</div>{sub && <div className="small muted">{sub}</div>}
  </div>
)
export const Bar = ({ pct, color }) => (
  <div className="bar"><i style={{ width: Math.min(100, pct) + '%', background: color }} /></div>
)
// 固定畫布大小：不論有幾根柱子（日／週／月／年），圖的尺寸、字級、柱寬上限都一致
const W = 840
export function BarChart({ data, k = 'n', h = 140 }) {
  const max = Math.max(1, ...data.map((d) => d[k]))
  const slot = W / data.length
  const bw = Math.min(40, slot * 0.6)
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${h + 44}`} style={{ display: 'block' }}>
      <g transform="translate(0,16)">
        <line x1="0" x2={W} y1={h + 4} y2={h + 4} stroke="#dbe6e6" />
        {data.map((d, i) => {
          const bh = Math.max(2, (d[k] / max) * h)
          const cx = i * slot + slot / 2
          return (
            <g key={i}>
              <rect x={cx - bw / 2} y={h + 4 - bh} width={bw} height={bh} rx="4" fill="#0f8b8d" />
              {data.length <= 14 && <text x={cx} y={h - bh} textAnchor="middle" fontSize="12" fill="#134e4a">{d[k]}</text>}
              {i % Math.ceil(data.length / 14) === 0 && <text x={cx} y={h + 22} textAnchor="middle" fontSize="12" fill="#6b7280">{d.label ?? d.month}</text>}
            </g>
          )
        })}
      </g>
    </svg>
  )
}
