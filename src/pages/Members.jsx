import { useState } from 'react'
import { logAudit, MEMBERS, COUNTIES, ROLE_LABEL, roleName, byId, childrenOf, descendants, twLabel, tierOf, isOn, setRole, moveMember, setElder, replaceLead, setStatus, approve, reject, leave, setTownship, downloadCSV, TOWNSHIPS } from '../data.js'
import { Who } from '../components/Who.jsx'
import TownshipPicker from '../components/TownshipPicker.jsx'

const RolePill = ({ role, m }) => <span className={'pill ' + role + (m?.elder ? ' elder' : '')}>{role === 'lead' ? '★ ' : ''}{m ? roleName(m) : ROLE_LABEL[role]}</span>
const Tier = ({ m }) => (isOn(m) ? <span className={'pill t-' + tierOf(m)}>{tierOf(m)}</span> : null)

// 聯絡方式：依 D1 規則。reveal 時寫稽核。成員本人在「我的資料」修改。
function ContactBlock({ m, viewer, circleId }) {
  const [reveal, setReveal] = useState(false)
  const mask = (s) => (reveal ? s : (s || '—').replace(/.(?=.{3})/g, '•'))
  const show = () => { if (!reveal) logAudit(viewer, '查看聯絡方式', m.name, circleId); setReveal(!reveal) }
  return (
    <div className="notebox">
      <div className="row"><span>其他聯絡方式</span><b>{mask(m.contact)}</b></div>
      <div className="row"><span>Email（登入帳號）</span><b>{mask(m.email)}</b></div>
      <div className="actions"><button className="link" onClick={show}>{reveal ? '隱藏' : '顯示（會留下查看紀錄）'}</button></div>
      {reveal && <p className="small muted">已留下查看紀錄。</p>}
    </div>
  )
}

// 邀請人編輯：只有作者（邀請人）能編輯；園丁可讀全部、只能改自己寫的
function NoteBox({ title, value, editable, onSave }) {
  const [v, setV] = useState(value)
  return (
    <div className="notebox">
      <div className="small"><b>{title}</b></div>
      {editable ? (
        <>
          <textarea rows="3" value={v} onChange={(e) => setV(e.target.value)} placeholder="寫下你對這位成員的看法（僅你與園丁看得到，成員本人看不到）" />
          <button disabled={v === value} onClick={() => onSave(v)}>儲存</button>
        </>
      ) : <p className="small">{value || <span className="muted">（尚未填寫）</span>}</p>}
    </div>
  )
}

function Node({ m, depth, open, toggle, sel, setSel, show }) {
  const kids = childrenOf(m.id).filter(show)
  const isOpen = open[m.id] ?? depth < 2
  return (
    <div>
      <div className={'node' + (sel === m.id ? ' sel' : '') + (m.role === 'lead' ? ' bigrow' : '')} style={{ marginLeft: depth * 22 }} onClick={() => setSel(m.id)}>
        <span className="tw" onClick={(e) => { e.stopPropagation(); kids.length && toggle(m.id, isOpen) }}>{kids.length ? (isOpen ? '▾' : '▸') : '·'}</span>
        <RolePill role={m.role} m={m} />
        <Who m={m} />
        {kids.length > 0 && <span className="count">旗下 {descendants(m.id)} 人</span>}
        {m.status !== '啟用' && <span className={'pill st-' + m.status}>{m.status}</span>}
        <Tier m={m} />
      </div>
      {isOpen && kids.map((k) => <Node key={k.id} m={k} depth={depth + 1} open={open} toggle={toggle} sel={sel} setSel={setSel} show={show} />)}
    </div>
  )
}

