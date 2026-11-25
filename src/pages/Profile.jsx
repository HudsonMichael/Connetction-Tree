import { useState } from 'react'
import { ACCOUNT_LABEL, AVATARS, NAME_OK, byId, ownerProfile, twLabel, tierOf, isOn, roleName } from '../data.js'
import { Who } from '../components/Who.jsx'
import TownshipPicker from '../components/TownshipPicker.jsx'
import { TOWNSHIPS } from '../data.js'

export default function Profile({ user }) {
  const me = user.memberId != null ? byId(user.memberId) : ownerProfile(user.role === 'admin' ? 'admin' : user.gardenerId) // 系統管理者／園丁：帳號層級資料
  const init = { name: me.name, nick: me.nick || '', avatar: me.avatar ?? 0, residence: me.residence || '', contact: me.contact || '', bio: me.bio || '', hide: !!me.hideContact }
  const [f, setF] = useState(init)
  const [saved, setSaved] = useState(init)
  const [toast, setToast] = useState('')
  const dirty = JSON.stringify(f) !== JSON.stringify(saved)
  const set = (k, v) => setF({ ...f, [k]: v })
  const canHide = user.role === 'bigtree' || user.role === 'gardener' // 大樹、園丁可選擇對自己直接邀請的人隱藏；小樹、老樹、樹幹固定公開
  const nameErr = !f.name.trim() ? '姓名為必填' : !NAME_OK(f.name) ? '姓名最多 10 字，不可使用特殊字元' : ''
  const nickErr = f.nick && !NAME_OK(f.nick) ? '名稱最多 10 字，不可使用特殊字元' : ''
  const save = (e) => {
    e.preventDefault()
    if (nameErr || nickErr) return
    Object.assign(me, { name: f.name.trim(), nick: f.nick.trim(), avatar: f.avatar, residence: f.residence, contact: f.contact, bio: f.bio, hideContact: canHide && f.hide, profileDone: !!(f.bio && f.contact) })
    setSaved(f); setToast('已儲存 ✓'); setTimeout(() => setToast(''), 2000)
  }
  const preview = { ...me, name: f.name || '（姓名）', nick: f.nick, avatar: f.avatar }
  return (
    <>
      <h2>我的個人資料</h2>
      <p className="muted">所有帳號（系統管理者、園丁、大樹、小樹、老樹、樹幹）登入後都能編輯自己的資料。標 * 為必填。這裡只有你自己維護的內容；邀請人對你的編輯不會顯示在這裡。</p>
      <div className="grid-tree">
        <form className="card" onSubmit={save}>
          <h3>基本資料</h3>
          <div className="two">
            <label>姓名 *（邀請時使用的名字，最多 10 字）<input value={f.name} maxLength={10} onChange={(e) => set('name', e.target.value)} /></label>
            <label>名稱（暱稱或別稱，最多 10 字）<input value={f.nick} maxLength={10} onChange={(e) => set('nick', e.target.value)} placeholder="選填" /></label>
          </div>
          {(nameErr || nickErr) && <p className="small warn">{nameErr || nickErr}</p>}
          <label>頭像（從預設頭像選一個）</label>
          <div className="avpick">{AVATARS.map((a, i) => <button type="button" key={i} className={f.avatar === i ? 'on' : ''} onClick={() => set('avatar', i)}>{a}</button>)}</div>
          <div className="two">
            <label>角色（不可自行修改）<input value={user.memberId != null ? roleName(me) : ACCOUNT_LABEL[user.role]} disabled /></label>
            <label>代表區域（只有園丁能設定）<input value={user.memberId != null ? twLabel(me.township) : '—'} disabled /></label>
          </div>
          <div className="field">
            <div>居住地（介紹用，不進統計）</div>
            <TownshipPicker value={TOWNSHIPS.find((t) => t.county + t.name === f.residence)} onChange={(t) => set('residence', t ? t.county + t.name : '')} placeholder="選填：輸入關鍵字搜尋" />
          </div>
          <label style={{ marginTop: 10 }}>自我介紹<textarea rows="4" maxLength="300" value={f.bio} onChange={(e) => set('bio', e.target.value)} /><span className="small muted">{f.bio.length}/300</span></label>
          <p className="small warn">請勿將個資、聯絡方式與隱密資訊寫在自我介紹上，以免被有心人士不當利用。</p>
          <h3 style={{ marginTop: 14 }}>聯絡方式 <span className="pill">🔒 固定規則</span></h3>
          <p className="small muted">聯絡方式不開放同儕互看。看得到的人：你的<b>邀請人</b>、你邀請的人（含已被移到別處者）、大樹（看旗下小樹）與<b>園丁</b>；每次查看都會留下紀錄。{user.role === 'smalltree' || user.role === 'trunk' ? '小樹（含老樹）與樹幹的聯絡方式固定公開給上述對象，不能自行選擇。' : ''}</p>
          <label>其他聯絡方式（可填電話或 LINE ID）<input value={f.contact} onChange={(e) => set('contact', e.target.value)} /></label>
          {canHide && (
            <label className="small" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="checkbox" checked={f.hide} onChange={(e) => set('hide', e.target.checked)} style={{ width: 'auto' }} />
              對我直接邀請的人隱藏我的聯絡方式（園丁與上層仍可看到）
            </label>
          )}
          <label>Email（登入帳號，不可自行修改；更換信箱請聯絡管理方）<input value={me.email} disabled /></label>
          <div className="toolbar" style={{ justifyContent: 'flex-start', marginTop: 12 }}>
            <button className="primary" type="submit" disabled={!dirty || !!nameErr || !!nickErr}>儲存變更</button>
            <button type="button" disabled={!dirty} onClick={() => setF(saved)}>還原</button>
            {dirty && <span className="small warn">尚未儲存</span>}{toast && <span className="small" style={{ color: '#0f8b8d' }}>{toast}</span>}
          </div>
        </form>
        <div>
          <section className="card">
            <h3>同一樹根的成員看到的樣子（預覽）</h3>
            <div className="row"><span>姓名／名稱</span><Who m={preview} /></div>
            <div className="row"><span>居住地</span><b>{f.residence || '—'}</b></div>
            <div className="row"><span>代表區域</span><b>{user.memberId != null ? twLabel(me.township) : '—'}</b></div>
            <div className="row"><span>最後登入</span><b>{me.lastVisit || '—'}{user.memberId != null && isOn(me) && <> <span className={'pill t-' + tierOf(me)}>{tierOf(me)}</span></>}</b></div>
            <p className="small">{f.bio}</p>
            <div className="small muted">聯絡方式不對同儕公開；邀請人、你邀請的人、大樹（旗下小樹）與園丁看得到{canHide && f.hide ? '（你已對直接邀請的人隱藏）' : ''}。</div>
          </section>
          <section className="card dashed">
            <h3>服務領域</h3>
            <p className="small muted">資料庫保留此欄位，目前介面不開放填寫。</p>
          </section>
        </div>
      </div>
    </>
  )
}
