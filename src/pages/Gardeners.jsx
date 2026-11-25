import { useState } from 'react'
import { GARDENERS, CIRCLES, MAX_CIRCLES, addGardener, openCircle, setCircleStatus, circleStats, coveredSet, downloadCSV, logAudit } from '../data.js'
import { Stat } from '../components/ui.jsx'

// 平台管理：系統管理者只管租戶（園丁帳號、園區的開通與停用），只看得到統計數量。
// 看不到園區的名稱、成員與內容，也不能匯出成員名單（只能匯出園丁報表）；與園丁權限不重疊。
export default function Gardeners({ bump }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [made, setMade] = useState(null)
  const [msg, setMsg] = useState('')
  const create = (e) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    setMade(addGardener(name.trim(), email.trim())); setName(''); setEmail(''); bump()
  }
  const open = (g) => { const r = openCircle(g.id, `${g.name.replace('（園丁）', '')}的園區 ${CIRCLES.filter((c) => c.owner === g.id).length + 1}`); setMsg(r.msg); bump() }
  const people = CIRCLES.reduce((s, c) => s + circleStats(c).people, 0)
  const exportReport = () => downloadCSV('園丁報表.csv', [['園丁', 'Email', '園區數', '成員合計（啟用）', '覆蓋鄉鎮數（各園區加總）', '建立日期', '狀態'],
    ...GARDENERS.map((g) => { const own = CIRCLES.filter((c) => c.owner === g.id); return [g.name, g.email, own.length, own.reduce((s, c) => s + circleStats(c).people, 0), own.reduce((s, c) => s + coveredSet(c).size, 0), g.created, g.status] })])
  return (
    <div className="platformpage">
      <h2>園丁與園區</h2>
      <p className="muted">平台管理功能。系統管理者與園丁的權限不重疊：這裡只管租戶（開立與停用園丁帳號、開通加開園區、停用園區），<b>只看得到統計數量</b>，看不到園區的名稱、成員與內容；可匯出園丁報表，但<b>不能匯出成員名單</b>。</p>
      <div className="grid4">
        <Stat label="園丁（租戶）" value={GARDENERS.length} />
        <Stat label="園區" value={CIRCLES.length} />
        <Stat label="園區成員合計" value={people} sub="啟用中，不含園丁" />
        <Stat label="申請加開" value={GARDENERS.filter((g) => g.request).length} sub="等待開通" />
      </div>
      <div className="toolbar"><button onClick={exportReport}>匯出園丁報表（CSV）</button><span className="small muted">只含數字與租戶資料，不含成員名單</span></div>
      {msg && <div className="msgbox">{msg}</div>}
      <section className="card">
        <table>
          <thead><tr><th>園丁</th><th>Email</th><th>園區</th><th>成員合計</th><th>覆蓋鄉鎮數（各園區加總）</th><th>建立</th><th>狀態</th><th></th></tr></thead>
          <tbody>{GARDENERS.map((g) => {
            const own = CIRCLES.filter((c) => c.owner === g.id)
            const cov = own.reduce((s, c) => s + coveredSet(c).size, 0)
            return (
              <tr key={g.id}>
                <td><b>{g.name}</b></td><td>{g.email}</td>
                <td>
                  {own.map((c, i) => (
                    <div key={c.id} className="small">園區 {i + 1}（{circleStats(c).people} 人）<span className={'pill st-' + c.status}>{c.status}</span>
                      <button className="link" onClick={() => { setCircleStatus(c.id, c.status === '啟用' ? '停用' : '啟用'); bump() }}>{c.status === '啟用' ? '停用園區' : '恢復園區'}</button></div>
                  ))}
                  <div className="small">{g.request && <span className="pill planned">申請加開</span>} <button className="link" disabled={own.length >= MAX_CIRCLES} onClick={() => open(g)}>開通加開園區</button></div>
                </td>
                <td>{own.reduce((s, c) => s + circleStats(c).people, 0)}</td><td>{cov}</td><td>{g.created}</td>
                <td><span className={'pill st-' + g.status}>{g.status}</span></td>
                <td><button className="link" onClick={() => { g.status = g.status === '啟用' ? '停用' : '啟用'; logAudit('系統管理者', g.status === '啟用' ? '啟用園丁帳號' : '停用園丁帳號', g.name, null); bump() }}>{g.status === '啟用' ? '停用帳號' : '啟用帳號'}</button></td>
              </tr>
            )
          })}</tbody>
        </table>
        <p className="small muted">園丁不能停用自己的園區，必須由系統管理者設定；整個園區停用時，所有成員一併無法登入，成員仍保有唯一身分。</p>
      </section>
      <form className="card" onSubmit={create} style={{ maxWidth: 420 }}>
        <h3>＋ 開立園丁帳號</h3>
        <label>姓名 / 單位 *<input value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label>登入 Email *<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <button className="primary" type="submit" disabled={!name.trim() || !email.trim()}>開立帳號</button>
        {made && <p className="small" style={{ color: '#0f8b8d' }}>已開立「{made.name}」並開通第 1 個園區。園丁不走邀請連結，對方用 {made.email} 收登入連結，首次登入需同意條款。</p>}
      </form>
    </div>
  )
}
