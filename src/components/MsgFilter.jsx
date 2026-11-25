// 訊息篩選列：關鍵字＋日期區間（children 放額外條件）
export default function MsgFilter({ f, setF, children }) {
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  return (
    <div className="card filters msgfilter">
      <input placeholder="關鍵字（主旨、內容、寄件人）" value={f.q} onChange={set('q')} />
      <label className="small">從<input type="date" value={f.from} onChange={set('from')} /></label>
      <label className="small">到<input type="date" value={f.to} onChange={set('to')} /></label>
      {children}
      {(f.q || f.from || f.to) && <button className="link" onClick={() => setF({ ...f, q: '', from: '', to: '' })}>清除篩選</button>}
    </div>
  )
}
