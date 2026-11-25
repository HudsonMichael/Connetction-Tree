import { useState } from 'react'
import { CURRENT, MEMBERS, REPORT_DATE, byId, twLabel, isOn, PREFILL, TOWNSHIPS } from '../data.js'
import TownshipPicker from '../components/TownshipPicker.jsx'
import { NAME_OK } from '../data.js'

const rcode = () => { const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; const p = () => Array.from({ length: 4 }, () => c[Math.floor(Math.random() * c.length)]).join(''); return p() + '-' + p() }
const shownStatus = (i) => (i.status === '待使用' && i.expires < REPORT_DATE ? '已過期' : i.status)

// 產生邀請連結（C6）：姓名、Email 必填；有效期 1／3／7 天；可預填預計的代表區域；顯示邀請人與樹根
export default function Invites({ invites: all, setInvites, user, isManager, go }) {
  const meId = user.memberId
  const mine = (i) => (isManager ? i.byRole === 'owner' : i.byId === meId)
  const invites = all.filter((i) => i.circle === CURRENT.id && (isManager || mine(i)))
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [days, setDays] = useState(7)
  const [tw, setTw] = useState(() => { const t = TOWNSHIPS.find((x) => x.id === PREFILL.tw); PREFILL.tw = null; return t || null })
  const [root, setRoot] = useState('')
  const [last, setLast] = useState(null)
  const [copied, setCopied] = useState(false)
  const leads = MEMBERS.filter((m) => m.role === 'lead' && isOn(m))
  const inviterName = isManager ? '園丁（你）' : byId(meId).name + '（你）'
  const rootId = role === 'lead' || role === 'trunk' ? 0 : isManager ? Number(root) : meId
  const rootName = rootId === 0 ? '直屬園丁' : byId(rootId)?.name || ''
  const nameBad = !!name && !NAME_OK(name)
  const ok = name.trim() && email.trim() && !nameBad && (role !== 'member' || rootId !== 0)
  const create = (e) => {
    e.preventDefault()
    if (!ok) return
    const exp = new Date(REPORT_DATE); exp.setDate(exp.getDate() + Number(days))
    const inv = { code: rcode(), name: name.trim(), email: email.trim().toLowerCase(), role, circle: CURRENT.id, by: isManager ? '園丁' : byId(meId).name, byRole: isManager ? 'owner' : 'lead', byId: isManager ? 0 : meId,
      root: rootId, township: tw ? tw.id : null, created: REPORT_DATE, expires: exp.toISOString().slice(0, 10), status: '待使用' }
    setInvites([inv, ...all]); setLast(inv); setName(''); setEmail(''); setTw(null); setCopied(false)
  }
  const link = (c) => `https://dev.example.app/invite/${c}`
  const copy = async (t) => { try { await navigator.clipboard.writeText(t); setCopied(true) } catch { setCopied(false) } }
  const twNote = (t) => (t.reps?.length ? `目前已有 ${t.reps.length} 位成員` : '')
  return (
    <>
      <h2>邀請管理</h2>
      <p className="muted">邀請對象將加入「<b>{CURRENT.name}</b>」。邀請連結是進入系統的唯一管道：單次使用、限時有效、綁定對方的姓名與 Email。{isManager ? '園丁可邀請大樹、小樹或樹幹；不指定樹根的對方成為樹幹（園丁直屬、尚未分配）。' : '大樹只能邀請小樹，對方會自動成為你旗下。'}系統不寄邀請信，請複製連結自行傳送（例如 LINE）。</p>
      <div className="grid2">
        <form className="card" onSubmit={create}>
          <h3>產生邀請連結</h3>
          <div className="two">
            <label>被邀請人姓名 *（最多 10 字）<input value={name} maxLength={10} onChange={(e) => setName(e.target.value)} /></label>
            <label>被邀請人 Email *<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="對方的信箱" /></label>
          </div>
          {nameBad && <p className="small warn">姓名不可使用特殊字元。</p>}
          <div className="two">
            <label>邀請身分
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="member">小樹{isManager ? '（需指定樹根）' : ''}</option>{isManager && <option value="trunk">樹幹（園丁直屬，尚未分配）</option>}{isManager && <option value="lead">大樹（鄉鎮代表，可邀請小樹）</option>}
              </select>
            </label>
            <label>有效期限
              <select value={days} onChange={(e) => setDays(e.target.value)}><option value={1}>1 天</option><option value={3}>3 天</option><option value={7}>7 天</option></select>
            </label>
          </div>
          <div className="two">
            <div className="field"><div>邀請人</div><input value={inviterName} disabled /></div>
            {role === 'member' && isManager ? (
              <label>樹根（安置位置）
                <select value={root} onChange={(e) => setRoot(e.target.value)}>
                  <option value="">請選擇大樹</option>{leads.map((l) => <option key={l.id} value={l.id}>{l.name}（{twLabel(l.township)}）</option>)}
                </select>
              </label>
            ) : <div className="field"><div>樹根（安置位置）</div><input value={role === 'lead' ? '直屬園丁（大樹一律直屬園丁）' : role === 'trunk' ? '直屬園丁（成為樹幹）' : rootName + '（自己的樹根）'} disabled /></div>}
          </div>
          <div className="field">
            <div>預計的代表區域（選填，單一鄉鎮）</div>
            <TownshipPicker value={tw} onChange={setTw} note={twNote} />
            <span className="small muted">邀請時可預填，園丁核可時確認或修改；通過審核後，邀請人就不能再改，只有園丁能改。</span>
          </div>
          <button className="primary" type="submit" disabled={!ok}>產生連結</button>
          {last && (
            <div className="result">
              <div className="small muted">已產生給 {last.name}（單次使用、{last.expires} 到期）</div>
              <code>{link(last.code)}</code>
              <button type="button" onClick={() => copy(link(last.code))}>{copied ? '已複製 ✓' : '複製連結'}</button>
              <button type="button" className="link" onClick={() => { window.location.hash = '#/invite/' + last.code }}>以受邀者身分開啟（示範）</button>
            </div>
          )}
        </form>
        <section className="card">
          <h3>受邀者看到的流程（示意）</h3>
          <div className="phone">
            <b>您受邀加入「{CURRENT.name}」</b>
            <p className="small muted">邀請人：{inviterName.replace('（你）', '')}｜樹根：{rootName}</p>
            <ol className="small" style={{ paddingLeft: 18, margin: '6px 0' }}>
              <li>以預綁的 Email 收登入連結並點擊</li>
              <li>確認姓名：<b>{name || last?.name || '（邀請人已填）'}</b></li>
              <li>勾選同意個資告知與使用條款</li>
              <li>建立帳號，狀態為「待審核」，等園丁核可</li>
            </ol>
            <label className="small"><input type="checkbox" disabled /> 我已閱讀並同意個資告知與使用條款</label>
            <button disabled className="primary">寄送登入連結</button>
            <p className="small muted">其他資料（名稱、居住地、自我介紹、頭像、其他聯絡方式）登入後自行在「我的資料」補齊。</p>
          </div>
        </section>
      </div>
      <section className="card">
        <h3>邀請紀錄</h3>
        <table>
          <thead><tr><th>姓名</th><th>Email</th><th>角色</th><th>樹根</th><th>預計代表區域</th><th>建立</th><th>到期</th><th>狀態</th><th></th></tr></thead>
          <tbody>{invites.map((i) => {
            const st = shownStatus(i)
            return (
              <tr key={i.code}>
                <td><b>{i.name}</b></td><td>{i.email}</td><td>{i.role === 'lead' ? '大樹' : i.role === 'trunk' ? '樹幹' : '小樹'}</td><td>{i.root ? (byId(i.root)?.name || '—') : '直屬園丁'}</td><td>{i.township ? twLabel(i.township) : '—'}</td>
                <td>{i.created}</td><td>{i.expires}</td>
                <td><span className={'pill st-' + st}>{st}</span></td>
                <td>{st === '待使用' && <><button className="link" onClick={() => { window.location.hash = '#/invite/' + i.code }}>開啟（示範）</button> <button className="link" onClick={() => setInvites(all.map((x) => x.code === i.code ? { ...x, status: '已作廢' } : x))}>作廢</button></>}</td>
              </tr>
            )
          })}</tbody>
        </table>
        <p className="small muted">只能作廢尚未被接受的連結；一旦被接受就進入審核，不能再作廢。「無法使用」＝接受時發現該 Email 已有有效成員身分（邀請人不會看到原因）。</p>
      </section>
    </>
  )
}
