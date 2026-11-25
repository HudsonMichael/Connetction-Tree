import { useState } from 'react'
import { TOWNSHIPS } from '../data.js'

const twName = (t) => t.county + t.name

// 鄉鎮選擇：下拉＋關鍵字搜尋。note(t) 可回傳提示文字（僅提示，不擋）
export default function TownshipPicker({ value, onChange, note, placeholder = '輸入關鍵字搜尋，例：花蓮、壽豐' }) {
  const [kw, setKw] = useState('')
  const [open, setOpen] = useState(false)
  const hits = TOWNSHIPS.filter((t) => !kw || (twName(t) + t.id).includes(kw.trim()))
  return (
    <div className="tpick">
      <input value={open ? kw : value ? twName(value) : ''} placeholder={placeholder} onFocus={() => { setOpen(true); setKw('') }}
        onChange={(e) => { setKw(e.target.value); setOpen(true) }} onBlur={() => setTimeout(() => setOpen(false), 150)} />
      {value && !open && <button type="button" className="link tclear" onClick={() => onChange(null)}>清除</button>}
      {open && (
        <ul className="tlist">
          {hits.length === 0 && <li className="muted small">找不到符合的鄉鎮</li>}
          {hits.slice(0, 60).map((t) => (
            <li key={t.id} onMouseDown={() => { onChange(t); setOpen(false) }}>
              <span>{twName(t)}</span>{note && note(t) && <em>{note(t)}</em>}
            </li>
          ))}
          {hits.length > 60 && <li className="muted small">還有 {hits.length - 60} 筆，請輸入更多關鍵字</li>}
        </ul>
      )}
    </div>
  )
}
