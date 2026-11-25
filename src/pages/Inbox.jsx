import { useState } from 'react'
import { CIRCLES } from '../data.js'
import { MESSAGES, userKey, markRead, matchMsg, delMsg } from '../messages.js'
import MsgFilter from '../components/MsgFilter.jsx'

const FROM = { platform: '系統公告', owner: '園丁', lead: '大樹', member: '小樹', trunk: '樹幹' }

export default function Inbox({ user, bump }) {
  const key = userKey(user)
  const [sel, setSel] = useState(null)
  const [f, setF] = useState({ q: '', from: '', to: '', status: 'all', source: '' })
  const mine = MESSAGES.filter((m) => m.to.includes(key) && !m.deleted[key])
  const where = (x) => x.kind === 'platform' ? '系統公告' : CIRCLES.find((c) => c.id === x.circleId)?.name
  const sources = [...new Map(mine.map((x) => [x.kind === 'platform' ? 'platform' : x.circleId, where(x)]))]
  const list = mine.filter((x) => matchMsg(x, f))
    .filter((x) => f.status === 'all' || (f.status === 'unread') === !x.reads[key])
    .filter((x) => !f.source || (x.kind === 'platform' ? 'platform' : x.circleId) === f.source)
  const m = mine.find((x) => x.id === sel)
  const open = (x) => { setSel(x.id); if (!x.reads[key]) { markRead(x, key); bump() } }
  const unread = mine.filter((x) => !x.reads[key]).length
  return (
    <>
      <h2>收件匣</h2>
      <p className="muted">你收到的系統公告，以及來自上層、下層的訊息；沒有對話串，不能回覆（要回應請發一則新訊息）。訊息保存 12 個月後自動刪除。共 {mine.length} 則，未讀 <b>{unread}</b> 則。</p>
      <MsgFilter f={f} setF={setF}>
        <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="all">全部狀態</option><option value="unread">未讀</option><option value="read">已讀</option></select>
        <select value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })}><option value="">全部來源</option>{sources.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        {unread > 0 && <button className="link" onClick={() => { mine.forEach((x) => markRead(x, key)); bump() }}>全部標為已讀</button>}
      </MsgFilter>
      <div className="grid-tree">
        <section className="card">
          <div className="small muted" style={{ marginBottom: 6 }}>符合 {list.length} 則</div>
          {!list.length && <p className="muted">沒有符合條件的訊息</p>}
          <table>
            <tbody>{list.map((x) => (
              <tr key={x.id} className={'clickrow msgrow' + (sel === x.id ? ' sel' : '') + (x.reads[key] ? '' : ' unread')} onClick={() => open(x)}>
                <td style={{ width: 14 }}>{!x.reads[key] && <i className="dot" />}</td>
                <td><div>{x.subject}</div><div className="small muted">{x.from.name}・{where(x)}</div></td>
                <td className="small muted" style={{ whiteSpace: 'nowrap' }}>{x.date.slice(5, 10)}<br />{x.reads[key] ? '已讀' : <b style={{ color: 'var(--teal)' }}>未讀</b>}</td>
              </tr>
            ))}</tbody>
          </table>
        </section>
        <section className="card">
          <h3>訊息內容</h3>
          {!m ? <p className="muted">請點選左側訊息</p> : (
            <>
              <h3 style={{ marginBottom: 4 }}>{m.subject}</h3>
              <div className="row"><span>寄件人</span><b><span className={'pill ' + (m.from.role === 'platform' ? 'gardener' : m.from.role)}>{FROM[m.from.role]}</span>{m.from.name}</b></div>
              <div className="row"><span>來源</span><b>{where(m)}</b></div>
              <div className="row"><span>時間</span><b>{m.date}</b></div>
              <div className="row"><span>狀態</span><b>已讀（{m.reads[key]}）</b></div>
              <p style={{ whiteSpace: 'pre-wrap' }}>{m.body}</p>
              <button onClick={() => { delMsg(m, key); setSel(null); bump() }}>刪除這則（只影響我的收件匣）</button>
            </>
          )}
        </section>
      </div>
    </>
  )
}
