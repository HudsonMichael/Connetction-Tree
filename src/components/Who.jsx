import { AVATARS } from '../data.js'

// 姓名與名稱同時顯示，前端以視覺區隔：姓名為粗體，名稱為淡色標籤
export const Av = ({ m, size = 28 }) => <span className="av" style={{ width: size, height: size, fontSize: size * 0.6 }}>{AVATARS[m.avatar ?? 0]}</span>
export const Who = ({ m, avatar = true }) => (
  <span className="who">{avatar && <Av m={m} />}<b>{m.name}</b>{m.nick && <span className="nick">{m.nick}</span>}</span>
)
