// 原型用示意資料（全部為虛構，隨機種子固定，重新整理不會變）
import geo from './townships.json'
// 鄉鎮資料：內政部國土測繪中心（經 taiwan-atlas 整理，2021-09 版，MIT），共 368 筆
export const MAP = { w: geo.w, h: geo.h, paths: geo.paths, islands: geo.islands }
const ORDER = ['新北市', '台北市', '桃園市', '台中市', '台南市', '高雄市', '宜蘭縣', '新竹縣', '苗栗縣', '彰化縣', '南投縣', '雲林縣', '嘉義縣', '屏東縣', '台東縣', '花蓮縣', '澎湖縣', '基隆市', '新竹市', '嘉義市', '金門縣', '連江縣']
export const COUNTIES = ORDER.map((c) => [c, geo.townships.filter((t) => t.county === c).length])
export const TOTAL_TOWNSHIPS = geo.townships.length // 368

function rng(seed) {
  let s = seed
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296)
}

const SURNAMES = ['陳', '林', '黃', '張', '李', '王', '吳', '劉', '蔡', '楊', '許', '鄭', '謝', '郭', '洪', '曾', '邱', '廖', '賴', '徐']
const GIVEN = ['怡君', '志明', '淑芬', '建宏', '雅婷', '俊傑', '美玲', '家豪', '佩珊', '宗翰', '惠雯', '承恩', '怡萱', '柏翰', '雅雯', '冠宇']
const NICKS = ['', '', '小陳', '阿志', '芬芬', '老宏', 'Amy', '大傑', '小玲', '豪哥', '', '翰翰']
// 預設頭像：資料庫只存代號（索引），畫面由前端繪出，不存圖片
export const AVATARS = ['🌱', '🌿', '🍀', '🌳', '🌸', '🌻', '🍃', '🌾', '🪴', '🌼', '🍁', '🌲']
const NOTES = ['面談時很熱心，在地人脈廣，介紹進來的朋友都很可靠。（示意）', '認識多年的合作對象，專業可信，但較忙，回覆速度偏慢。（示意）', '社區活動認識的夥伴，執行力強，適合負責在地聯繫。（示意）', '']
const jitter = (iso, k) => { const d = new Date(iso); d.setUTCDate(d.getUTCDate() - k); return d.toISOString().slice(0, 10) }
const monthsAgo = (n) => { const d = new Date('2026-10-27'); d.setMonth(d.getMonth() - n); return d.toISOString().slice(0, 10) }

// 時間與活躍程度（E1）：最後登入 ≤3 天＝活躍；≤7 天＝中等；其餘（含從未登入）＝冷卻。天數為可調整設定值
export const REPORT_DATE = '2026-10-27'
export const THRESH = { active: 3, mid: 7 }
const daysAgo = (n) => { const d = new Date(REPORT_DATE + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0, 10) }
export const tierOf = (m) => {
  if (!m.lastVisit) return '冷卻'
  const d = Math.round((new Date(REPORT_DATE) - new Date(m.lastVisit)) / 864e5)
  return d <= THRESH.active ? '活躍' : d <= THRESH.mid ? '中等' : '冷卻'
}
export const TIERS = ['活躍', '中等', '冷卻']
export const isOn = (m) => m.status === '啟用'
// 姓名、名稱規則：最多 10 字、不可用特殊字元（此處以中英文與數字為限，細節開發時定義）
export const NAME_OK = (v) => v.length <= 10 && /^[一-龥A-Za-z0-9]*$/.test(v)

// 鄉鎮清單（reps：目前所選園區中，代表區域落在該鄉鎮的「啟用」成員 id）
export const TOWNSHIPS = ORDER.flatMap((c) => geo.townships.filter((t) => t.county === c).map((t, i) => ({ ...t, no: i + 1, rep: null, reps: [] })))
const twById = (id) => TOWNSHIPS.find((t) => t.id === id)
export const twLabel = (id) => { const t = twById(id); return t ? t.county + t.name : '—' }

