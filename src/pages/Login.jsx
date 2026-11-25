import { useEffect, useState } from 'react'
import { demoAccounts, ACCOUNT_LABEL, AGREED, TERMS_VERSION, CIRCLES } from '../data.js'
import { TermsModal } from '../components/Terms.jsx'

// 假流程（原型）：email → 收登入連結 → 點擊連結即登入。沒有密碼、也沒有驗證碼；登入狀態失效就再寄一次。
// 正式版：Supabase Auth 的 Email 魔法連結；角色由後端依 email 判斷，不讓使用者自己選。
const ADMIN_HASH = '#/admin'

export default function Login({ onLogin }) {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => { const f = () => setHash(window.location.hash); window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f) }, [])
  const admin = hash === ADMIN_HASH
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [err, setErr] = useState('')
  const [acct, setAcct] = useState(null)
  const [agree, setAgree] = useState(false)
  const [modal, setModal] = useState(null)
  const accounts = Object.values(demoAccounts()).filter((a) => (a.role === 'admin' || a.role === 'gardener') === admin)
  const reset = () => { setStep('email'); setErr(''); setAcct(null) }
  useEffect(reset, [admin])

  const sendLink = (e) => {
    e.preventDefault()
    const a = accounts.find((x) => x.email === email.trim().toLowerCase())
    // 不透露「這個 email 存在於別的入口」
    if (!a) return setErr('此 email 尚未受邀，或不是這個入口的帳號。')
    setAcct(a); setErr(''); setStep('sent')
  }
  // 原型：以按鈕代表「點擊信中的登入連結」
  const clickLink = () => {
    const c = acct.circleId && acct.role !== 'admin' && acct.role !== 'gardener' ? CIRCLES.find((x) => x.id === acct.circleId) : null
    if (c && c.status === '停用') return setErr('此帳號目前無法登入。') // 整個園區被系統管理者停用：登入被阻擋
    setErr('')
    if (admin && !AGREED.has(acct.email)) return setStep('terms') // 管理端首次登入需同意條款（D3）
    onLogin(acct)
  }
  const steps = admin ? ['email', 'sent', 'terms'] : ['email', 'sent']
  const Err = () => err ? <p className="small warn">{err}</p> : null

  return (
    <div className={'login' + (admin ? ' admin' : '')}>
      <div className="card" style={{ width: 420 }}>
        {admin && <span className="pill gardener" style={{ background: '#f5b342', color: '#3a2800' }}>管理端登入</span>}
        <h1>{admin ? '管理端登入' : '人脈樹管理平台'}</h1>
        <p className="muted">{admin ? '系統管理者與園丁的入口。以 email 登入連結登入，首次登入需同意條款。' : '邀請制・園區管理工具（大樹、小樹、樹幹）'}</p>
        <div className="steps">{steps.map((k, i) => <i key={k} className={steps.indexOf(step) >= i ? 'on' : ''} />)}</div>

        {step === 'email' && (
          <form onSubmit={sendLink}>
            <label>Email<input type="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></label>
            <Err />
            <button className="primary" type="submit" disabled={!email.trim()}>寄送登入連結</button>
            <p className="small muted">不用密碼，也不用輸入驗證碼。系統會寄登入連結到你的信箱，點擊連結即可登入；登入狀態失效時再寄一次。{!admin && '只有被邀請的 email 才能登入。'}</p>
          </form>
        )}
        {step === 'sent' && (
          <div>
            <p className="small">登入連結已寄到 <b>{email}</b>（10 分鐘內有效，只能使用一次）。請到信箱點擊連結。</p>
            <Err />
            <button className="primary" type="button" onClick={clickLink}>（原型）點擊信中的登入連結</button>
            <div className="toolbar" style={{ justifyContent: 'space-between' }}>
              <button type="button" className="link" onClick={reset}>更換 email</button>
              <button type="button" className="link" onClick={() => setErr('已重新寄送（示意）')}>重新寄送</button>
            </div>
            <p className="small muted">原型：不會真的寄信，以上方按鈕代表點擊信中的連結。</p>
          </div>
        )}
        {step === 'terms' && (
          <div>
            <p className="small">首次登入管理端，請先閱讀並同意個資告知與使用條款。</p>
            <div className="termsbtns">
              <button type="button" onClick={() => setModal('terms')}>閱讀個資告知與使用條款</button>
              <button type="button" onClick={() => setModal('privacy')}>閱讀隱私權政策</button>
            </div>
            <label className="small agree"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> 我已閱讀並同意個資告知與使用條款（{TERMS_VERSION}）及隱私權政策。</label>
            <button className="primary" disabled={!agree} onClick={() => { AGREED.add(acct.email); onLogin(acct) }}>同意並登入</button>
          </div>
        )}
        {modal && <TermsModal kind={modal} version={TERMS_VERSION} onClose={() => setModal(null)} />}

        <details className="demo">
          <summary>示範帳號（原型專用，正式版不會有）</summary>
          {accounts.map((a) => (
            <div key={a.role} className="row"><span><span className={'pill ' + a.role}>{ACCOUNT_LABEL[a.role]}</span>{a.email}</span>
              <button type="button" className="link" onClick={() => { reset(); setEmail(a.email) }}>填入</button></div>
          ))}
          <p className="small muted">{admin ? <>這是管理端入口（網址 <code>#/admin</code>）。<a href="#/">回一般登入</a></> : <>系統管理者與園丁走獨立入口：網址加上 <code>#/admin</code>，<a href="#/admin">前往管理端登入</a>（正式版不會放連結）。</>}</p>
        </details>
      </div>
    </div>
  )
}
