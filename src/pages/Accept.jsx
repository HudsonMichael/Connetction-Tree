import { useState } from 'react'
import { CIRCLES, REPORT_DATE, byId, NAME_OK, acceptInvite, emailTaken, TERMS_VERSION, twLabel } from '../data.js'
import { TermsModal } from '../components/Terms.jsx'

// 受邀者看到的流程（C6）：開啟連結 → 以預綁 Email 收登入連結並點擊 → 確認姓名 → 勾選同意條款 → 建立帳號（待審核）
export default function Accept({ code, invites, setInvites, onExit }) {
  const inv = invites.find((i) => i.code === code)
  const [step, setStep] = useState('open')
  const [name, setName] = useState(inv?.name || '')
  const [err, setErr] = useState('')
  const [agree, setAgree] = useState(false)
  const [modal, setModal] = useState(null)
  const circle = inv && CIRCLES.find((c) => c.id === inv.circle)
  const status = inv && (inv.status === '待使用' && inv.expires < REPORT_DATE ? '已過期' : inv.status)
  const inviterName = inv && (inv.byId === 0 ? '園丁' : circle.members.find((m) => m.id === inv.byId)?.name || inv.by)
  const rootName = inv && (inv.role === 'lead' || !inv.root ? '直屬園丁' : circle.members.find((m) => m.id === inv.root)?.name)
  const steps = ['open', 'link', 'terms', 'done']

  const Shell = ({ children }) => (
    <div className="login">
      <div className="card acceptcard">
        <span className="pill planned">受邀者畫面（示意）</span>
        {children}
        <p className="small muted" style={{ marginTop: 14 }}><button className="link" onClick={onExit}>← 離開這個畫面，回到系統</button></p>
      </div>
    </div>
  )

  // 連結不存在、已過期、已作廢、已使用、Email 已有成員身分：一律不透露原因（過期例外）
  if (!inv || (step !== 'done' && step !== 'blocked' && status !== '待使用')) {
    return (
      <Shell>
        <h1>{status === '已過期' ? '邀請連結已過期' : '此邀請連結無法使用'}</h1>
        <p className="muted">{status === '已過期' ? '這個連結已超過有效期限。請向邀請你的人重新索取連結。' : '請向邀請你的人確認，或請對方重新產生連結。'}</p>
      </Shell>
    )
  }

  const sendLink = (e) => {
    e.preventDefault()
    if (!name.trim() || !NAME_OK(name)) return setErr('姓名最多 10 字，不可使用特殊字元')
    setErr(''); setStep('link')
  }
  const clickLink = () => {
    setErr('')
    if (emailTaken(inv.email)) { setInvites(invites.map((x) => x.code === inv.code ? { ...x, status: '無法使用' } : x)); return setStep('blocked') }
    setStep('terms')
  }
  const create = () => {
    acceptInvite(inv, name)
    setInvites(invites.map((x) => x.code === inv.code ? { ...x, status: '已使用' } : x))
    setStep('done')
  }

  if (step === 'blocked') return <Shell><h1>此邀請連結無法使用</h1><p className="muted">請向邀請你的人確認。</p></Shell>

  return (
    <Shell>
      <h1>您受邀加入「{circle.name}」</h1>
      <div className="steps">{steps.map((k, i) => <i key={k} className={steps.indexOf(step) >= i ? 'on' : ''} />)}</div>
      <div className="notebox">
        <div className="row"><span>邀請人</span><b>{inviterName}</b></div>
        <div className="row"><span>樹根（安置位置）</span><b>{rootName}</b></div>
        <div className="row"><span>身分</span><b>{inv.role === 'lead' ? '大樹（鄉鎮代表）' : inv.role === 'trunk' ? '樹幹（園丁直屬）' : '小樹'}</b></div>
        {inv.township && <div className="row"><span>預計代表區域</span><b>{twLabel(inv.township)}</b></div>}
        <div className="row"><span>連結有效至</span><b>{inv.expires}</b></div>
      </div>

      {step === 'open' && (
        <form onSubmit={sendLink}>
          <label>你的 Email（邀請人已預先綁定，不能更改）<input value={inv.email} disabled /></label>
          <label>確認你的姓名（最多 10 字）<input value={name} maxLength={10} onChange={(e) => setName(e.target.value)} /></label>
          {err && <p className="small warn">{err}</p>}
          <button className="primary" type="submit" disabled={!name.trim()}>寄送登入連結</button>
          <p className="small muted">不用設定密碼，也不用輸入驗證碼。系統會寄登入連結到上面的 Email，點擊連結即完成驗證。</p>
        </form>
      )}
      {step === 'link' && (
        <div>
          <p className="small">登入連結已寄到 <b>{inv.email}</b>（10 分鐘內有效，只能使用一次）。請到信箱點擊連結。</p>
          <button className="primary" type="button" onClick={clickLink}>（原型）點擊信中的登入連結</button>
          <p className="small muted">原型：不會真的寄信，以上方按鈕代表點擊信中的連結。</p>
        </div>
      )}
      {step === 'terms' && (
        <div>
          <p className="small">最後一步：請閱讀並同意個資告知與使用條款。</p>
          <div className="termsbtns">
            <button type="button" onClick={() => setModal('terms')}>閱讀個資告知與使用條款</button>
            <button type="button" onClick={() => setModal('privacy')}>閱讀隱私權政策</button>
          </div>
          <label className="small agree"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> 我已閱讀並同意個資告知與使用條款（{TERMS_VERSION}）及隱私權政策。</label>
          <button className="primary" disabled={!agree} onClick={create}>同意並建立帳號</button>
        </div>
      )}
      {step === 'done' && (
        <div>
          <div className="leadcard"><b>帳號已建立，狀態為「待審核」。</b><p className="small">園丁核可後，你就能登入使用。核可前無法登入。你同意的條款版本（{TERMS_VERSION}）與時間已記錄。</p></div>
          <p className="small muted">登入後請到「我的資料」補齊名稱、居住地、自我介紹、頭像與其他聯絡方式。</p>
          <button className="primary" onClick={onExit}>回到登入頁</button>
        </div>
      )}
      {modal && <TermsModal kind={modal} version={TERMS_VERSION} onClose={() => setModal(null)} />}
    </Shell>
  )
}
