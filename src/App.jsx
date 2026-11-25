import { useEffect, useReducer, useState } from 'react'
import Login from './pages/Login.jsx'
import Accept from './pages/Accept.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Members from './pages/Members.jsx'
import TreeSettings from './pages/TreeSettings.jsx'
import TownshipMap from './pages/TownshipMap.jsx'
import Report from './pages/Report.jsx'
import Profile from './pages/Profile.jsx'
import Invites from './pages/Invites.jsx'
import Circles from './pages/Circles.jsx'
import Gardeners from './pages/Gardeners.jsx'
import Home from './pages/Home.jsx'
import Planned from './pages/Planned.jsx'
import Audit from './pages/Audit.jsx'
import Inbox from './pages/Inbox.jsx'
import Compose from './pages/Compose.jsx'
import { unreadCount } from './messages.js'
import { SEED_INVITES, CURRENT, selectCircle, visibleCircles, ACCOUNT_LABEL, ownerProfile, byId } from './data.js'

const Badge = ({ n }) => (n > 0 ? <i className="badge">{n}</i> : null)
const ALL = { circles: Circles, gardeners: Gardeners, dashboard: Dashboard, members: Members, treeset: TreeSettings, map: TownshipMap, report: Report, invites: Invites, profile: Profile, home: Home,
  inbox: Inbox,
  messages: (p) => <Compose mode={p.user.role === 'gardener' ? 'owner' : p.user.role === 'bigtree' ? 'lead' : p.user.role === 'admin' ? 'platform' : 'low'} {...p} />,
  platformmsg: (p) => <Compose mode="platform" {...p} />,
  billing: (p) => <Planned kind="billing" {...p} />, audit: () => <Audit scope="platform" />, treeaudit: () => <Audit scope="tree" />, settings: (p) => <Planned kind="settings" {...p} /> }
// 平台管理選單（僅系統管理者；與園丁權限不重疊，不經營園區）；規劃中的項目先占位
const PLATFORM_ITEMS = [['gardeners', '園丁與園區'], ['audit', '稽核紀錄'], ['billing', '方案與計費', true], ['settings', '平台設定', true]]
// 單一園區底下的功能（園丁）
const TREE_ITEMS = [['dashboard', '儀表板'], ['members', '成員名單'], ['map', '368 拓展圖'], ['report', '園區報告'], ['invites', '邀請管理'], ['treeaudit', '稽核紀錄'], ['treeset', '園區設定']]
// 大樹、小樹、樹幹沒有「園區清單」概念，只有一排簡單選單
const FLAT_NAV = {
  bigtree: [['home', '園區資訊'], ['members', '我的成員'], ['map', '368 拓展圖'], ['report', '園區報告'], ['invites', '邀請小樹']],
  smalltree: [['home', '園區資訊']],
  trunk: [['home', '園區資訊']],
}
const BANNER = {
  admin: '系統管理者視角：只管租戶（園丁帳號、園區的開通與停用、系統公告），不經營園區，也看不到園區內的成員與內容；與園丁的權限不重疊。',
  gardener: '園丁視角：只看得到自己的園區，可邀請、審核、安置、置換；不能停用自己的園區，也不能自行加開園區。',
  bigtree: '大樹視角：看得到自己樹根的成員與負責的鄉鎮，可邀請小樹；看不到其他大樹旗下的人。',
  smalltree: '小樹視角：只能維護自己的資料、看同一樹根成員的基本資料與邀請人；訊息只能單一發給邀請人或安置人。',
  trunk: '樹幹視角：園丁直屬、尚未分配的暫時區域，權限同小樹；訊息只能單一發給邀請人或安置人。',
}

