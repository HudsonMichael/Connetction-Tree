import { useLayoutEffect, useRef, useState } from 'react'
import { COUNTIES, TOWNSHIPS, TOTAL_TOWNSHIPS, MAP, byId, ROLE_LABEL, leadScope, townState, tierOf, PREFILL, twLabel } from '../data.js'
import { Who } from '../components/Who.jsx'

export default function TownshipMap({ user, isManager, go }) {
  const me = isManager ? null : byId(user.memberId)
  const scope = me ? leadScope(me.id) : null // 大樹只看得到自己負責的鄉鎮
  const [view, setView] = useState('map')
  const [hover, setHover] = useState(null)
  const [pick, setPick] = useState(null)
  const [only, setOnly] = useState('all')
  const [zoom, setZoom] = useState(1)
  const [county, setCounty] = useState('')
  const [kw, setKw] = useState('')
  const box = useRef(null)
  const drag = useRef(null)
  const keep = useRef(null)
  const z = (f) => {
    const b = box.current
    keep.current = { x: (b.scrollLeft + b.clientWidth / 2) / b.scrollWidth, y: (b.scrollTop + b.clientHeight / 2) / b.scrollHeight }
    setZoom((v) => Math.min(6, Math.max(1, +(v * f).toFixed(2))))
  }
  // 縮放後維持畫面中心不變
  useLayoutEffect(() => {
    const b = box.current, k = keep.current
    if (!b || !k) return
    b.scrollLeft = k.x * b.scrollWidth - b.clientWidth / 2
    b.scrollTop = k.y * b.scrollHeight - b.clientHeight / 2
    keep.current = null
  }, [zoom])
  const t = pick || hover
  // 鄉鎮狀態：實心＝有啟用的大樹；空心＝已覆蓋但只有小樹；灰＝未覆蓋；mute＝不在大樹負責範圍（不呈現狀態）
  const inScope = (x) => !scope || scope.has(x.id)
  const state = (x) => (!inScope(x) ? ' mute' : townState(x) === 'solid' ? ' got' : townState(x) === 'hollow' ? ' hollow' : '')
  const pool = TOWNSHIPS.filter(inScope)
  const cov = pool.filter((x) => x.reps.length).length
  const noLead = pool.filter((x) => townState(x) === 'hollow').length
  const total = scope ? pool.length : TOTAL_TOWNSHIPS
  const dim = (x) => !inScope(x) ? false : (only === 'gap' && x.reps.length > 0) || (only === 'nolead' && townState(x) !== 'hollow') || (county && x.county !== county) || (kw.trim() && !(x.county + x.name).includes(kw.trim()))
  const allReps = (t?.reps || []).map(byId)
  const reps = me ? allReps.filter((r) => r.id === me.id || r.parent === me.id) : allReps // 大樹只看得到自己樹根底下的人
  const invite = (x) => { PREFILL.tw = x.id; go('invites') }
  return (
    <>
      <h2>368 拓展圖</h2>
      <p className="muted"><b>實心</b>＝該鄉鎮有大樹（鄉鎮代表）；<b>空心</b>＝已覆蓋但只有小樹，提示尚未指派大樹；<b>灰色</b>＝沒有任何啟用成員。{me && '你只看得到自己負責的鄉鎮，其他鄉鎮以淡色顯示、不呈現狀態。'}滑鼠移上去看細節，點擊可固定。</p>
      <div className="grid4">
        <div className="stat"><div className="muted">已覆蓋</div><div className="big">{cov}</div></div>
        <div className="stat"><div className="muted">尚缺</div><div className="big">{total - cov}</div></div>
        <div className="stat"><div className="muted">覆蓋率</div><div className="big">{(cov / total * 100).toFixed(1)}%</div></div>
        <div className="stat click" onClick={() => setOnly('nolead')}><div className="muted">大樹從缺</div><div className="big" style={{ color: '#b7791f' }}>{noLead}</div><div className="small muted">已覆蓋但只有小樹</div></div>
      </div>
      <div className="toolbar">
        <div className="seg">
          {[['map', '地圖'], ['grid', '方格']].map(([k, l]) => <button key={k} className={view === k ? 'chip on' : 'chip'} onClick={() => setView(k)}>{l}</button>)}
        </div>
        <div className="seg">
          {[['all', '全部'], ['gap', '只看尚缺'], ['nolead', '只看大樹從缺']].map(([k, l]) => <button key={k} className={only === k ? 'chip on' : 'chip'} onClick={() => setOnly(k)}>{l}</button>)}
        </div>
        <select value={county} onChange={(e) => setCounty(e.target.value)}><option value="">全部縣市</option>{COUNTIES.map(([c]) => <option key={c}>{c}</option>)}</select>
        <input style={{ width: 150 }} placeholder="搜尋鄉鎮名稱" value={kw} onChange={(e) => setKw(e.target.value)} />
        <span className="legend"><i className="sq got" /> 有大樹 <i className="sq hollow" /> 只有小樹 <i className="sq" /> 未覆蓋</span>
      </div>
      <div className="grid-map">
        <div className="card" style={{ padding: view === 'map' ? 8 : 16 }}>
          {view === 'map' ? (
            <div className="mapwrap">
              <div className="zoom">
                <button onClick={() => z(1.4)} aria-label="放大">＋</button>
                <button onClick={() => z(1 / 1.4)} aria-label="縮小">－</button>
                <button onClick={() => { keep.current = null; setZoom(1) }} aria-label="重設">⟲</button>
                <span className="zl">{Math.round(zoom * 100)}%</span>
              </div>
              <div className={'mapscroll' + (zoom > 1 ? ' pan' : '')} ref={box}
                onMouseDown={(e) => { drag.current = { x: e.clientX, y: e.clientY, l: box.current.scrollLeft, t: box.current.scrollTop, moved: false } }}
                onMouseMove={(e) => { const d = drag.current; if (!d || e.buttons !== 1) return; if (Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > 4) d.moved = true; box.current.scrollLeft = d.l - (e.clientX - d.x); box.current.scrollTop = d.t - (e.clientY - d.y) }}
                onMouseUp={() => setTimeout(() => { drag.current = null }, 0)}
                onClickCapture={(e) => { if (drag.current?.moved) { e.stopPropagation(); e.preventDefault() } }}>
                <svg viewBox={`0 0 ${MAP.w} ${MAP.h}`} className="twmap" style={{ height: zoom * 100 + '%', margin: '0 auto' }} onMouseLeave={() => setHover(null)}>
                  {TOWNSHIPS.map((x) => (
                    <path key={x.id} d={MAP.paths[x.id]} className={'tp' + state(x) + (dim(x) ? ' dim' : '') + (pick?.id === x.id ? ' picked' : '')}
                      onMouseEnter={() => setHover(x)} onClick={() => setPick(pick?.id === x.id ? null : x)} />
                  ))}
                  {MAP.islands.map((i) => <text key={i.name} x={i.x} y={i.y} fontSize="12" fill="#6b7a7c">{i.name}</text>)}
                </svg>
              </div>
            </div>
          ) : (
            <div className="counties" onMouseLeave={() => setHover(null)}>
              {COUNTIES.map(([c, n]) => {
                const list = TOWNSHIPS.filter((x) => x.county === c)
                return (
                  <div key={c} className="county">
                    <div className="chead"><b>{c}</b><span className="small muted">{list.filter((x) => x.reps.length).length}/{n}</span></div>
                    <div className="cells">
                      {list.map((x) => <i key={x.id} className={'sq' + state(x) + (dim(x) ? ' dim' : '') + (pick?.id === x.id ? ' picked' : '')}
                        onMouseEnter={() => setHover(x)} onClick={() => setPick(pick?.id === x.id ? null : x)} />)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <section className="card sticky">
          <h3>鄉鎮細節{pick && <button className="link" style={{ float: 'right' }} onClick={() => setPick(null)}>取消固定</button>}</h3>
          {!t ? <p className="muted">將滑鼠移到鄉鎮上，或點擊固定（手機：點一下即固定）</p> : !inScope(t) ? (
            <>
              <div className="row"><span>縣市</span><b>{t.county}</b></div>
              <div className="row"><span>鄉鎮市區</span><b>{t.name}</b></div>
              <p className="small muted">這個鄉鎮不在你負責的範圍內，不顯示狀態與成員。</p>
            </>
          ) : (
            <>
              <div className="row"><span>縣市</span><b>{t.county}</b></div>
              <div className="row"><span>鄉鎮市區</span><b>{t.name}</b></div>
              <div className="row"><span>代碼</span><b>{t.id}</b></div>
              <div className="row"><span>狀態</span><b>{{ solid: '實心（有大樹）', hollow: '空心（只有小樹）', none: '未覆蓋' }[townState(t)]}</b></div>
              {townState(t) === 'hollow' && <div className="leadcard none" style={{ borderLeftColor: '#f5b342', background: '#fff6e0' }}><span className="small">⚠ 這個鄉鎮目前只有小樹，<b>尚未指派大樹或大樹從缺</b>。</span></div>}
              <div className="row"><span>成員 / 代表</span>{allReps.length ? <b>{allReps.length} 位</b> : <b className="warn">尚無代表</b>}</div>
              {reps.map((r) => (
                <div key={r.id} className="notebox">
                  <div><span className={'pill ' + r.role}>{r.role === 'lead' ? '★ ' : ''}{ROLE_LABEL[r.role]}</span><Who m={r} avatar={false} /> <span className={'pill t-' + tierOf(r)}>{tierOf(r)}</span></div>
                  <div className="small muted">加入 {r.joined}・邀請人 {r.inviter === 0 ? '園丁' : byId(r.inviter).name}</div>
                </div>
              ))}
              {me && allReps.length > reps.length && <p className="small muted">另有 {allReps.length - reps.length} 位不在你的樹根下，無法顯示。</p>}
              <button className="primary" onClick={() => invite(t)}>為這個鄉鎮產生邀請連結</button>
              <p className="small muted">會帶入這個鄉鎮為預計的代表區域，園丁核可時確認。</p>
            </>
          )}
        </section>
      </div>
    </>
  )
}
