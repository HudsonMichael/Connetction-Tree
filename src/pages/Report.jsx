import { useState } from 'react'
import { leadStats, TOTAL_TOWNSHIPS, covered, growth, UNITS, REPORT_DATE, COUNTIES, TOWNSHIPS, CIRCLES, visibleCircles, people, tierCount, TIERS, twLabel, townState, leadScope, MEMBERS, isOn, byId } from '../data.js'
import { BarChart, Bar } from '../components/ui.jsx'
import { Who } from '../components/Who.jsx'

const SORTS = [['gap:desc', '缺口最多（預設）'], ['rate:desc', '覆蓋率 高→低'], ['rate:asc', '覆蓋率 低→高'], ['cnt:desc', '成員數最多'], ['name:asc', '縣市名稱']]
const COLS = [['name', '縣市'], ['n', '鄉鎮數'], ['got', '已覆蓋'], ['gap', '尚缺'], ['rate', '覆蓋率'], ['cnt', '成員數']]
const COLORS = ['#34a853', '#f5b342', '#aab8b8']
const STATE = { solid: '實心（有大樹）', hollow: '空心（只有小樹）', none: '未覆蓋' }

// 園區報告（E2）：R1 成員成長、R2 各縣市覆蓋、R3 大樹與旗下小樹、R4 活躍程度分布。大樹只看自己樹根的範圍。
export default function Report({ user, isManager }) {
  const [unit, setUnit] = useState('month')
  const [sort, setSort] = useState('gap:desc')
  const [merge, setMerge] = useState(false)
  const lead = isManager ? null : byId(user.memberId)
  const trees = visibleCircles(user)
  const ls = leadStats()
  // 範圍：園丁＝整個園區（可選合併所有園區）；大樹＝自己旗下
  const scopeList = lead ? MEMBERS.filter((m) => m.parent === lead.id && m.role === 'member' && isOn(m)) : people()
  const growthList = merge && isManager ? trees.flatMap((c) => c.members.filter((m) => m.id && isOn(m))) : scopeList
  const g = growth(unit, growthList)
  const tc = tierCount(scopeList)
  const cov = covered()
  const [sk, sd] = sort.split(':')
  const rows = COUNTIES.map(([c, n], i) => {
    const ts = TOWNSHIPS.filter((t) => t.county === c)
    const got = ts.filter((t) => t.reps.length).length
    return { c, n, got, gap: n - got, rate: got / n, name: i, cnt: ts.reduce((s, t) => s + t.reps.length, 0) }
  }).sort((a, b) => (sd === 'asc' ? 1 : -1) * (a[sk] - b[sk]) || a.name - b.name)
  const head = (k) => sk === k ? (sd === 'asc' ? ' ▲' : ' ▼') : ''
  const clickHead = (k) => setSort(sk === k ? `${k}:${sd === 'asc' ? 'desc' : 'asc'}` : `${k}:${k === 'name' ? 'asc' : 'desc'}`)
  const scope = lead ? [...leadScope(lead.id)].map((id) => TOWNSHIPS.find((t) => t.id === id)).filter(Boolean) : []
  const myRow = lead ? ls.rows.find((r) => r.lead.id === lead.id) : null
  const unitLen = { day: '天', week: '週', month: '個月', year: '年' }[unit]
  return (
    <div className="report">
      <div className="toolbar noprint"><h2 style={{ margin: 0 }}>園區報告</h2><button className="primary" onClick={() => window.print()}>列印 / 另存 PDF</button></div>
      <p className="muted">{lead ? '你自己樹根範圍內的報告。' : '用於合作洽談或募資簡報的數據摘要；園丁也可匯出轄下成員的報表與名單（在「成員名單」頁）。'}數字由系統即時計算，只算啟用成員（此處為示意資料）。報告日期：{REPORT_DATE}</p>
      {isManager && trees.length > 1 && (
        <label className="small noprint" style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
          <input type="checkbox" checked={merge} onChange={(e) => setMerge(e.target.checked)} style={{ width: 'auto' }} />
          合併我的所有園區（只合併重點摘要與成員成長；各縣市覆蓋仍各個分開看）
        </label>
      )}
      <section className="card">
        <h3>重點摘要{merge && isManager ? '（合併 ' + trees.length + ' 個園區）' : ''}</h3>
        <ul className="sum">
          <li>成員數 <b>{growthList.length}</b> 位（啟用）{!lead && !merge && <>，其中大樹 <b>{ls.rows.length}</b> 位</>}。</li>
          {!lead && <li>目前這個園區已覆蓋 <b>{cov}</b> / {TOTAL_TOWNSHIPS} 個鄉鎮市區，覆蓋率 <b>{(cov / TOTAL_TOWNSHIPS * 100).toFixed(1)}%</b>。</li>}
          {lead && <li>你負責 <b>{scope.length}</b> 個鄉鎮；旗下 <b>{myRow?.smalls ?? 0}</b> 位、你邀請的人 <b>{myRow?.invited ?? 0}</b> 位。</li>}
          <li>當前活躍成員數 <b>{(merge && isManager ? tierCount(growthList) : tc)['活躍']}</b> 位（最近 3 天內有登入）。</li>
        </ul>
      </section>

      <div className="toolbar">
        <span className="small muted">R1 成員成長・時間軸</span>
        <div className="seg">{Object.entries(UNITS).map(([k, [l]]) => <button key={k} className={unit === k ? 'chip on' : 'chip'} onClick={() => setUnit(k)}>{l}</button>)}</div>
        <span className="small muted">近 {UNITS[unit][1]} {unitLen}，截至 {REPORT_DATE}</span>
      </div>
      <div className="grid2">
        <section className="card"><h3>新增成員（{UNITS[unit][0]}）</h3><BarChart data={g} /></section>
        <section className="card"><h3>累計成員</h3><BarChart data={g} k="total" /></section>
      </div>

      <section className="card">
        <div className="toolbar noprint" style={{ marginBottom: 6 }}>
          <h3 style={{ margin: 0 }}>R2 各縣市覆蓋{lead ? '（你負責的鄉鎮）' : ''}</h3>
          {!lead && <label className="small" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>排序
            <select value={SORTS.some(([v]) => v === sort) ? sort : ''} onChange={(e) => setSort(e.target.value)}>
              {!SORTS.some(([v]) => v === sort) && <option value="">自訂（點欄位標題）</option>}
              {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>}
        </div>
        {lead ? (
          <table>
            <thead><tr><th>鄉鎮</th><th>狀態</th></tr></thead>
            <tbody>{scope.map((t) => <tr key={t.id}><td>{twLabel(t.id)}</td><td>{STATE[townState(t)]}</td></tr>)}</tbody>
          </table>
        ) : (
          <table>
            <thead><tr>{COLS.map(([k, l]) => <th key={k} className="sortable" onClick={() => clickHead(k)}>{l}{head(k)}</th>)}<th></th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.c}><td>{r.c}</td><td>{r.n}</td><td>{r.got}</td><td>{r.gap}</td><td>{(r.rate * 100).toFixed(0)}%</td><td>{r.cnt}</td><td style={{ width: '30%' }}><Bar pct={r.rate * 100} color="#0f8b8d" /></td></tr>
            ))}</tbody>
          </table>
        )}
      </section>

      <section className="card">
        <h3>R3 大樹與旗下小樹</h3>
        {!lead && !ls.rows.length && <p className="muted small">這個園區目前沒有大樹。</p>}
        {(lead ? (myRow ? [myRow] : []) : ls.rows).map(({ lead: l, smalls, invited, tiers, list }) => (
          <details key={l.id} className="notebox" open={!!lead}>
            <summary><Who m={l} /> <span className="small muted">{twLabel(l.township)}</span>　旗下 <b>{smalls}</b>・邀請 <b>{invited}</b>　{TIERS.map((t) => <span key={t} className={'pill t-' + t}>{t} {tiers[t]}</span>)}</summary>
            <table>
              <thead><tr><th>旗下小樹（含老樹）</th><th>代表區域</th><th>活躍程度</th></tr></thead>
              <tbody>{list.map((m) => <tr key={m.id}><td><Who m={m} /></td><td>{twLabel(m.township)}</td><td><span className={'pill t-' + tierOf2(m)}>{tierOf2(m)}</span></td></tr>)}</tbody>
            </table>
          </details>
        ))}
        {!lead && <>
          <div className="row"><span className="muted">樹幹（園丁直屬）</span><b>{ls.ownerDirect} 位</b></div>
          <div className="small muted" style={{ marginTop: 6 }}>尚無大樹的空心鄉鎮：{TOWNSHIPS.filter((t) => townState(t) === 'hollow').map((t) => twLabel(t.id)).join('、') || '無'}</div>
        </>}
        <p className="small muted">旗下人數＝安置在他底下的啟用小樹（含老樹）；邀請人數＝他自己邀請的人，兩者可能不同。</p>
      </section>

      <section className="card">
        <h3>R4 活躍程度分布{lead ? '（旗下）' : ''}</h3>
        <div className="stack">{TIERS.map((t, i) => <i key={t} style={{ width: (tc[t] / Math.max(1, scopeList.length) * 100) + '%', background: COLORS[i] }} />)}</div>
        <div className="legend2">{TIERS.map((t, i) => <span key={t} className="small"><i className="sq" style={{ background: COLORS[i] }} />{t} <b>{tc[t]}</b> 人（{t === '活躍' ? '3 天內' : t === '中等' ? '7 天內' : '超過 7 天或從未登入'}）</span>)}</div>
      </section>
    </div>
  )
}
import { tierOf as tierOf2 } from '../data.js'