function makeOwner(name) {
  return { id: 0, name: '系統管理者（示意）', nick: '', avatar: 0, role: 'owner', parent: null, inviter: null, org: name, township: null, residence: '', joined: monthsAgo(6), lastVisit: REPORT_DATE, profileDone: true,
    contact: '0912-345-678', email: 'owner@example.com', bio: '平台維運與管理。', status: '啟用', hideContact: false, note: '' }
}

// 產生一個示意園區：回傳 { members }；每位成員有「邀請人 inviter」（固定）與「安置位置 parent＝樹根」；直屬園丁的成員是「樹幹」
function genTree(seed, ownerOrg, leadCounties, kidsMin, kidsSpan, ownerKids) {
  const rand = rng(seed), r2 = rng(seed + 7)
  const pick = (a) => a[Math.floor(rand() * a.length)]
  const members = [makeOwner(ownerOrg)]
  let uid = 1
  const free = [...TOWNSHIPS].sort(() => rand() - 0.5)
  const visit = (lead) => { const r = rand(); return lead ? daysAgo(Math.floor(r * 7)) : r < 0.3 ? daysAgo(Math.floor(rand() * 4)) : r < 0.55 ? daysAgo(4 + Math.floor(rand() * 4)) : r < 0.85 ? daysAgo(8 + Math.floor(rand() * 25)) : null }
  const mk = (role, parent, t, joined) => {
    const n = String(1000 + Math.floor(r2() * 8999))
    const home = TOWNSHIPS[Math.floor(r2() * TOWNSHIPS.length)]
    const m = { id: uid++, name: pick(SURNAMES) + pick(GIVEN), nick: pick(NICKS), avatar: Math.floor(r2() * AVATARS.length), role, parent, inviter: parent, org: '', township: t.id, residence: home.county + home.name, joined,
      profileDone: rand() > 0.2, contact: 'LINE：demo_' + (uid - 1) + '／09' + String(10 + Math.floor(r2() * 80)) + '-' + n.slice(0, 3) + '-' + n.slice(1, 4), email: 'demo' + (uid - 1) + '@example.com',
      bio: '關心在地發展，期望串連鄉鎮資源，推動社區行動。（示意文字）', hideContact: false,
      lastVisit: visit(role === 'lead'), note: NOTES[uid % NOTES.length] }
    m.status = (role === 'member' || role === 'trunk') && rand() < 0.1 ? '停用' : role === 'trunk' && m.id % 7 === 0 ? '待審核' : '啟用'
    if (m.status === '待審核') { m.lastVisit = null; if (m.id % 2) m.township = null }
    m.joined = jitter(joined, (m.id * 11) % 27)
    members.push(m)
    return m
  }
  leadCounties.forEach((county, i) => {
    const lt = free.splice(free.findIndex((t) => t.county === county), 1)[0]
    const lead = mk('lead', 0, lt, monthsAgo(5 - Math.floor(i / 2)))
    lead.status = '啟用'
    const kids = kidsMin + Math.floor(rand() * kidsSpan)
    for (let k = 0; k < kids; k++) {
      const same = free.findIndex((t) => t.county === county)
      const idx = same >= 0 && rand() > 0.35 ? same : Math.floor(rand() * free.length)
      mk('member', lead.id, free.splice(idx, 1)[0], monthsAgo(Math.floor(rand() * 4)))
    }
  })
  for (let k = 0; k < ownerKids; k++) mk('trunk', 0, free.splice(Math.floor(rand() * free.length), 1)[0], monthsAgo(Math.floor(rand() * 3)))
  // 讓「邀請人」與「樹根」有所不同（示範安置）：部分小樹由園丁邀請後安置到大樹之下；部分小樹被移到另一位大樹，邀請人不變；部分小樹是老樹（長輩型）
  const leads = members.filter((m) => m.role === 'lead')
  members.filter((m) => m.role === 'member' && m.parent !== 0).forEach((m, k) => {
    if (k % 9 === 4) m.inviter = 0
    else if (k % 6 === 5 && leads.length > 1) m.parent = leads[(leads.findIndex((l) => l.id === m.parent) + 1) % leads.length].id
    if (k % 8 === 3) m.elder = true
  })
  return { members }
}

