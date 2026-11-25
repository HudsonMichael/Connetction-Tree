// 平台管理的佔位頁：先在選單與畫面上占位，之後再逐項實作
const INFO = {
  billing: { title: '方案與計費', desc: '管理園丁（租戶）的訂閱方案與用量上限；園區數量上限目前暫定 5 個，由系統管理者逐一開通。', items: ['方案等級（可開幾個園區、每個園區成員上限）', '各園丁目前方案與到期日', '用量統計與帳單紀錄', '逾期或超量時的處理規則'] },
  settings: { title: '平台設定', desc: '整個平台共用的規則與文字。', items: ['邀請連結預設有效天數與一次性規則', '登入連結有效時間、登入狀態保留天數與活躍天數設定', '個資告知與使用條款（全平台一份）與版本', '資料存放地區的告知內容'] },
}

export default function Planned({ kind }) {
  const i = INFO[kind]
  return (
    <div className="platformpage">
      <h2>{i.title} <span className="pill planned">規劃中</span></h2>
      <p className="muted">{i.desc}</p>
      <section className="card dashed">
        <h3>預計包含</h3>
        <ul className="sum">{i.items.map((x) => <li key={x}>{x}</li>)}</ul>
        <p className="small muted">此頁為佔位，功能尚未實作，待需求確認後再設計畫面。</p>
      </section>
    </div>
  )
}
