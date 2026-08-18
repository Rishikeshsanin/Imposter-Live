import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const SUPABASE_URL='https://dothsnigwvgyvwqnktan.supabase.co';
const SUPABASE_KEY='sb_publishable_ZnRiuHQ1GG5uKQdwvTO4KQ_9xXOLxeS';
const supabase=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const app=document.querySelector('#app');
const toastEl=document.querySelector('#toast');
const qs=new URLSearchParams(location.search);
const THEMES=[
  ['popularPeople','Popular People'],['mixed','Mixed'],['movies','Movies'],['tollywoodMovies','Tollywood Movies'],['tollywoodActors','Tollywood Actors'],['animals','Animals'],['moviesTv','Movies & TV Shows']
];
let session=loadSession();
let state=null,channel=null,tick=null,refreshing=false;

function loadSession(){try{return JSON.parse(localStorage.getItem('imposter_live_session')||'null')}catch{return null}}
function saveSession(){localStorage.setItem('imposter_live_session',JSON.stringify(session))}
function clearSession(){localStorage.removeItem('imposter_live_session');session=null;state=null;if(channel)supabase.removeChannel(channel);channel=null;clearInterval(tick);home()}
function toast(msg){toastEl.textContent=msg;toastEl.hidden=false;clearTimeout(toastEl._t);toastEl._t=setTimeout(()=>toastEl.hidden=true,3200)}
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function errMsg(e){return e?.message?.replace(/^.*?: /,'')||'Something went wrong.'}
async function rpc(name,args={}){const {data,error}=await supabase.rpc(name,args);if(error)throw error;return data}
function themeOptions(selected='mixed'){return THEMES.map(([v,n])=>`<option value="${v}" ${v===selected?'selected':''}>${n}</option>`).join('')}
function formatTime(total){total=Math.max(0,Math.ceil(total));return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`}

function home(){
 const room=qs.get('room')||'';
 app.innerHTML=`<div class="hero"><div class="eyebrow">Real-time party game</div><h1>WHO'S THE <em>IMPOSTER?</em></h1><p class="muted">3–12 players. One secret word. One liar.</p></div>
 <div class="grid"><button class="btn primary" id="createBtn">Create room</button><button class="btn" id="joinBtn">Join room</button></div>
 <div id="formArea" class="stack" style="margin-top:16px"></div>`;
 document.querySelector('#createBtn').onclick=()=>showCreate(); document.querySelector('#joinBtn').onclick=()=>showJoin(room);
 if(room)showJoin(room);
}
function showCreate(){document.querySelector('#formArea').innerHTML=`<div class="field"><label>Your name</label><input id="name" class="input" maxlength="24" placeholder="Rishi"></div><div class="grid"><div class="field"><label>Theme</label><select id="theme" class="select">${themeOptions()}</select></div><div class="field"><label>Timer (seconds)</label><input id="timer" class="input" type="number" min="30" max="900" step="30" value="150"></div></div><button class="btn primary" id="go">Create</button>`;document.querySelector('#go').onclick=createRoom}
function showJoin(prefill=''){document.querySelector('#formArea').innerHTML=`<div class="field"><label>Room code</label><input id="code" class="input" maxlength="6" value="${esc(prefill)}" placeholder="ABC234" style="text-transform:uppercase"></div><div class="field"><label>Your name</label><input id="name" class="input" maxlength="24" placeholder="Your name"></div><button class="btn primary" id="go">Join</button>`;document.querySelector('#go').onclick=joinRoom}
async function createRoom(){try{const name=document.querySelector('#name').value;const theme=document.querySelector('#theme').value;const timer=+document.querySelector('#timer').value;const d=await rpc('create_game_room',{p_name:name,p_theme_key:theme,p_timer_seconds:timer});session={roomCode:d.room_code,roomId:d.room_id,playerToken:d.player_token,playerId:d.player_id,hostToken:d.host_token};saveSession();await enterRoom()}catch(e){toast(errMsg(e))}}
async function joinRoom(){try{const code=document.querySelector('#code').value.toUpperCase();const name=document.querySelector('#name').value;const d=await rpc('join_game_room',{p_code:code,p_name:name});session={roomCode:d.room_code,roomId:d.room_id,playerToken:d.player_token,playerId:d.player_id};saveSession();await enterRoom()}catch(e){toast(errMsg(e))}}
async function enterRoom(){await refresh();subscribe();clearInterval(tick);tick=setInterval(async()=>{if(state?.room?.status==='discussion'){renderTimerOnly();if(new Date(state.round.ends_at).getTime()<=Date.now()){try{await rpc('finalize_if_expired',{p_code:session.roomCode,p_player_token:session.playerToken});await refresh()}catch{}}}},500)}
function subscribe(){if(channel)supabase.removeChannel(channel);channel=supabase.channel(`room-events-${session.roomId}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'room_events',filter:`room_id=eq.${session.roomId}`},()=>refresh()).subscribe()}
async function refresh(){if(refreshing||!session)return;refreshing=true;try{state=await rpc('get_game_state',{p_code:session.roomCode,p_player_token:session.playerToken});render()}catch(e){toast(errMsg(e));if(/not found|invalid/i.test(errMsg(e)))clearSession()}finally{refreshing=false}}
function render(){if(!state)return;const status=state.room.status;if(status==='lobby')renderLobby();else if(status==='discussion')renderDiscussion();else renderResults()}
function headerBlock(){return `<div class="eyebrow">Room</div><div class="roomcode">${state.room.code}</div><p class="muted small" style="text-align:center">Share: ${esc(location.origin+location.pathname+'?room='+state.room.code)}</p>`}
function playersList(){return `<div class="players">${state.players.map(p=>`<div class="player"><span>${esc(p.name)} ${p.is_host?'<span class="badge">HOST</span>':''}</span><span class="score">${p.score} pts</span></div>`).join('')}</div>`}
function renderLobby(){app.innerHTML=`${headerBlock()}${playersList()}<div class="divider"></div>${state.room.is_host?`<div class="grid"><div class="field"><label>Theme</label><select id="theme" class="select">${themeOptions(state.room.theme_key)}</select></div><div class="field"><label>Timer</label><input id="timer" class="input" type="number" min="30" max="900" step="30" value="${state.room.timer_seconds}"></div></div><div class="actions"><button class="btn" id="save">Save settings</button><button class="btn primary" id="start" ${state.players.length<3?'disabled':''}>Start round</button></div><p class="muted small">${state.players.length<3?'Need at least 3 players.':'Ready. Voting will be open from the moment the round begins.'}</p>`:`<p class="muted" style="text-align:center">Waiting for the host to start the round.</p>`}<button class="btn ghost" id="leave" style="margin-top:16px">Leave room</button>`;
 if(state.room.is_host){document.querySelector('#save').onclick=saveSettings;document.querySelector('#start').onclick=startRound}document.querySelector('#leave').onclick=leaveRoom}

