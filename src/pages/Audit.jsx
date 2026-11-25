import { AUDIT, CURRENT } from '../data.js'

// 稽核紀錄（唯讀、只增不改）。scope=platform：系統層事件（系統管理者）；scope=tree：自己園區範圍（園丁）
export default function Audit({ scope }) {
  const rows = scope === 'platform' ? AUDIT.filter((a) => a.circleId == null && a.action !== '讀取訊息' && a.action !== '發送訊息') : AUDIT.filter((a) => a.circleId === CURRENT.id)
  return (
    <div className={scope === 'platform' ? 'platformpage' : ''}>
      <h2>稽核紀錄 {scope === 'tree' && <span className="small muted">（{CURRENT.name}）</span>}</h2>
      <p className="muted">{scope === 'platform' ? '系統層事件：園丁帳號的開立與停用、園區的開通與停用等。系統管理者看不到園區裡的事件與內容。' : '這個園區範圍內的事件，園丁唯讀。包含查看聯絡方式、安置與移動、停用、訊息的發送與已讀紀錄（誰、何時、哪一則，不含訊息內容）。'}紀錄只能新增，不能修改或刪除。</p>
      <section className="card">
        {!rows.length ? <p className="muted">目前沒有紀錄。</p> : (
          <table>
            <thead><tr><th>時間</th><th>誰</th><th>事件</th><th>對象</th></tr></thead>
            <tbody>{rows.map((a, i) => <tr key={i}><td>{a.at}</td><td>{a.actor}</td><td>{a.action}</td><td>{a.target}</td></tr>)}</tbody>
          </table>
        )}
      </section>
    </div>
  )
}
