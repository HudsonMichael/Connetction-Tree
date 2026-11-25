// 訊息（原型）：全部存在記憶體。收件人以「帳號鍵」表示：
//   o:<admin|園丁id>        系統管理者／園丁
//   m:<園區id>:<成員id>      園區裡的大樹、小樹、老樹、樹幹
// 規則（F3）：純文字、單向、不做對話串。只能整批發給自己「下一階層的所有成員」；向上只能發給邀請人或安置人。
//   系統管理者：所有園丁，另保留全系統公告。園丁：直屬的大樹與樹幹，可整批或單一。大樹：旗下全部小樹（含老樹）；向上：邀請人或安置人。
//   小樹、老樹、樹幹：只能單一發給上一層的邀請人或安置人。發送當下決定收件人（只有啟用成員）。沒有人能看別人的訊息。
//   收件人可刪除自己的信；發出後不能收回；保存 12 個月後自動刪除；已讀時間寫入稽核紀錄（不含內容）。
import { CIRCLES, GARDENERS, OWNER_ADMIN, ownerName, demoAccounts, isOn, logAudit, REPORT_DATE, byId } from './data.js'

export const MESSAGES = []
export const okey = (k) => 'o:' + k
export const mkey = (cid, mid) => `m:${cid}:${mid}`
export const userKey = (u) => (u.role === 'admin' ? okey(OWNER_ADMIN) : u.role === 'gardener' ? okey(u.gardenerId) : mkey(u.circleId, u.memberId))
const people = (c) => c.members.filter((m) => m.id !== 0 && isOn(m)) // 發送當下只納入啟用成員
export const allKeys = () => [okey(OWNER_ADMIN), ...GARDENERS.map((g) => okey(g.id)), ...CIRCLES.flatMap((c) => people(c).map((m) => mkey(c.id, m.id)))]

// 上一層：邀請人與安置人（樹根）。園丁（id 0）以 o:<園丁id> 表示；兩者相同時只列一個
export function upTargets(circle, m) {
  const keyOf = (id) => (id === 0 ? okey(circle.owner) : mkey(circle.id, id))
  const nameOf = (id) => (id === 0 ? ownerName(circle.owner) : byId2(circle, id)?.name || '')
  const inv = { scope: 'inviter', key: keyOf(m.inviter), name: nameOf(m.inviter) }
  const root = { scope: 'root', key: keyOf(m.parent), name: nameOf(m.parent) }
  return inv.key === root.key ? [{ ...inv, both: true }] : [inv, root]
}
const byId2 = (circle, id) => circle.members.find((x) => x.id === id)

// 依範圍算出收件人與說明文字。mode: platform／owner（園丁）／lead（大樹）／low（小樹、老樹、樹幹）
export function resolve({ mode, circle, scope, target, me }) {
  const k = (m) => mkey(circle.id, m.id)
  if (mode === 'platform') return scope === 'owners' ? { keys: GARDENERS.map((g) => okey(g.id)), label: '所有園丁' } : { keys: allKeys(), label: '全系統所有啟用帳號' }
  const ps = people(circle)
  if (mode === 'owner') {
    const next = ps.filter((m) => m.parent === 0) // 下一階層：直屬園丁的大樹與樹幹
    if (scope === 'next') return { keys: next.map(k), label: '直屬的所有大樹與樹幹' }
    const one = next.find((m) => m.id === Number(target))
    return { keys: one ? [k(one)] : [], label: one ? one.name : '' }
  }
  const mine = byId2(circle, me)
  if (scope === 'down' && mode === 'lead') return { keys: ps.filter((m) => m.parent === me && m.role === 'member').map(k), label: '我旗下的全部小樹（含老樹）' }
  const up = mine ? upTargets(circle, mine).find((t) => t.scope === scope) : null
  return up ? { keys: [up.key], label: up.both ? `${up.name}（我的邀請人與安置人）` : `${up.name}（我的${scope === 'inviter' ? '邀請人' : '安置人'}）` } : { keys: [], label: '' }
}