async function leaveRoom(){try{await rpc('leave_game_room',{p_code:session.roomCode,p_player_token:session.playerToken});clearSession()}catch(e){toast(errMsg(e))}}
async function saveSettings(){try{await rpc('host_update_settings',{p_code:session.roomCode,p_host_token:session.hostToken,p_theme_key:document.querySelector('#theme').value,p_timer_seconds:+document.querySelector('#timer').value});toast('Settings saved');await refresh()}catch(e){toast(errMsg(e))}}
async function startRound(){try{await rpc('host_start_round',{p_code:session.roomCode,p_host_token:session.hostToken});await refresh()}catch(e){toast(errMsg(e))}}
function renderDiscussion(){const isImp=state.round.role==='imposter';app.innerHTML=`<div class="role-card ${isImp?'imposter':''}"><div class="role-label">Round ${state.round.number}</div>${isImp?`<div class="word">IMPOSTER</div><p>Blend in. You do not know the word.</p>`:`<div class="word">${esc(state.round.word)}</div><p>Give clues without making the answer obvious.</p>`}</div><div style="text-align:center;margin:20px 0"><div class="eyebrow">Time left</div><div id="timerText" class="timer">--:--</div><div class="muted">${state.round.votes_cast}/${state.players.length} votes locked in</div></div><div class="divider"></div><h2 class="section-title">Vote anytime</h2><p class="muted small">You can change your vote until everyone has voted or the timer ends.</p><div class="vote-grid">${state.players.map(p=>`<button class="vote-btn ${state.round.voted_for===p.id?'selected':''}" data-id="${p.id}" ${p.id===state.me.id?'disabled':''}>${esc(p.name)}</button>`).join('')}</div>`;document.querySelectorAll('.vote-btn:not(:disabled)').forEach(b=>b.onclick=()=>vote(b.dataset.id));renderTimerOnly()}
function renderTimerOnly(){const el=document.querySelector('#timerText');if(!el||!state?.round?.ends_at)return;el.textContent=formatTime((new Date(state.round.ends_at).getTime()-Date.now())/1000)}
async function vote(id){try{await rpc('cast_vote',{p_code:session.roomCode,p_player_token:session.playerToken,p_voted_player_id:id});await refresh()}catch(e){toast(errMsg(e))}}
function renderResults(){const imp=state.round.imposter_name;app.innerHTML=`<div class="result-hero"><div class="eyebrow">The imposter was</div><div class="name">${esc(imp)}</div><div class="muted">Secret word</div><div class="secret">${esc(state.round.secret_word)}</div></div><div class="divider"></div><h2 class="section-title">Votes</h2><div class="tally">${(state.round.vote_tally||[]).map(v=>`<div class="tally-row"><span>${esc(v.name)}</span><strong>${v.votes}</strong></div>`).join('')}</div><div class="divider"></div><h2 class="section-title">Scoreboard</h2>${playersList()}${state.room.is_host?`<div class="actions"><button class="btn" id="settings">Change settings</button><button class="btn primary" id="next">Next round</button></div>`:`<p class="muted" style="text-align:center">Waiting for the host to start the next round.</p>`}`;if(state.room.is_host){document.querySelector('#next').onclick=startRound;document.querySelector('#settings').onclick=backLobby}}
async function backLobby(){try{await rpc('host_return_to_lobby',{p_code:session.roomCode,p_host_token:session.hostToken});await refresh()}catch(e){toast(errMsg(e))}}

if(session?.roomCode&&session?.playerToken){enterRoom()}else{home()}
