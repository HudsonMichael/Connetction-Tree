import { useState } from 'react'
import { CURRENT } from '../data.js'

// 單一園區的設定：名稱描述（園區的停用由系統管理者設定，園丁不能停用）
export default function TreeSettings({ bump }) {
  const [name, setName] = useState(CURRENT.name)
  const [desc, setDesc] = useState(CURRENT.desc)
  const [toast, setToast] = useState('')
  const dirty = name !== CURRENT.name || desc !== CURRENT.desc
  const save = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    CURRENT.name = name.trim(); CURRENT.desc = desc; bump(); setToast('已儲存 ✓'); setTimeout(() => setToast(''), 2000)
  }
  return (
    <>
      <h2>園區設定</h2>
      <p className="muted">這個園區自己的資訊與規則。名稱、描述改了之後，側邊欄與邀請頁都會一併更新。園區的停用只能由系統管理者設定，園丁不能停用自己的園區。</p>
      <div className="grid2">
        <form className="card" onSubmit={save}>
          <h3>基本資訊</h3>
          <label>名稱 *<input value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label>描述<textarea rows="3" value={desc} onChange={(e) => setDesc(e.target.value)} /></label>
          <div className="row"><span>開通日期</span><b>{CURRENT.created}</b></div>
          <div className="row"><span>狀態</span><b>{CURRENT.status}</b></div>
          <div className="actions">
            <button className="primary" type="submit" disabled={!dirty || !name.trim()}>儲存</button>
            {toast && <span className="small" style={{ color: '#0f8b8d' }}>{toast}</span>}
          </div>
        </form>
        <section className="card dashed">
          <h3>園區規則 <span className="pill planned">規劃中</span></h3>
          <p className="small muted">預計放這個園區自己的規則，例如：</p>
          <ul className="sum"><li>邀請連結預設有效天數</li><li>新成員由園丁審核（固定規則，不開放修改）</li><li>成員資料欄位（依領域增減）</li><li>封存這個園區</li></ul>
        </section>
      </div>
    </>
  )
}
