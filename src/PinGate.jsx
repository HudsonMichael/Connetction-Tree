import { useState } from 'react'

// 展示用 PIN 閘門：防君子不防小人。PIN 寫在前端，只擋一般瀏覽，不是安全機制。
const PIN = 'R112569'
const KEY = 'demo-pin-ok'

export default function PinGate({ children }) {
  const [ok, setOk] = useState(() => sessionStorage.getItem(KEY) === '1')
  const [v, setV] = useState('')
  const [err, setErr] = useState(false)
  if (ok) return children
  const submit = (e) => {
    e.preventDefault()
    if (v.trim().toUpperCase() === PIN) { sessionStorage.setItem(KEY, '1'); setOk(true) }
    else { setErr(true); setV('') }
  }
  return (
    <div className="pingate">
      <form className="card pincard" onSubmit={submit}>
        <h2>人脈樹管理平台</h2>
        <p className="muted small">展示用原型（DEV）。請輸入業主提供的測試 PIN 碼後進入。</p>
        <label>測試 PIN 碼
          <input autoFocus value={v} onChange={(e) => { setV(e.target.value); setErr(false) }} placeholder="請輸入 PIN 碼" autoComplete="off" />
        </label>
        {err && <p className="small" style={{ color: '#b42318' }}>PIN 碼不正確，請再試一次。</p>}
        <button className="primary" type="submit" disabled={!v.trim()}>進入展示</button>
        <p className="small muted" style={{ marginTop: 12 }}>此頁僅為展示用的簡易門檻；展示資料皆為虛構。</p>
      </form>
    </div>
  )
}