// 系統帳號類型（SaaS 多租戶）：系統管理者 admin（與園丁權限不重疊）／園丁 gardener（經營已開通的園區）→ 大樹 → 小樹（含老樹）；園丁直屬、尚未分配的成員是樹幹
export const ACCOUNT_LABEL = { admin: '系統管理者', gardener: '園丁', bigtree: '大樹', smalltree: '小樹', trunk: '樹幹' }
export const MAX_CIRCLES = 5 // 暫定每位園丁最多 5 個園區，逐一由系統管理者開通
export const GARDENERS = [
  { id: 'g1', name: '林雅婷（園丁）', email: 'gardener1@example.com', status: '啟用', created: '2026-04-27' },
  { id: 'g2', name: '陳志明（園丁）', email: 'gardener2@example.com', status: '啟用', created: '2026-09-10' },
  { id: 'g3', name: '周文彥（園丁）', email: 'gardener3@example.com', status: '啟用', created: '2026-06-01' },
]
export const OWNER_ADMIN = 'admin'
// 系統管理者／園丁各有一份「帳號層級」的個人資料，在自己所有的園區裡共用（園區上的園丁節點就是這份資料）
const PROFILES = {}
export function ownerProfile(k) {
  if (!PROFILES[k]) {
    const g = GARDENERS.find((x) => x.id === k)
    const p = makeOwner('')
    Object.assign(p, k === OWNER_ADMIN
      ? { name: '系統管理者（示意）', org: '平台營運方', email: 'admin@example.com' }
      : { name: g?.name || '園丁', org: '', email: g?.email || '', contact: '', bio: '', profileDone: false })
    PROFILES[k] = p
  }
  return PROFILES[k]
}
export const ownerName = (k) => ownerProfile(k).name

