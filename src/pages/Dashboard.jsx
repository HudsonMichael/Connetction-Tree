import { leadStats, MEMBERS, TOTAL_TOWNSHIPS, covered, growth, TOWNSHIPS, COUNTIES, people, tierCount, TIERS, twLabel } from '../data.js'
import { Stat, Bar, BarChart } from '../components/ui.jsx'

// 儀表板（E1）：只算「啟用」成員
export default function Dashboard({ go }) {
  const all = people()
  const ls = leadStats()
  const cov = covered()
  const leads = all.filter((m) => m.role === 'lead')
  const tc = tierCount(all)
  const pending = MEMBERS.filter((m) => m.status === '待審核')
  const noTw = all.filter((m) => !m.township).length
  const topCounties = COUNTIES.map(([c, n]) => ({ c, n, got: TOWNSHIPS.filter((t) => t.county === c && t.reps.length).length }))
    .sort((a, b) => b.got / b.n - a.got / a.n).slice(0, 6)
  return (
    <>
      <h2>總覽</h2>
      <div className="grid4">
        <Stat label="成員數（啟用）" value={all.length} sub={`大樹 ${leads.length}・小樹（含老樹） ${all.filter((m) => m.role === 'member').length}・樹幹 ${all.filter((m) => m.role === 'trunk').length}`} onClick={() => go('members')} />
        <Stat label="鄉鎮覆蓋" value={`${cov} / ${TOTAL_TOWNSHIPS}`} sub={`覆蓋率 ${(cov / TOTAL_TOWNSHIPS * 100).toFixed(1)}%`} onClick={() => go('map')} />
        <Stat label="當前活躍成員數" value={tc['活躍']} sub="最近 3 天內有登入" onClick={() => go('report')} />
        <Stat label="待審核" value={pending.length} sub="等待園丁核可" onClick={() => go('members')} />
      </div>
      <div className="grid2">
        <section className="card">
          <h3>近 12 個月新增成員</h3>
          <BarChart data={growth('month')} />
        </section>
        <section className="card">
          <h3>活躍程度</h3>
          <div className="stack">{TIERS.map((t, i) => <i key={t} style={{ width: (tc[t] / Math.max(1, all.length) * 100) + '%', background: ['#34a853', '#f5b342', '#aab8b8'][i] }} />)}</div>
          {TIERS.map((t) => <div key={t} className="row"><span><span className={'pill t-' + t}>{t}</span>{t === '活躍' ? '3 天內有登入' : t === '中等' ? '超過 3 天、7 天內有登入' : '超過 7 天或從未登入'}</span><b>{tc[t]} 人</b></div>)}
        </section>
      </div>
      <div className="grid2">
        <section className="card">
          <h3>大樹與旗下小樹</h3>
          {!ls.rows.length && <p className="muted small">這個園區目前沒有大樹。</p>}
          {ls.rows.map(({ lead: l, smalls, invited }) => (
            <div key={l.id} className="row2" style={{ gridTemplateColumns: '1fr 90px 120px' }}>
              <span>{l.name}<span className="muted small"> {twLabel(l.township)}</span></span>
              <Bar pct={smalls / Math.max(1, ...ls.rows.map((r) => r.smalls)) * 100} color="#0f8b8d" />
              <b>旗下 {smalls}<span className="small muted">（邀請 {invited}）</span></b>
            </div>
          ))}
          <div className="row"><span className="muted small">樹幹（園丁直屬）</span><b>{ls.ownerDirect} 人</b></div>
          <p className="muted small">旗下人數＝安置在他底下的啟用小樹（含老樹）；括號內是他自己邀請的人數，兩者可能不同。</p>
        </section>
        <section className="card">
          <h3>覆蓋率最高的縣市</h3>
          {topCounties.map((t) => (
            <div key={t.c} className="row2"><span>{t.c}</span><Bar pct={t.got / t.n * 100} color="#0f8b8d" /><span className="small muted">{t.got}/{t.n}</span></div>
          ))}
          <button className="link" onClick={() => go('map')}>查看 368 拓展圖 →</button>
          <h3 style={{ marginTop: 14 }}>待辦</h3>
          <div className="row"><span>待審核成員</span><b>{pending.length}</b></div>
          <div className="row"><span>尚未設定代表區域（不列入覆蓋）</span><b>{noTw}</b></div>
          <button className="primary" onClick={() => go('invites')}>產生邀請連結</button>
        </section>
      </div>
    </>
  )
}