const now = () => { const d = new Date(); return `2026-11-03 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` }
export function send({ kind, circleId, from, label, keys, subject, body, date, readFrac = 0 }) {
  const reads = {}
  keys.slice(0, Math.floor(keys.length * readFrac)).forEach((x) => { reads[x] = date ? date.slice(0, 10) + ' 20:00' : '' })
  const m = { id: MESSAGES.length + 1, kind, circleId, from, label, to: keys, subject, body, date: date || now(), reads, deleted: {} }
  if (!date) logAudit(from.name, '發送訊息', `${label}（${keys.length} 人，不含內容）`, circleId ?? null)
  MESSAGES.unshift(m)
  return m
}
export const markRead = (m, key) => {
  if (m.reads[key]) return
  m.reads[key] = REPORT_DATE + ' ' + new Date().toTimeString().slice(0, 5)
  logAudit(nameOfKey(key), '讀取訊息', `「${m.subject}」（不含內容）`, m.circleId ?? null) // 已讀紀錄：誰、何時、哪一則
}
export const nameOfKey = (key) => {
  if (key.startsWith('o:')) return ownerName(key.slice(2))
  const [, cid, mid] = key.split(':')
  return CIRCLES.find((c) => c.id === cid)?.members.find((x) => x.id === Number(mid))?.name || '（已離開）'
}
export const delMsg = (m, key) => { m.deleted[key] = true }
export const unreadCount = (u) => { const k = userKey(u); return MESSAGES.filter((m) => m.to.includes(k) && !m.reads[k] && !m.deleted[k]).length }
// 某組織（樹）中，這個帳號尚未讀的訊息數；circleId 為 null 代表平台公告
export const unreadBy = (u, circleId) => { const k = userKey(u); return MESSAGES.filter((m) => m.to.includes(k) && !m.reads[k] && !m.deleted[k] && (m.circleId ?? null) === circleId).length }
// 日期區間（含頭尾）＋關鍵字（主旨、內容、寄件人、收件範圍）
export const matchMsg = (m, { q = '', from = '', to = '' }) => {
  const d = m.date.slice(0, 10)
  return (!from || d >= from) && (!to || d <= to) && (!q.trim() || (m.subject + m.body + m.from.name + m.label).includes(q.trim()))
}
export const readCount = (m) => m.to.filter((x) => m.reads[x]).length

// 示範資料
{
  const demo = demoAccounts(), c1 = CIRCLES[0], c2 = CIRCLES.find((c) => c.owner === GARDENERS[2].id)
  const adminFrom = { key: okey('admin'), name: '平台營運方', role: 'platform' }
  const ownerFrom = (c) => ({ key: okey(c.owner), name: ownerName(c.owner), role: 'owner' })
  const big = c1.members.find((m) => m.id === demo.bigtree.memberId)
  send({ kind: 'platform', from: adminFrom, label: '全系統所有啟用帳號', keys: allKeys(), subject: '系統維護通知', body: '11/10 凌晨 02:00–04:00 系統將進行例行維護，期間可能無法登入。造成不便，敬請見諒。', date: '2026-10-30 10:00', readFrac: 0.6 })
  send({ kind: 'tree', circleId: c1.id, from: ownerFrom(c1), ...resolve({ mode: 'owner', circle: c1, scope: 'next' }), subject: '本月拓展目標', body: '大家好，本月目標是補齊北部與中部尚缺的鄉鎮代表。有合適人選請先面談，再用邀請連結邀請。', date: '2026-10-25 09:30', readFrac: 0.5 })
  send({ kind: 'tree', circleId: c1.id, from: { key: mkey(c1.id, big.id), name: big.name, role: 'lead' }, ...resolve({ mode: 'lead', circle: c1, scope: 'down', me: big.id }), subject: '本週在地活動分享', body: '本週六有社區健康講座，歡迎大家就近參加並回報參與情形。', date: '2026-10-28 18:20', readFrac: 0.4 })
  send({ kind: 'tree', circleId: c1.id, from: { key: mkey(c1.id, big.id), name: big.name, role: 'lead' }, ...resolve({ mode: 'lead', circle: c1, scope: 'inviter', me: big.id }), subject: '回報：本月新邀請', body: '本月已邀請 3 位小樹，其中 1 位尚未完成註冊，下週再追蹤。', date: '2026-10-29 21:05', readFrac: 0 })
  if (c2) send({ kind: 'tree', circleId: c2.id, from: ownerFrom(c2), ...resolve({ mode: 'owner', circle: c2, scope: 'next' }), subject: '大樹月會通知', body: '11/15 下午 2 點線上月會，請各位大樹準時出席。', date: '2026-10-27 16:00', readFrac: 0.5 })
}
