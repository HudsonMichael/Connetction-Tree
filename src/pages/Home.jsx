import { CURRENT, MEMBERS, byId, ownerName, ownerProfile, twLabel, tierOf, tierCount, isOn, leadScope, TIERS, people } from '../data.js'
import { Stat } from '../components/ui.jsx'
import { Who } from '../components/Who.jsx'

const Tier = ({ m }) => <span className={'pill t-' + tierOf(m)}>{tierOf(m)}</span>

// 大樹、小樹（含老樹）、樹幹的首頁：園區資訊、邀請人／樹根的資料、同一樹根（樹幹則是其他樹幹）的成員（只有基本資料）
export default function Home({ user, go }) {
  const me = byId(user.memberId)
  const big = user.role === 'bigtree'
  const trunk = user.role === 'trunk'
  const inviter = me.inviter === 0 ? ownerProfile(CURRENT.owner) : byId(me.inviter)
  const rootM = !big && !trunk && me.parent ? byId(me.parent) : null
  const all = people()
  const leads = all.filter((m) => m.role === 'lead').length
  const placed = MEMBERS.filter((m) => m.parent === me.id && m.role === 'member' && isOn(m))
  const invited = MEMBERS.filter((m) => m.inviter === me.id && isOn(m))
  const tc = tierCount(placed)
  const scope = big ? [...leadScope(me.id)] : []
  const peers = trunk ? MEMBERS.filter((m) => m.role === 'trunk' && m.id !== me.id && isOn(m)) : !big ? MEMBERS.filter((m) => m.role === 'member' && m.parent === me.parent && m.id !== me.id && isOn(m)) : []
  const hiddenFromMe = inviter?.hideContact
  return (
    <>
      <h2>園區資訊</h2>
      <section className="card">
        <h3>{CURRENT.name}</h3>
        <p className="muted small">{CURRENT.desc}</p>
        <div className="row"><span>園丁</span><b>{ownerName(CURRENT.owner)}</b></div>
        <div className="row"><span>我的代表區域</span><b>{twLabel(me.township)}</b></div>
        <div className="row"><span>加入日期</span><b>{me.joined}</b></div>
      </section>
      <div className="grid4">
        <Stat label="園區成員" value={all.length} sub="啟用中" />
        <Stat label="大樹" value={leads} sub="鄉鎮代表" />
        <Stat label="小樹（含老樹）" value={all.filter((m) => m.role === 'member').length} sub={`樹幹 ${all.filter((m) => m.role === 'trunk').length}`} />
        {big ? <Stat label="我的旗下人數" value={placed.length} sub={`我邀請的人數 ${invited.length}`} /> : <Stat label={trunk ? '樹幹（園丁直屬）' : '同一樹根的成員'} value={peers.length + 1} sub="含我自己" />}
      </div>
      <p className="small muted">你看得到園區的總數；看不到不在你範圍內的成員是誰。{trunk && ' 你是樹幹：園丁直屬、尚未分配，之後可能被安置到某位大樹之下成為小樹。'}</p>

      {big && (
        <section className="card">
          <h3>我的旗下</h3>
          <div className="row"><span>旗下人數（安置在我的樹根下）</span><b>{placed.length} 位</b></div>
          <div className="row"><span>我邀請的人數</span><b>{invited.length} 位</b></div>
          <p className="small muted">被安置在你底下的人，不一定是你邀請的，所以兩個數字可能不同。</p>
          <div className="row"><span>旗下活躍程度</span><b>{TIERS.map((t) => <span key={t} className={'pill t-' + t}>{t} {tc[t]}</span>)}</b></div>
          <div className="row"><span>我負責的鄉鎮（自己與旗下小樹的代表區域）</span><b>{scope.length} 個</b></div>
        </section>
      )}

      {inviter && (
        <section className="card">
          <h3>我的邀請人</h3>
          <div className="row"><span>姓名／名稱</span><Who m={inviter} /></div>
          <div className="row"><span>角色</span><b>{me.inviter === 0 ? '園丁' : '大樹'}</b></div>
          {me.inviter !== 0 && <div className="row"><span>代表區域</span><b>{twLabel(inviter.township)}</b></div>}
          {inviter.bio && <p className="small">{inviter.bio}</p>}
          <h3 style={{ marginTop: 12 }}>聯絡方式</h3>
          {hiddenFromMe ? <p className="muted small">對方選擇不對自己邀請的人公開聯絡方式，請透過站內訊息聯絡。</p> : <>
            <div className="row"><span>其他聯絡方式</span><b>{inviter.contact || '尚未提供'}</b></div>
            <div className="row"><span>Email</span><b>{inviter.email || '尚未提供'}</b></div>
          </>}
          <p className="small muted">每個人只看得到自己邀請人的聯絡方式；其他成員的聯絡方式不開放。</p>
        </section>
      )}

      {rootM && rootM.id !== me.inviter && (
        <section className="card">
          <h3>我的樹根（上層安置人）</h3>
          <div className="row"><span>姓名／名稱</span><Who m={rootM} /></div>
          <div className="row"><span>代表區域</span><b>{twLabel(rootM.township)}</b></div>
          {rootM.bio && <p className="small">{rootM.bio}</p>}
          <p className="small muted">你被安置在這位大樹的樹根下；你的邀請人沒有改變。這裡只有基本資料，沒有聯絡方式。</p>
        </section>
      )}

      {!big && (
        <section className="card">
          <h3>{trunk ? '其他樹幹（基本資料）' : '同一樹根的成員（基本資料）'}</h3>
          {!peers.length && <p className="muted small">目前沒有其他成員。</p>}
          {peers.map((p) => (
            <div key={p.id} className="notebox">
              <div className="row"><Who m={p} /><span className="small muted">{p.residence}</span></div>
              <p className="small">{p.bio}</p>
            </div>
          ))}
          <p className="small muted">{trunk ? '樹幹只看得到其他樹幹的介紹，看不到大樹與其旗下的人；' : '只有同一個樹根底下的成員彼此看得到介紹，'}聯絡方式不公開，看不到其他樹根的成員。</p>
        </section>
      )}

      {big ? (
        <section className="card">
          <p className="small muted">旗下小樹與你邀請的人，可以在「我的成員」查看，查看聯絡方式會留下紀錄。</p>
          <div className="actions"><button onClick={() => go('members')}>前往我的成員</button><button className="primary" onClick={() => go('invites')}>邀請小樹加入</button></div>
        </section>
      ) : (
        <section className="card">
          <p className="small muted">你可以維護自己的資料與聯絡方式；你的聯絡方式固定公開給邀請人與有權限的上層，不能自行選擇。訊息只能單一發給邀請人或安置人。</p>
          <button className="primary" onClick={() => go('profile')}>編輯我的資料</button>
        </section>
      )}
    </>
  )
}