// 園區：每個園區屬於一位「園丁」，由系統管理者開通；各自有 368 鄉鎮代表結構。系統管理者不經營園區
const mkCircle = (meta, tree) => { tree.members[0] = ownerProfile(meta.owner); return { status: '啟用', ...meta, ...tree } }
export const CIRCLES = [
  mkCircle({ id: 'c1', owner: 'g1', name: '全台主園區', desc: '園丁經營的核心人脈園區，目標每個鄉鎮 1 位代表。', created: '2026-04-27' }, genTree(20261027, '全台主園區', ['新北市', '台中市', '台南市', '高雄市', '屏東縣', '彰化縣', '花蓮縣', '雲林縣'], 3, 6, 5)),
  mkCircle({ id: 'c5', owner: 'g1', name: '社區營養推廣網', desc: '加開的第二個園區，聚焦營養與飲食教育的在地代表。', created: '2026-08-12' }, genTree(3309, '社區營養推廣網', ['台北市', '桃園市', '台南市', '宜蘭縣', '花蓮縣'], 2, 5, 4)),
  mkCircle({ id: 'c2', owner: 'g3', name: '長照與社區照護網', desc: '長照據點、社區照護單位的合作網絡。', created: '2026-07-15' }, genTree(8812, '長照與社區照護網', ['台北市', '桃園市', '嘉義縣', '宜蘭縣'], 2, 5, 3)),
  mkCircle({ id: 'c3', owner: 'g3', name: '銀髮運動推廣園區', desc: '推廣長者運動與活動的在地代表。', created: '2026-09-20' }, genTree(5531, '銀髮運動推廣園區', ['台中市', '南投縣'], 1, 4, 2)),
  mkCircle({ id: 'c4', owner: 'g2', name: '在地農產直送網', desc: '另一位園丁經營的園區，與其他園丁互相看不到。', created: '2026-10-05' }, genTree(4417, '在地農產直送網', ['雲林縣', '彰化縣', '屏東縣'], 2, 4, 2)),
]
export let CURRENT = CIRCLES[0]
export let MEMBERS = CURRENT.members
// 統計只算「啟用」成員（E1）。同一鄉鎮可有多位成員；未設定代表區域者不列入覆蓋
export function selectCircle(id) {
  CURRENT = CIRCLES.find((c) => c.id === id) || CIRCLES[0]
  MEMBERS = CURRENT.members
  TOWNSHIPS.forEach((t) => { t.reps = []; t.rep = null })
  MEMBERS.forEach((m) => { const t = m.id && isOn(m) && m.township && twById(m.township); if (t) t.reps.push(m.id) })
  TOWNSHIPS.forEach((t) => { t.rep = t.reps[0] ?? null })
}
// 開通園區（系統管理者）：園丁初始 1 個，加開須由系統管理者開通，上限 MAX_CIRCLES
export function openCircle(gardenerId, name, desc = '') {
  const g = GARDENERS.find((x) => x.id === gardenerId)
  const owned = CIRCLES.filter((c) => c.owner === gardenerId)
  if (owned.length >= MAX_CIRCLES) return { ok: false, msg: `已達園區上限（${MAX_CIRCLES} 個）。` }
  const id = 'c' + (CIRCLES.length + 1) + '-' + Math.floor(Math.random() * 1000)
  CIRCLES.push({ id, owner: gardenerId, name, desc, created: REPORT_DATE, status: '啟用', members: [ownerProfile(gardenerId)] })
  g.request = false
  logAudit('系統管理者', owned.length ? '開通加開園區' : '開通第 1 個園區', `${g.name}：${name}`, null)
  return { ok: true, msg: '已開通。', id }
}
// 園丁申請加開（原型：只標記，由系統管理者開通）
export function requestCircle(gardenerId) {
  const g = GARDENERS.find((x) => x.id === gardenerId)
  g.request = true
  logAudit(g.name, '申請加開園區', g.name, null)
}
// 停用／恢復整個園區：只有系統管理者能做，園丁不能停用自己的園區
export function setCircleStatus(id, status) {
  const c = CIRCLES.find((x) => x.id === id)
  c.status = status
  logAudit('系統管理者', status === '停用' ? '停用園區' : '恢復園區', `${ownerName(c.owner)}：${c.name}`, null)
}
export function addGardener(name, email) {
  const g = { id: 'g' + (GARDENERS.length + 1) + '-' + Math.floor(Math.random() * 1000), name: name + '（園丁）', email, status: '啟用', created: REPORT_DATE }
  GARDENERS.push(g)
  logAudit('系統管理者', '開立園丁帳號', g.name, null)
  openCircle(g.id, name + '的園區') // 開立園丁帳號時一併開通第 1 個園區
  return g
}
// 某帳號看得到哪些園區（系統管理者不經營園區，看不到任何園區內容，只有統計與開通／停用）
// 停用中的園區：園丁不可查看，也不納入合併報告（#4）；因此導覽、報告、訊息都只用「啟用中」的園區
export const ownCircles = (u) => CIRCLES.filter((c) => c.owner === u.gardenerId)
export const visibleCircles = (u) => u.role === 'admin' ? [] : u.role === 'gardener' ? CIRCLES.filter((c) => c.owner === u.gardenerId && c.status !== '停用') : CIRCLES.filter((c) => c.id === u.circleId)
// 示範帳號：大樹／小樹取自 c1 的實際成員
export function demoAccounts() {
  const c = CIRCLES[0]
  const big = c.members.find((m) => m.role === 'lead' && c.members.some((k) => k.parent === m.id && k.inviter === m.id && isOn(k)))
  const small = c.members.find((m) => m.parent === big.id && m.inviter === big.id && isOn(m) && m.role === 'member' && !m.elder)
  const trunk = c.members.find((m) => m.role === 'trunk' && isOn(m))
  return {
    admin: { role: 'admin', name: ownerName(OWNER_ADMIN), email: 'admin@example.com', circleId: 'c1' },
    gardener: { role: 'gardener', name: GARDENERS[0].name, email: GARDENERS[0].email, gardenerId: GARDENERS[0].id, circleId: CIRCLES.find((x) => x.owner === GARDENERS[0].id).id },
    bigtree: { role: 'bigtree', name: big.name, email: big.email, memberId: big.id, circleId: c.id },
    smalltree: { role: 'smalltree', name: small.name, email: small.email, memberId: small.id, circleId: c.id },
    trunk: { role: 'trunk', name: trunk.name, email: trunk.email, memberId: trunk.id, circleId: c.id },
  }
}

