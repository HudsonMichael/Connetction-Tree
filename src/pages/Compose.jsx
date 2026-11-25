import { useState } from 'react'
import { CURRENT, MEMBERS, ownerName, visibleCircles, isOn, byId } from '../data.js'
import { MESSAGES, resolve, send, userKey, readCount, matchMsg, nameOfKey, upTargets } from '../messages.js'
import MsgFilter from '../components/MsgFilter.jsx'

// 發送訊息。mode: platform（系統管理者）／owner（園丁）／lead（大樹）／low（小樹、老樹、樹幹）
// 規則（F3）：只能整批發給自己「下一階層的所有成員」；向上只能發給邀請人或安置人。
//   系統管理者：所有園丁、全系統公告。園丁：直屬的大樹與樹幹，整批或單一。大樹：旗下全部小樹（含老樹）、邀請人、安置人。小樹／老樹／樹幹：單一發給邀請人或安置人。
export default function Compose({ user, mode, bump, selectTree }) {
  const trees = visibleCircles(user)
  const canSeeRead = user.role === 'gardener' || user.role === 'bigtree' // 發送者的已讀資訊只有園丁與大樹看得到（#18）
  const key = userKey(user)
  const me = mode === 'lead' || mode === 'low' ? byId(user.memberId) : null
  const ups = me ? upTargets(CURRENT, me) : []
  const upScope = (t) => [t.scope, t.both ? `我的邀請人與安置人：${t.name}` : `我的${t.scope === 'inviter' ? '邀請人' : '安置人'}：${t.name}`]
  const scopes = mode === 'platform' ? [['all', '全系統所有啟用帳號'], ['owners', '只發給所有園丁']]
    : mode === 'owner' ? [['next', '直屬的所有大樹與樹幹（下一階層）'], ['one', '單一大樹或樹幹']]
    : mode === 'lead' ? [['down', '我旗下的全部小樹（含老樹）'], ...ups.map(upScope)]
    : ups.map(upScope)
  const [scope, setScope] = useState(scopes[0][0])
  const [target, setTarget] = useState('')
  const [kw, setKw] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [toast, setToast] = useState('')
  const [f, setF] = useState({ q: '', from: '', to: '' })
  const people = MEMBERS.filter((m) => m.id !== 0 && isOn(m))
  const options = scope === 'one' ? people.filter((m) => m.parent === 0) : []
  const shown = options.filter((m) => !kw || (m.name + m.org).includes(kw))
  const needTarget = scope === 'one'
  const r = resolve({ mode, circle: CURRENT, scope, target, me: user.memberId })
  const ok = subject.trim() && body.trim() && r.keys.length > 0 && (!needTarget || target)
  const sent = MESSAGES.filter((m) => m.from.key === key && (mode === 'platform' ? m.kind === 'platform' : m.circleId === CURRENT.id))
  const shownSent = sent.filter((m) => matchMsg(m, f))
  const fromRole = mode === 'platform' ? 'platform' : mode === 'owner' ? 'owner' : mode === 'lead' ? 'lead' : user.role === 'trunk' ? 'trunk' : 'member'
  const go = (e) => {
    e.preventDefault()
    if (!ok) return
    const from = { key, name: mode === 'owner' ? ownerName(CURRENT.owner) : user.name, role: fromRole }
    send({ kind: mode === 'platform' ? 'platform' : 'tree', circleId: mode === 'platform' ? null : CURRENT.id, from: mode === 'platform' ? { ...from, name: '平台營運方' } : from, label: r.label, keys: r.keys, subject: subject.trim(), body: body.trim() })
    setSubject(''); setBody(''); setTarget(''); setKw(''); setToast(`已送出給 ${r.keys.length} 人 ✓`); setTimeout(() => setToast(''), 2500); bump()
  }
  return (
    <div className={mode === 'platform' ? 'platformpage' : ''}>
      <h2>{mode === 'platform' ? '系統公告與訊息' : '發送訊息'}</h2>
      <p className="muted">
        {mode === 'platform' && '系統管理者可發給所有園丁（下一階層），或發全系統公告給所有啟用帳號。看不到任何園區裡的訊息；園區內的訊息由園丁、大樹等自行發送。'}
        {mode === 'owner' && <>你是「<b>{CURRENT.name}</b>」的園丁，只能發給下一階層：直屬的所有大樹與樹幹，或單一大樹、樹幹。純文字、單向，不能回覆；發出後不能收回。</>}
        {mode === 'lead' && '你可以整批發給自己旗下的小樹（含老樹），或單一發給向上的邀請人、安置人。純文字、單向，沒有對話串；發出後不能收回。'}
        {mode === 'low' && '你可以單一發給上一層的邀請人或安置人，不能整批發送。純文字、單向，沒有對話串；發出後不能收回。'}
      </p>
      <div className="grid2">
        <form className="card" onSubmit={go}>
          <h3>新訊息</h3>
          {mode === 'owner' && (
            <label>發送到哪一個園區
              <select value={CURRENT.id} onChange={(e) => selectTree(e.target.value)}>{trees.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            </label>
          )}
          <label>收件範圍
            <select value={scope} onChange={(e) => { setScope(e.target.value); setTarget(''); setKw('') }}>{scopes.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          </label>
          {needTarget && (
            <div className="field">
              <div>選擇大樹或樹幹</div>
              <input placeholder="輸入關鍵字篩選姓名／單位" value={kw} onChange={(e) => setKw(e.target.value)} />
              <select value={target} onChange={(e) => setTarget(e.target.value)} size={Math.min(6, shown.length + 1)}>
                <option value="">請選擇</option>
                {shown.map((m) => <option key={m.id} value={m.id}>{m.role === 'lead' ? '★ 大樹 ' : '樹幹 '}{m.name}</option>)}
              </select>
            </div>
          )}
          <label>標題（最多 50 字）<input value={subject} maxLength={50} onChange={(e) => setSubject(e.target.value)} /></label>
          <label>內文（純文字，最多 2000 字；網址不會變成連結）<textarea rows="5" maxLength={2000} value={body} onChange={(e) => setBody(e.target.value)} /><span className="small muted">{body.length}/2000</span></label>
          <div className="small muted">{r.label ? <>將送給：<b>{r.label}</b>，共 {r.keys.length} 人</> : '請先選擇收件對象'}</div>
          <div className="actions">
            <button className="primary" type="submit" disabled={!ok}>送出</button>
            {toast && <span className="small" style={{ color: '#0f8b8d' }}>{toast}</span>}
          </div>
        </form>
        <section className="card">
          <h3>已送出</h3>
          <MsgFilter f={f} setF={setF} />
          {!sent.length && <p className="muted small">尚未送出任何訊息</p>}
          {sent.length > 0 && !shownSent.length && <p className="muted small">沒有符合條件的訊息</p>}
          {shownSent.map((m) => (
            <details key={m.id} className="notebox">
              <summary><b>{m.subject}</b> <span className="small muted">{m.date}</span></summary>
              <div className="small muted">收件：{m.label}{canSeeRead && <>・已讀 {readCount(m)} / {m.to.length}</>}</div>
              {canSeeRead && <details className="small"><summary>誰已讀、誰未讀</summary>{m.to.map((k) => <div key={k}>{nameOfKey(k)}：{m.reads[k] ? '已讀 ' + (m.reads[k].length > 5 ? m.reads[k] : '') : '未讀'}</div>)}</details>}
              <p className="small">{m.body}</p>
            </details>
          ))}
        </section>
      </div>
    </div>
  )
}
