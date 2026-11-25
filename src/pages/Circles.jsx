import { TOTAL_TOWNSHIPS, TOWNSHIPS, GARDENERS, MAX_CIRCLES, circleStats, ownCircles, coveredSet, requestCircle } from '../data.js'
import { Bar, Stat } from '../components/ui.jsx'

// 我的園區（園丁）：初始 1 個園區，加開須由系統管理者開通；園丁不能自行建立或停用園區
export default function Circles({ switchTo, bump, user }) {
  const CIRCLES = ownCircles(user)
  const active = CIRCLES.filter((c) => c.status !== '停用')
  const g = GARDENERS.find((x) => x.id === user.gardenerId)
  const total = active.reduce((s, c) => s + circleStats(c).people, 0)
  const union = new Set(active.flatMap((c) => [...coveredSet(c)])).size
  return (
    <>
      <h2>我的園區</h2>
      <p className="muted">園丁初始有 1 個園區，需要更多時向系統管理者申請加開，由系統管理者開通（暫定上限 {MAX_CIRCLES} 個）。園丁不能自行建立或停用園區。每個園區各自命名、描述，並各有 368 個鄉鎮代表的結構。</p>
      <div className="grid4">
        <Stat label="園區數量" value={CIRCLES.length} sub={`上限 ${MAX_CIRCLES} 個`} />
        <Stat label="各園區成員合計" value={total} sub="啟用中，不含園丁" />
        <Stat label="各園區覆蓋的鄉鎮（合計去重）" value={`${union} / ${TOTAL_TOWNSHIPS}`} sub="覆蓋以各園區分開計算為準" />
        <Stat label="鄉鎮目標" value={TOTAL_TOWNSHIPS} sub="每個園區各 368" />
      </div>
      <div className="circle-grid">
        {CIRCLES.map((c) => {
          const st = circleStats(c)
          if (c.status === '停用') return (
            <section key={c.id} className="card">
              <h3>{c.name} <span className="pill off">已被系統管理者停用</span></h3>
              <p className="muted small">停用期間園丁無法查看這個園區的任何內容，也不納入合併報告；恢復後成員回到停用前各自的狀態。</p>
            </section>
          )
          return (
            <section key={c.id} className="card">
              <h3>{c.name} {c.status === '停用' && <span className="pill off">已被系統管理者停用</span>}</h3>
              <p className="muted small">{c.desc || '（尚無描述）'}</p>
              <div className="row"><span>成員</span><b>{st.people}</b></div>
              <div className="row"><span>大樹</span><b>{st.leads}</b></div>
              <div className="row"><span>開通日期</span><b>{c.created}</b></div>
              <div className="row2" style={{ gridTemplateColumns: '60px 1fr 64px' }}><span className="small">鄉鎮覆蓋</span><Bar pct={st.covered / TOTAL_TOWNSHIPS * 100} color="#0f8b8d" /><span className="small muted">{st.covered}/{TOWNSHIPS.length}</span></div>
              <div className="actions">
                <button className="primary" onClick={() => switchTo(c.id, 'dashboard')}>進入</button>
              </div>
            </section>
          )
        })}
        <section className="card dashed">
          <h3>＋ 加開園區</h3>
          {CIRCLES.length >= MAX_CIRCLES ? <p className="small muted">已達上限（{MAX_CIRCLES} 個）。</p> : g?.request ? (
            <p className="small" style={{ color: '#0f8b8d' }}>已申請，等待系統管理者開通。</p>
          ) : (
            <>
              <p className="small muted">加開的園區由系統管理者開通，開通後會出現在這裡。</p>
              <button className="primary" onClick={() => { requestCircle(user.gardenerId); bump() }}>申請加開園區</button>
            </>
          )}
        </section>
      </div>
    </>
  )
}