// ── 園丁的成員管理操作（回傳 { ok, msg }）。所有變更限制在同一個園區內 ──
const smallsOf = (leadId) => MEMBERS.filter((m) => m.role === 'member' && m.parent === leadId && m.status !== '已離開')
export function setRole(id, role) {
  const m = byId(id)
  if (role === 'member' && smallsOf(id).length) return { ok: false, msg: `這位大樹旗下還有 ${smallsOf(id).length} 位小樹，請先全部移到其他大樹，或改用「置換大樹」，才能降級。` }
  if (role === 'lead' && !m.township) return { ok: false, msg: '升為大樹前，請先設定代表區域。' }
  if (role === 'member') { const lead = MEMBERS.find((x) => x.role === 'lead' && isOn(x) && x.id !== id); if (!lead) return { ok: false, msg: '降為小樹需要安置在某位大樹之下，目前沒有其他大樹。' }; m.parent = lead.id } else m.parent = 0
  m.role = role; m.elder = false
  logAudit('園丁', role === 'lead' ? '升為大樹' : '降為小樹', m.name, CURRENT.id)
  return { ok: true, msg: role === 'lead' ? '已升為大樹，取得自己的樹根。' : '已降為小樹，安置在其他大樹之下。' }
}
// 小樹或樹幹安置到某位大樹之下（樹幹安置後成為小樹）；邀請人不變
export function moveMember(id, toId) {
  const m = byId(id)
  if (m.role !== 'member' && m.role !== 'trunk') return { ok: false, msg: '只有小樹與樹幹可以被安置；大樹一律直屬園丁。' }
  const was = m.role
  m.parent = toId; m.role = 'member' // 邀請人 inviter 不變
  logAudit('園丁', was === 'trunk' ? '安置樹幹（成為小樹）' : '移動小樹（更換樹根）', `${m.name} → ${byId(toId).name}`, CURRENT.id)
  return { ok: true, msg: was === 'trunk' ? '已安置到大樹之下，成為小樹，邀請人不變。' : '已移動，立即生效，邀請人不變。' }
}
// 設定或取消老樹：老樹是小樹的一種，只是等級標示
export function setElder(id, elder) {
  const m = byId(id)
  if (m.role !== 'member') return { ok: false, msg: '只有小樹可以設為老樹。' }
  m.elder = elder
  logAudit('園丁', elder ? '設為老樹' : '取消老樹', m.name, CURRENT.id)
  return { ok: true, msg: elder ? '已設為老樹。' : '已取消老樹。' }
}
// 置換大樹：把小樹或樹幹直接換成大樹。旗下成員與代表區域由新大樹承接；原大樹須設定去向：降級（小樹）、變成樹幹或停用
export function replaceLead(newId, oldId, fate, placeUnder) {
  const n = byId(newId), o = byId(oldId)
  if (!n || !o || o.role !== 'lead') return { ok: false, msg: '請選擇要被置換的大樹。' }
  if (n.role !== 'member' && n.role !== 'trunk') return { ok: false, msg: '只有小樹或樹幹可以置換成大樹。' }
  if (!isOn(n)) return { ok: false, msg: '只有啟用中的成員可以被置換成大樹。' }
  if (!['member', 'trunk', 'disabled'].includes(fate)) return { ok: false, msg: '請設定原大樹的去向：降級、變成樹幹或停用。' }
  MEMBERS.filter((m) => m.role === 'member' && m.parent === o.id && m.id !== n.id).forEach((m) => { m.parent = n.id }) // 旗下成員由新大樹繼承
  n.role = 'lead'; n.parent = 0; n.elder = false; n.township = o.township // 代表區域承接
  if (fate === 'member') { o.role = 'member'; o.parent = placeUnder && placeUnder !== o.id ? Number(placeUnder) : n.id }
  else if (fate === 'trunk') { o.role = 'trunk'; o.parent = 0 }
  else { o.status = '停用' }
  logAudit('園丁', '置換大樹', `${o.name} → ${n.name}（原大樹：${fate === 'member' ? '降為小樹' : fate === 'trunk' ? '變成樹幹' : '停用'}）`, CURRENT.id)
  return { ok: true, msg: `已置換：${n.name} 成為大樹，旗下成員與代表區域由他承接；${o.name} 已${fate === 'member' ? '降為小樹' : fate === 'trunk' ? '變成樹幹' : '停用'}。` }
}
export function setStatus(id, status) {
  const m = byId(id)
  if (status === '停用' && m.role === 'lead' && smallsOf(id).length) return { ok: false, msg: `這位大樹旗下還有 ${smallsOf(id).length} 位小樹，請先全部移走，才能停用。` }
  m.status = status
  logAudit('園丁', status === '啟用' ? '啟用成員' : '停用成員', m.name, CURRENT.id)
  return { ok: true, msg: `已${status === '啟用' ? '啟用' : '停用'}。` }
}
export function approve(id, township) {
  const m = byId(id)
  if (m.role === 'lead' && !township) return { ok: false, msg: '大樹必須設定代表區域。' }
  m.status = '啟用'; m.township = township || m.township; m.joined = REPORT_DATE
  logAudit('園丁', '核可新成員', m.name, CURRENT.id)
  return { ok: true, msg: '已核可。' }
}
export function reject(id) {
  const m = byId(id)
  CURRENT.members = CURRENT.members.filter((x) => x.id !== id); MEMBERS = CURRENT.members
  logAudit('園丁', '拒絕新成員', m.name, CURRENT.id)
  return { ok: true, msg: '已拒絕，Email 釋放。' }
}
export function leave(id) {
  const m = byId(id)
  if (m.role === 'lead' && smallsOf(id).length) return { ok: false, msg: `這位大樹旗下還有 ${smallsOf(id).length} 位小樹，請先全部移走，才能離開。` }
  CURRENT.members = CURRENT.members.filter((x) => x.id !== id); MEMBERS = CURRENT.members
  logAudit('園丁', '成員離開', m.name, CURRENT.id)
  return { ok: true, msg: '已離開（原型直接移除；正式版保留歷史，個人資料與邀請人編輯一併清除）。' }
}
export const setTownship = (id, township) => { const m = byId(id); m.township = township; logAudit('園丁', '設定代表區域', `${m.name} → ${twLabel(township)}`, CURRENT.id) }