export default function Members({ user, isManager, bump, circleId }) {
  const [view, setView] = useState('tree')
  const [q, setQ] = useState('')
  const [role, setRoleF] = useState('')
  const [county, setCounty] = useState('')
  const [status, setStatusF] = useState('')
  const [sel, setSel] = useState(null)
  const [open, setOpen] = useState({})
  const [msg, setMsg] = useState('')
  const [moveTo, setMoveTo] = useState('')
  const [repOld, setRepOld] = useState('')
  const [repFate, setRepFate] = useState('member')
  const [repPlace, setRepPlace] = useState('')
  const me = isManager ? null : byId(user.memberId)
  // 大樹看得到：自己旗下小樹、自己邀請的人（含已被移走者）。其他大樹與其旗下的小樹都看不到（#11 已決議）。
  const visible = (x) => isManager || x.id === 0 ? true : x.id === me.id || x.parent === me.id || x.inviter === me.id
  const leads = MEMBERS.filter((m) => m.role === 'lead' && isOn(m))
  const root = isManager ? MEMBERS[0] : me
  const list = MEMBERS.filter((m) => m.id !== 0 && visible(m))
    .filter((m) => !q || (m.name + m.nick + m.residence).includes(q))
    .filter((m) => !role || (role === 'elder' ? m.role === 'member' && m.elder : m.role === role))
    .filter((m) => !county || (m.township || '').startsWith(county))
    .filter((m) => !status || m.status === status)
    .sort((a, b) => (b.role === 'lead') - (a.role === 'lead'))
  const m = sel != null ? byId(sel) : null
  const toggle = (id, cur) => setOpen({ ...open, [id]: !cur })
  const res = (r) => { setMsg(r.msg); bump(); if (r.ok && (r.msg.includes('離開') || r.msg.includes('拒絕'))) setSel(null) }
  // 這位成員的聯絡方式能否被我看到
  const canContact = m && (isManager || m.parent === me.id || m.inviter === me.id) && !(m.hideContact && me && me.inviter === m.id)
  const isAuthor = m && (isManager ? m.inviter === 0 : m.inviter === me.id)
  const canNote = m && (isManager || m.inviter === me.id) && m.id !== 0
  const inviter = m && m.inviter != null ? (m.inviter === 0 ? { name: '園丁' } : byId(m.inviter)) : null
  return (
    <>
      <h2>{isManager ? '成員名單' : '我的成員'}</h2>
      <p className="muted">{isManager ? <>大樹（鄉鎮代表）<b>{leads.length}</b> 位。樹狀圖依「樹根（安置位置）」排列；邀請人固定不變，園丁可安置樹幹、移動小樹的樹根、設定老樹，或置換大樹。</> : '你旗下的小樹（含老樹）與你邀請的人。看不到其他大樹，也看不到其他大樹旗下的小樹。'}</p>
      <div className="toolbar">
        <div className="seg">
          {[['tree', '樹狀圖'], ['list', '列表']].map(([k, l]) => <button key={k} className={view === k ? 'chip on' : 'chip'} onClick={() => setView(k)}>{l}</button>)}
        </div>
        {isManager && <button onClick={() => downloadCSV('成員報表與名單.csv', [['姓名', '名稱', '角色', '狀態', '代表區域', '邀請人', '樹根（安置位置）', '加入日期', '最後登入', 'Email', '其他聯絡方式'],
          ...MEMBERS.filter((x) => x.id !== 0).map((x) => [x.name, x.nick, roleName(x), x.status, twLabel(x.township), x.inviter === 0 ? '園丁' : byId(x.inviter)?.name || '', x.role === 'lead' ? '自己' : x.parent === 0 ? '直屬園丁' : byId(x.parent)?.name || '', x.joined, x.lastVisit || '', x.email, x.contact])])}>匯出成員報表與名單（CSV）</button>}
        {view === 'tree' && <>
          <button className="link" onClick={() => setOpen(Object.fromEntries(MEMBERS.map((x) => [x.id, true])))}>全部展開</button>
          <button className="link" onClick={() => setOpen(Object.fromEntries(MEMBERS.map((x) => [x.id, false])))}>全部收合</button>
        </>}
      </div>
      {view === 'list' && (
        <div className="card filters">
          <input placeholder="搜尋姓名 / 名稱 / 居住地" value={q} onChange={(e) => setQ(e.target.value)} />
          <select value={role} onChange={(e) => setRoleF(e.target.value)}><option value="">全部角色</option><option value="lead">大樹</option><option value="member">小樹（含老樹）</option><option value="elder">老樹</option><option value="trunk">樹幹</option></select>
          <select value={county} onChange={(e) => setCounty(e.target.value)}><option value="">全部縣市（代表區域）</option>{COUNTIES.map(([c]) => <option key={c}>{c}</option>)}</select>
          <select value={status} onChange={(e) => setStatusF(e.target.value)}><option value="">全部狀態</option><option>啟用</option><option>待審核</option><option>停用</option></select>
        </div>
      )}
      <div className="grid-tree">
        <section className="card">
          {view === 'tree' ? (
            isManager ? <Node m={root} depth={0} open={open} toggle={toggle} sel={sel} setSel={setSel} show={() => true} />
              : <>
                <Node m={me} depth={0} open={open} toggle={toggle} sel={sel} setSel={setSel} show={() => true} />
                {MEMBERS.filter((x) => x.inviter === me.id && x.parent !== me.id && x.role === 'member').length > 0 && <>
                  <div className="small muted" style={{ margin: '10px 0 4px' }}>我邀請、但已被園丁移到別處的人</div>
                  {MEMBERS.filter((x) => x.inviter === me.id && x.parent !== me.id && x.role === 'member').map((x) => <div key={x.id} className={'node' + (sel === x.id ? ' sel' : '')} onClick={() => setSel(x.id)}><RolePill role={x.role} m={x} /><Who m={x} /></div>)}
                </>}
              </>
          ) : (
            <>
              <div className="small muted" style={{ marginBottom: 6 }}>共 {list.length} 位</div>
              <table>
                <thead><tr><th>姓名／名稱</th><th>角色</th><th>代表區域</th><th>狀態</th><th>活躍</th></tr></thead>
                <tbody>{list.map((x) => (
                  <tr key={x.id} className={'clickrow' + (sel === x.id ? ' sel' : '') + (x.role === 'lead' ? ' bigrow' : '')} onClick={() => setSel(x.id)}>
                    <td><Who m={x} /></td><td><RolePill role={x.role} m={x} /></td><td>{twLabel(x.township)}</td>
                    <td><span className={'pill st-' + x.status}>{x.status}</span></td><td><Tier m={x} /></td>
                  </tr>
                ))}</tbody>
              </table>
            </>
          )}
        </section>
        <section className="card">
          <h3>成員詳情</h3>
          {!m ? <p className="muted">請點選左側成員</p> : (
            <>
              <div className="row"><span>姓名／名稱</span><Who m={m} /></div>
              <div className="row"><span>角色 / 狀態</span><b><RolePill role={m.role} m={m} />{m.status}</b></div>
              <div className="row"><span>代表區域</span><b>{twLabel(m.township)}{!m.township && m.id !== 0 && <span className="small warn">（未設定，不列入覆蓋）</span>}</b></div>
              {m.id !== 0 && <>
                <div className="row"><span>邀請人（固定）</span><b>{inviter?.name || '—'}</b></div>
                <div className="row"><span>樹根（安置位置）</span><b>{m.role === 'lead' ? '自己' : m.parent === 0 ? '直屬園丁' : byId(m.parent)?.name}</b></div>
                <div className="row"><span>加入日期</span><b>{m.joined}</b></div>
                <div className="row"><span>最後登入</span><b>{m.lastVisit || '尚未登入'} {isOn(m) && <Tier m={m} />}</b></div>
                <div className="partbar">① 成員自己維護的資料</div>
                <div className="row"><span>居住地</span><b>{m.residence || '—'}</b></div>
                <p className="small">{m.bio}</p>
                {canContact ? <ContactBlock key={m.id} m={m} viewer={isManager ? '園丁' : user.name} circleId={circleId} />
                  : <p className="small muted">聯絡方式：你沒有權限查看（同一樹根的成員、其他大樹旗下的人彼此看不到）。</p>}
                {canNote && <>
                  <div className="partbar warm">② 邀請人編輯 <span className="small">（只有撰寫的邀請人與園丁看得到）</span></div>
                  <NoteBox key={m.id + 'n'} title={`邀請人（${inviter?.name || '—'}）的編輯`} value={m.note} editable={isAuthor} onSave={(v) => { m.note = v; bump() }} />
                </>}
              </>}
              {isManager && m.id !== 0 && (
                <div className="notebox">
                  <div className="small"><b>園丁操作</b></div>
                  {m.status === '待審核' && <>
                    <div className="small muted" style={{ margin: '6px 0 4px' }}>核可前確認代表區域（邀請人預填：{twLabel(m.township)}）</div>
                    <TownshipPicker key={m.id} value={TOWNSHIPS.find((t) => t.id === m.township)} onChange={(t) => { setTownship(m.id, t ? t.id : null); bump() }} />
                    <div className="actions">
                      <button className="primary" onClick={() => res(approve(m.id, m.township))}>核可</button>
                      <button onClick={() => res(reject(m.id))}>拒絕</button>
                    </div>
                  </>}
                  {m.status !== '待審核' && <>
                    <div className="small muted" style={{ margin: '6px 0 4px' }}>代表區域（只有園丁能改）</div>
                    <TownshipPicker key={m.id + 't'} value={TOWNSHIPS.find((t) => t.id === m.township)} onChange={(t) => { setTownship(m.id, t ? t.id : null); bump() }} />
                    <div className="actions">
                      {m.status === '啟用' ? <button onClick={() => res(setStatus(m.id, '停用'))}>停用</button> : <button onClick={() => res(setStatus(m.id, '啟用'))}>啟用</button>}
                      {m.role === 'lead' ? <button onClick={() => res(setRole(m.id, 'member'))}>降為小樹</button> : <button onClick={() => res(setRole(m.id, 'lead'))}>升為大樹</button>}
                      <button onClick={() => res(leave(m.id))}>成員離開</button>
                    </div>
                    {(m.role === 'member' || m.role === 'trunk') && (
                      <div className="actions">
                        <select aria-label="安置到哪位大樹" value={moveTo} onChange={(e) => setMoveTo(e.target.value)}><option value="">選擇大樹</option>{leads.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select>
                        <button disabled={!moveTo} onClick={() => res(moveMember(m.id, Number(moveTo)))}>安置／移動到此樹根</button>
                      </div>
                    )}
                    {m.role === 'member' && <div className="actions"><button onClick={() => res(setElder(m.id, !m.elder))}>{m.elder ? '取消老樹' : '設為老樹'}</button></div>}
                    {(m.role === 'member' || m.role === 'trunk') && isOn(m) && leads.length > 0 && (
                      <div className="notebox" aria-label="置換大樹">
                        <div className="small"><b>置換大樹</b>：把這位直接換成大樹，取代某位大樹的位置；原大樹旗下成員與代表區域由他承接。</div>
                        <div className="actions">
                          <select aria-label="被置換的大樹" value={repOld} onChange={(e) => setRepOld(e.target.value)}><option value="">被置換的大樹</option>{leads.map((l) => <option key={l.id} value={l.id}>{l.name}（{twLabel(l.township)}）</option>)}</select>
                          <select aria-label="原大樹的去向" value={repFate} onChange={(e) => setRepFate(e.target.value)}><option value="member">原大樹降為小樹</option><option value="trunk">原大樹變成樹幹</option><option value="disabled">原大樹停用</option></select>
                          {repFate === 'member' && <select aria-label="降為小樹後安置在" value={repPlace} onChange={(e) => setRepPlace(e.target.value)}><option value="">安置在新大樹之下</option>{leads.filter((l) => String(l.id) !== repOld && l.id !== m.id).map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select>}
                        </div>
                        <button disabled={!repOld} onClick={() => res(replaceLead(m.id, Number(repOld), repFate, repPlace ? Number(repPlace) : null))}>置換為大樹</button>
                      </div>
                    )}
                  </>}
                  {msg && <div className="msgbox">{msg}</div>}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </>
  )
}