export default function App() {
  const [user, setUser] = useState(null)
  const [page, setPage] = useState('circles')
  const [circleId, setCircleId] = useState('c1')
  const [open, setOpen] = useState(null) // 側邊欄目前展開的園區
  const [navOpen, setNavOpen] = useState(false) // 手機版：側欄抽屜是否開啟
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => { const f = () => setHash(window.location.hash); window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f) }, [])
  const inviteCode = (hash.match(/^#\/invite\/(.+)$/) || [])[1]
  const [invites, setInvites] = useState(SEED_INVITES)
  const [, bump] = useReducer((x) => x + 1, 0)
  selectCircle(circleId) // 原型：把頁面讀取的資料切到目前選擇的園區
  if (inviteCode) return <Accept code={inviteCode} invites={invites} setInvites={setInvites} onExit={() => { window.location.hash = '' }} />
  if (!user) {
    return <Login onLogin={(u) => {
      setUser(u); setCircleId(u.circleId); setOpen(null)
      setPage(u.role === 'admin' ? 'gardeners' : u.role === 'gardener' ? 'circles' : 'home')
    }} />
  }
  const P = ALL[page]
  const isManager = user.role === 'gardener' // 園丁：可管理自己的園區（系統管理者與園丁權限不重疊，不屬於此類）
  const trees = visibleCircles(user)
  const switchTo = (id, to) => { setCircleId(id); setOpen(id); if (to) setPage(to) }
  const clickTree = (id) => { if (open === id) setOpen(null); else switchTo(id, 'dashboard') }
  const me = user.role === 'admin' ? ownerProfile('admin') : isManager ? ownerProfile(user.gardenerId) : byId(user.memberId)
  const onTreePage = TREE_ITEMS.some(([k]) => k === page)
  return (
    <div className="shell">
      <header className="topbar">
        <button className="menubtn" aria-label="開啟選單" aria-expanded={navOpen} onClick={() => setNavOpen(!navOpen)}>☰</button>
        <b>人脈樹管理平台</b><small>DEV 原型</small>
      </header>
      {navOpen && <div className="scrim" onClick={() => setNavOpen(false)} />}
      <aside className={'side' + (navOpen ? ' open' : '')} onClick={(e) => { const b = e.target.closest('button'); if (b && !b.classList.contains('tree') && !b.classList.contains('ptitle') && !b.classList.contains('navgroup')) setNavOpen(false) }}>
        <div className="brand">人脈樹管理平台<small>DEV 原型</small></div>

        {user.role === 'admin' ? null : isManager ? (
          <nav>
            <button className={'navgroup' + (page === 'circles' ? ' on' : '')} onClick={() => { setOpen(null); setPage('circles') }}>我的園區</button>
            {trees.map((c) => (
              <div key={c.id}>
                <button className={'tree' + (open === c.id ? ' open' : '')} onClick={() => clickTree(c.id)}>
                  <span className="arr">{open === c.id ? '▾' : '▸'}</span><span className="tname" title={c.name}>{c.name}</span>
                </button>
                {open === c.id && TREE_ITEMS.map(([k, l]) => (
                  <button key={k} className={'sub' + (page === k && circleId === c.id ? ' on' : '')} onClick={() => switchTo(c.id, k)}>{l}</button>
                ))}
              </div>
            ))}
          </nav>
        ) : (
          <nav>{FLAT_NAV[user.role].map(([k, l]) => (
            <button key={k} className={page === k ? 'on' : ''} onClick={() => setPage(k)}>{l}</button>
          ))}</nav>
        )}

        <div className="personal inbox">
          <div className="ptitle">訊息管理</div>
          <button className={page === 'inbox' ? 'on' : ''} onClick={() => { setOpen(null); setPage('inbox') }}>收件匣<Badge n={unreadCount(user)} /></button>
          <button className={(user.role === 'admin' ? page === 'platformmsg' : page === 'messages') ? 'on' : ''} onClick={() => { setOpen(null); setPage(user.role === 'admin' ? 'platformmsg' : 'messages') }}>發送訊息</button>
        </div>

        <div className="personal">
          <div className="ptitle">個人資料管理</div>
          <button className={page === 'profile' ? 'on' : ''} onClick={() => { setOpen(null); setPage('profile') }}>我的資料{!me?.profileDone && <em>待完成</em>}</button>
        </div>

        {user.role === 'admin' && (
          <div className="platform">
            <div className="ptitle">平台管理</div>
            {PLATFORM_ITEMS.map(([k, l, soon]) => (
              <button key={k} className={page === k ? 'on' : ''} onClick={() => { setOpen(null); setPage(k) }}>{l}{soon && <em>規劃中</em>}</button>
            ))}
          </div>
        )}

        <div className="me">
          <div>{me?.name || user.name}</div>
          <div><span className={'pill ' + user.role}>{ACCOUNT_LABEL[user.role]}</span></div>
          <button className="link" onClick={() => setUser(null)}>登出／切換帳號</button>
        </div>
      </aside>
      <main>
        <div className="banner">原型畫面・示意資料，尚未串接後端｜{BANNER[user.role]}</div>
        {onTreePage && <div className="crumb">園區：<b>{CURRENT.name}</b>{CURRENT.status === '停用' && <span className="pill off">已被系統管理者停用</span>}</div>}
        <P key={circleId + page} go={setPage} user={user} isManager={isManager} invites={invites} setInvites={setInvites} switchTo={switchTo} selectTree={setCircleId} bump={bump} circleId={circleId} />
      </main>
    </div>
  )
}