// ── 統計（E1）：只算啟用成員 ──
// 從拓展圖帶入邀請頁的預填鄉鎮（原型：模組變數）
export const PREFILL = { tw: null }
export const people = () => MEMBERS.filter((m) => m.id && isOn(m))
export const coveredSet = (c) => new Set(c.members.filter((m) => m.id && isOn(m) && m.township).map((m) => m.township))
export const circleStats = (c) => ({
  people: c.members.filter((m) => m.id && isOn(m)).length,
  leads: c.members.filter((m) => m.role === 'lead' && isOn(m)).length,
  covered: coveredSet(c).size,
})
export const covered = () => TOWNSHIPS.filter((t) => t.reps.length).length
export const hasLead = (t) => t.reps.some((id) => byId(id)?.role === 'lead')
// 覆蓋呈現：solid 實心＝有大樹；hollow 空心＝只有小樹；none 灰＝未覆蓋
export const townState = (t) => (!t.reps.length ? 'none' : hasLead(t) ? 'solid' : 'hollow')
// 大樹負責的鄉鎮＝自己與旗下小樹的代表區域
export const leadScope = (leadId) => new Set([byId(leadId)?.township, ...MEMBERS.filter((m) => m.parent === leadId && isOn(m)).map((m) => m.township)].filter(Boolean))
export const tierCount = (list) => Object.fromEntries(TIERS.map((t) => [t, list.filter((m) => tierOf(m) === t).length]))
// 每位大樹：旗下人數（安置、啟用）、邀請人數（邀請人是他、啟用）、活躍程度分布
export function leadStats() {
  const leads = MEMBERS.filter((m) => m.role === 'lead' && isOn(m))
  const rows = leads.map((l) => {
    const smalls = MEMBERS.filter((m) => m.parent === l.id && m.role === 'member' && isOn(m))
    return { lead: l, smalls: smalls.length, invited: MEMBERS.filter((m) => m.inviter === l.id && isOn(m)).length, tiers: tierCount(smalls), list: smalls }
  }).sort((a, b) => b.smalls - a.smalls)
  const direct = MEMBERS.filter((m) => m.parent === 0 && m.role === 'trunk' && isOn(m))
  return { rows, ownerDirect: direct.length, direct, smallTotal: MEMBERS.filter((m) => m.role === 'member' && isOn(m)).length }
}
// 稽核紀錄（原型：記憶體，只增不改）
export const AUDIT = []
export const logAudit = (actor, action, target, circleId = null) => AUDIT.unshift({ at: REPORT_DATE + ' ' + new Date().toTimeString().slice(0, 5), actor, action, target, circleId })
export const ROLE_LABEL = { owner: '園丁', lead: '大樹', member: '小樹', trunk: '樹幹' }
// 角色名稱：小樹中的老樹另標「老樹」
export const roleName = (m) => (m.role === 'member' && m.elder ? '老樹' : ROLE_LABEL[m.role])
// 資料匯出（CSV，Excel 可直接開啟）：園丁匯出轄下成員報表與名單；系統管理者只匯出園丁報表，不含成員名單
export function downloadCSV(filename, rows) {
  const esc = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"'
  const blob = new Blob(['\ufeff' + rows.map((r) => r.map(esc).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
export const byId = (id) => MEMBERS.find((m) => m.id === id)
export const childrenOf = (id) => MEMBERS.filter((m) => m.parent === id && m.id !== 0)
export const descendants = (id) => childrenOf(id).reduce((n, c) => n + 1 + descendants(c.id), 0)

// 時間軸：日／週／月／年，各單位固定長度（切換時版面一致）。n＝新增（核可日）、total＝累計
export const UNITS = { day: ['日', 30], week: ['週', 12], month: ['月', 12], year: ['年', 5] }
const p2 = (n) => String(n).padStart(2, '0')
const fmt = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`
export function growth(unit, list = people()) {
  const [, count] = UNITS[unit]
  const [Y, M, D] = REPORT_DATE.split('-').map(Number)
  const end = new Date(Y, M - 1, D)
  const monday = new Date(end); monday.setDate(end.getDate() - ((end.getDay() + 6) % 7))
  const start = (i) => unit === 'day' ? new Date(Y, M - 1, D - i)
    : unit === 'week' ? new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() - i * 7)
    : unit === 'month' ? new Date(Y, M - 1 - i, 1) : new Date(Y - i, 0, 1)
  const label = (d) => unit === 'day' ? `${p2(d.getMonth() + 1)}/${p2(d.getDate())}` : unit === 'week' ? `${p2(d.getMonth() + 1)}/${p2(d.getDate())}週` : unit === 'month' ? `${p2(d.getMonth() + 1)}月` : `${d.getFullYear()}`
  return Array.from({ length: count }, (_, k) => {
    const i = count - 1 - k
    const s = start(i), nxt = i === 0 ? new Date(Y, M - 1, D + 1) : start(i - 1)
    const a = fmt(s), b = fmt(nxt)
    return { label: label(s), month: label(s), n: list.filter((m) => m.joined >= a && m.joined < b).length, total: list.filter((m) => m.joined < b).length }
  })
}

// 邀請紀錄（原型）。inviter：邀請人；root：安置的樹根（0＝直屬園丁）
export const SEED_INVITES = [
  { code: 'H7K2-9QPD', name: '陳小花', email: 'hua@example.com', role: 'trunk', circle: 'c1', by: '園丁', byRole: 'owner', root: 0, township: null, created: '2026-10-24', expires: '2026-10-31', status: '待使用' },
  { code: 'M3XA-4TNW', name: '林大同', email: 'datong@example.com', role: 'trunk', circle: 'c1', by: '園丁', byRole: 'owner', root: 0, township: null, created: '2026-10-20', expires: '2026-10-23', status: '已使用' },
  { code: 'B8RV-2LCE', name: '王建國', email: 'wang@example.com', role: 'lead', circle: 'c1', by: '園丁', byRole: 'owner', root: 0, township: null, created: '2026-10-05', expires: '2026-10-06', status: '已過期' },
  { code: 'K4PN-7ZQA', name: '張美惠', email: 'dup@example.com', role: 'trunk', circle: 'c1', by: '園丁', byRole: 'owner', root: 0, township: null, created: '2026-10-18', expires: '2026-10-25', status: '無法使用' },
]

selectCircle('c1')
logAudit('系統管理者', '開立園丁帳號', GARDENERS[0].name, null)
logAudit('系統管理者', '開立園丁帳號', GARDENERS[1].name, null)
logAudit('園丁', '查看聯絡方式', '（示意）', 'c1')
logAudit('系統管理者', '開立園丁帳號', GARDENERS[2].name, null)

// ── 受邀者接受邀請（C6）：建立「待審核」成員；條款版本與同意時間（D2、D3）──
export const TERMS_VERSION = 'v0.1'
export const AGREED = new Set() // 已同意條款的管理端 email（首次登入勾選）
// Email 已有有效成員身分（啟用／停用／待審核）：接受時才檢查，對方只看到「無法使用」（C6）
export const emailTaken = (email) => CIRCLES.some((c) => c.members.some((m) => m.id && m.email === email && ['啟用', '停用', '待審核'].includes(m.status)))
export function acceptInvite(inv, name) {
  const c = CIRCLES.find((x) => x.id === inv.circle)
  const id = Math.max(...c.members.map((m) => m.id)) + 1
  const m = { id, name: name.trim(), nick: '', avatar: 0, role: inv.role, parent: inv.role === 'lead' || inv.role === 'trunk' ? 0 : inv.root, inviter: inv.byId, org: '', township: inv.township || null, residence: '', joined: REPORT_DATE,
    profileDone: false, contact: '', email: inv.email, bio: '', hideContact: false, lastVisit: null, note: '', status: '待審核', terms: { version: TERMS_VERSION, at: REPORT_DATE } }
  c.members.push(m)
  logAudit(m.name, '接受邀請（待審核）', `同意條款 ${TERMS_VERSION}`, c.id)
  selectCircle(CURRENT.id)
  return m
}
