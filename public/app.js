(()=>{
const SESSION_KEY='waterline_session_v65';
function loadSession(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||localStorage.getItem('waterline_session_v62')||localStorage.getItem('waterline_session_v64')||localStorage.getItem('waterline_session_v63')||localStorage.getItem('waterline_session_v61')||'null')}catch(_){return null}}
function saveSession(code,name,sessionToken){try{localStorage.setItem(SESSION_KEY,JSON.stringify({code,name,sessionToken}))}catch(_){}}
function clearSession(){try{localStorage.removeItem(SESSION_KEY);localStorage.removeItem('waterline_session_v64');localStorage.removeItem('waterline_session_v63');localStorage.removeItem('waterline_session_v62');localStorage.removeItem('waterline_session_v61')}catch(_){}}
const savedAtBoot=loadSession();
const socket=io({transports:['websocket','polling'],reconnection:true,reconnectionAttempts:Infinity,reconnectionDelay:700,auth:{code:savedAtBoot?.code||'',name:savedAtBoot?.name||'',sessionToken:savedAtBoot?.sessionToken||''}});let S=null,tab='home',mapOpen=false,roomsOpen=false,feedbackTimer=null,lastResult='',resumeInFlight=false,manualSessionEpoch=0;
const $=q=>document.querySelector(q), esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names={estate:'오래된 저택',market:'운하 시장',pier:'낡은 선착장',canal:'수중 운하',district:'구주거구',archive:'기록보관소',station:'폐역',hospital:'수중 병원',theater:'침수 극장',deep:'심층 진입구',oldtown:'구시가지',greenhouse:'유리온실',observatory:'수문 관측소',archive2:'생활 기록 서고',salon:'운하 살롱'};
const desc={estate:'도시 가장자리의 오래된 집. 두 아이와 거대한 변이동물이 함께 산다.',market:'붉은 벽돌 건물과 운하가 이어지는 생활 중심지.',pier:'수면 위와 아래를 잇는 오래된 선착장.',canal:'사람과 배가 오가는 수중 생활권.',district:'평범한 집과 가게가 모여 있는 주거구.',archive:'도시의 생활 기록을 보관하는 건물.',station:'오래된 역과 선로가 남아 있는 곳.',hospital:'수면 위와 아래 주민들이 이용하는 병원.',theater:'수중 생활권의 작은 극장.',deep:'도시 아래쪽으로 이어지는 진입구.',oldtown:'오래된 가게와 골목이 이어지는 생활권.',greenhouse:'유리 지붕 아래 식물을 기르는 곳.',observatory:'도시의 수위와 날씨를 살피는 곳.',archive2:'생활 기록과 지도 사본이 쌓인 서고.',salon:'물길을 오가는 사람들이 쉬어 가는 작은 카드 살롱.'};
const links={estate:['market','pier'],market:['estate','pier','district','oldtown','salon'],pier:['estate','market','canal','salon'],canal:['pier','archive','district'],archive:['canal','station','archive2'],station:['archive','district','observatory'],district:['station','hospital','market','oldtown'],hospital:['district','theater'],theater:['hospital','deep'],deep:['theater'],oldtown:['market','district','greenhouse'],greenhouse:['oldtown','observatory'],observatory:['greenhouse','station','archive2'],archive2:['observatory','archive'],salon:['market','pier']};
const spots={estate:['온실','서재','현관'],market:['파이 가게','골동품상','수로 계단'],pier:['계류 밧줄','발자국','수면'],canal:['우체통','유리창','잠긴 문'],archive:['열람실','금고','금지서고'],station:['승강장','역무실','느린 오래된 시계'],district:['빈 집','세탁소','옥상'],hospital:['접수실','수중 병실','기록실'],theater:['매표소','무대','영사실'],deep:['잠수엘리베이터','수문','검은 계단'],oldtown:['시계 수리점','빈 극장표 가게','벽화 골목'],greenhouse:['말라붙은 연못','유리 천장','씨앗 보관함'],observatory:['수위계','낡은 망원경','기록실'],archive2:['봉인 서랍','오래된 기록','열람대'],salon:['카드 테이블','창가 좌석','낡은 주크박스']};
const mansion={hall:{name:'현관 홀',floor:'1F',desc:'도시에서 돌아오면 가장 먼저 지나게 되는 석조 현관.',actions:['clean','inspect']},kitchen:{name:'주방',floor:'1F',desc:'큰 조리대와 오래된 저장고가 있는 곳.',actions:['cook','clean','repair']},dining:{name:'식당',floor:'1F',desc:'긴 식탁과 창문이 있는 가족의 식사 공간.',actions:['eat','talk']},living:{name:'거실',floor:'1F',desc:'아이들과 변이동물이 가장 자주 머무는 공간.',actions:['talk','rest','clean']},laundry:{name:'세탁실',floor:'1F',desc:'빗물과 지하수를 이용하는 오래된 세탁 설비.',actions:['wash','repair']},storage:{name:'창고',floor:'1F',desc:'도시에서 가져온 물건과 생활 자원을 보관한다.',actions:['sort','inspect']},greenhouse:{name:'온실',floor:'1F',desc:'깨진 유리 사이로 물가 식물이 자라는 온실.',actions:['plant','water','inspect']},dock:{name:'실내 선착장',floor:'1F',desc:'저택 뒤쪽 수로와 직접 연결된 작은 선착장.',actions:['prepare_trip','fish']},kids_a:{name:'아이 A의 방',floor:'2F',desc:'작은 물건과 장난감이 놓여 있다.',actions:['talk','clean','inspect']},kids_b:{name:'아이 B의 방',floor:'2F',desc:'책과 지도, 오래된 장난감이 놓여 있다.',actions:['talk','clean','inspect']},study:{name:'공동 서재',floor:'2F',desc:'도시 지도와 저택의 기록을 보관한다.',actions:['read','sort','inspect']},bedroom:{name:'옛 주인 침실',floor:'2F',desc:'오래된 가구가 그대로 남아 있는 방.',actions:['inspect']},guest:{name:'손님방',floor:'2F',desc:'필요할 때 잠시 쉬어 가는 방.',actions:['rest','clean']},attic:{name:'다락',floor:'3F',desc:'정리되지 않은 상자와 가구가 쌓여 있다.',actions:['inspect','sort']},archive:{name:'옛 주인 서재',floor:'3F',desc:'도시와 저택에 관한 문서가 남아 있다.',actions:['read','inspect']},music:{name:'음악실',floor:'3F',desc:'물에 젖지 않은 악기들이 보존되어 있다.',actions:['play','inspect']},boiler:{name:'보일러실',floor:'B1',desc:'난방과 온수의 핵심 설비.',actions:['repair','fuel']},water:{name:'물 저장고',floor:'B1',desc:'물을 저장하고 정화하는 공간.',actions:['purify','inspect']},workshop:{name:'수리실',floor:'B1',desc:'도시에서 가져온 부품을 수리한다.',actions:['repair','craft']},basement:{name:'지하 저장고',floor:'B2',desc:'절반이 물에 잠겼지만 방수 구조 덕분에 보존되어 있다.',actions:['inspect','dive']},underwater:{name:'수중 복도',floor:'B2',desc:'저택 아래를 가로지르는 오래된 복도.',actions:['dive','inspect']},garden_b:{name:'지하 정원',floor:'B2',desc:'수면 아래에서도 살아가는 식물이 자란다.',actions:['plant','inspect']}};
const actionLabel={clean:'청소하기',cook:'요리하기',eat:'함께 식사하기',talk:'이야기하기',rest:'쉬기',repair:'수리하기',wash:'빨래하기',sort:'정리하기',inspect:'방을 살펴보기',plant:'식물 돌보기',water:'물 주기',prepare_trip:'외출 준비하기',fish:'낚시하기',read:'기록 읽기',play:'악기 연주하기',fuel:'연료 보충',purify:'물 정화',craft:'부품 만들기',dive:'잠수해서 조사'};
const actionHint={clean:'청결이 오른다',cook:'식량이 늘어난다',eat:'허기와 관계가 회복된다',talk:'아이들과 시간을 보낸다',rest:'기운을 회복한다',repair:'집 상태가 좋아지고 일부 방이 열린다',wash:'집이 정돈된다',sort:'숨은 물건을 찾을 수 있다',inspect:'방의 흔적을 조사한다',plant:'온실을 돌본다',water:'온실 상태를 바꾼다',prepare_trip:'도시로 나갈 준비를 한다',fish:'식량을 얻는다',read:'저택의 기록을 읽는다',play:'집의 분위기를 바꾼다',fuel:'연료를 보충한다',purify:'물을 확보한다',craft:'수리 부품을 만든다',dive:'수중 공간을 조사한다'};
const npcsByArea={estate:[{id:'childA',name:'아이 A',role:'저택의 아이',type:'talk',hint:'오늘 있었던 일을 이야기한다.'},{id:'childB',name:'아이 B',role:'저택의 아이',type:'talk',hint:'도시에서 본 것을 이야기한다.'}],market:[{id:'pie',name:'파이 장인',role:'상인',type:'talk',hint:'시장 소식을 들을 수 있다.'},{id:'antique',name:'골동품상',role:'상인',type:'talk',hint:'오래된 생활용품을 보여 준다.'}],station:[{id:'keeper',name:'역무원',role:'역무원',type:'talk',hint:'역의 현재 상황을 이야기한다.'}],archive:[{id:'archivist',name:'기록관 세라',role:'기록관',type:'talk',hint:'도시 생활 기록을 안내한다.'}],hospital:[{id:'doctor',name:'의사 로웬',role:'의사',type:'talk',hint:'수중 생활에 대해 이야기한다.'}],theater:[{id:'actor',name:'극장 관리인 이오',role:'관리인',type:'talk',hint:'극장 이야기를 들을 수 있다.'}],district:[{id:'washer',name:'세탁소 주인',role:'주민',type:'talk',hint:'동네 소식을 들을 수 있다.'}],oldtown:[{id:'MARA',name:'마라',role:'주민',type:'extra',hint:'구시가지 이야기를 들을 수 있다.'}],greenhouse:[{id:'LUNE',name:'룬',role:'관리인',type:'extra',hint:'식물과 온실 이야기를 들을 수 있다.'}],observatory:[{id:'ORIN',name:'오린',role:'관측자',type:'extra',hint:'수위 이야기를 들을 수 있다.'}],archive2:[{id:'VEIL',name:'베일',role:'서고 관리인',type:'extra',hint:'오래된 생활 기록을 보여 준다.'}]};
const lockedRooms=new Set(['bedroom','attic','archive','music','basement','underwater','garden_b']);
const roomObjectNames={hall:['젖은 우산','우편함','현관 거울'],kitchen:['오래된 냄비','식료품장','벽의 메모'],dining:['긴 식탁','빈 의자','창가'],living:['벽시계','낡은 소파','수조'],laundry:['세탁통','빨랫줄','배수구'],storage:['목상자','공구함','방수 가방'],greenhouse:['유리 화분','물가 식물','금 간 창'],dock:['계류 밧줄','낡은 보트','수면 아래 사다리'],kids_a:['작은 상자','그림','창문'],kids_b:['지도 묶음','장난감 배','서랍'],study:['도시 지도','장부','책상 서랍'],bedroom:['침대 옆 탁자','초상화','잠긴 서랍'],guest:['침대','여행 가방','창문'],attic:['먼지 쌓인 상자','오래된 깃발','작은 문'],archive:['장부 선반','봉인 문서','지도 서랍'],music:['피아노','악보','축음기'],boiler:['보일러 게이지','밸브','연료통'],water:['수위계','정화 필터','수조'],workshop:['작업대','부품 상자','손전등'],basement:['잠긴 상자','침수 계단','벽의 금속판'],underwater:['수중 창','녹슨 표지판','검은 문'],garden_b:['빛나는 수초','돌 연못','뿌리 사이의 틈']};
function me(){return S?.players?.find(x=>x.id===socket.id)}
function showFeedback(title,text,kind='result'){
 document.querySelector('.feedback-pop')?.remove();
 clearTimeout(feedbackTimer);
 const el=document.createElement('div');
 el.className='feedback-pop '+kind;
 el.innerHTML=`<div class="feedback-kicker">${kind==='error'?'지금은 안 됨':kind==='reward'?'발견':'변화'}</div><h2>${esc(title)}</h2><p>${esc(text)}</p><button type="button" class="feedback-confirm">확인</button>`;
 document.body.appendChild(el);
 document.body.classList.add('modal-open');
 const close=() =>{if(el.isConnected)el.remove();document.body.classList.remove('modal-open');};
 el.querySelector('.feedback-confirm').addEventListener('click',e=>{e.preventDefault();e.stopPropagation();close();});
 feedbackTimer=setTimeout(close,4500);
 document.body.classList.add('modal-open');
}
function call(ev,data={}){socket.emit(ev,data,r=>{if(!r){showFeedback('응답 없음','서버에서 응답을 받지 못했다.','error');return}if(!r.ok){showFeedback('지금은 할 수 없음',r.error||'아직 할 수 없는 행동이다.','error');return}if(r.text){lastResult=r.text;const title=ev==='talk'||ev==='extraTalk'?'대화':ev==='move'?'이동 완료':ev==='mansionMove'?'방 이동':ev==='mansionInspect'||ev==='inspect'?'조사 결과':'행동 결과';showFeedback(title,r.text,r.item?'reward':'result')}else if(ev==='inspect'&&r.scene){lastResult='새로운 장면을 발견했다.'}if(r.item&&!r.text)showFeedback('새 물건을 발견했다',`${r.item}을(를) 가방에 넣었다.`,'reward')})}
function shell(){const p=me();if(!S||!p)return;$('#lobby').classList.add('hidden');$('#game').classList.remove('hidden');$('#chapter').textContent=`DAY ${S.day}`;$('#place').textContent=names[p.loc]||p.loc;$('#clock').textContent=`${S.time}${S.night?' · 밤':''}`;$('#objective').textContent=S.objective||'오늘은 원하는 곳을 살펴보자.'}
function nav(){const p=me();return `<div class="topnav"><button class="${tab==='home'?'active':''}" data-tab="home">저택</button><button class="${tab==='city'?'active':''}" data-tab="city">도시</button><button type="button" data-map-open>지도</button><button class="${tab==='case'?'active':''}" data-tab="case">기록 <i>${p?.clues?.length||0}</i></button><button class="${tab==='bag'?'active':''}" data-tab="bag">가방</button></div>`}
function guide(){const p=me();if(!p)return '';if(p.loc==='estate'&&tab==='home')return `<div class="guide strong"><span class="guide-icon">●</span><div><b>이 방에서 할 수 있는 일을 찾아보세요.</b><p>빛나는 물건을 누르면 조사하고, 아래의 큰 행동 버튼을 누르면 생활 행동을 합니다.</p></div></div>`;if(tab==='city')return `<div class="guide strong"><span class="guide-icon">●</span><div><b>장소·사람·발견 카드를 직접 눌러 행동하세요.</b><p>지도는 현재 장소에서 갈 수 있는 곳만 밝게 표시합니다.</p></div></div>`;return `<div class="guide"><span class="guide-icon">●</span><div><b>${esc(S.objective||'원하는 일을 해보세요.')}</b><p>기록은 결과를 다시 읽는 곳입니다. 행동은 저택과 도시 화면에서 시작됩니다.</p></div></div>`}
function npcView(){const p=me(),list=npcsByArea[p.loc]||[];if(!list.length)return '';return `<div class="npc-section"><div class="section-title"><span>사람</span><small>지금 여기에서 만날 수 있음</small></div><div class="npc-grid">${list.map(n=>{const rel=p.rel?.[n.id]||0;return `<article class="npc-card"><div class="npc-avatar">${esc(n.name.slice(0,1))}</div><div class="npc-copy"><b>${esc(n.name)}</b><small>${esc(n.role)} · 관계 ${rel}</small><p>${esc(n.hint)}</p></div><button type="button" data-npc-${n.type}="${esc(n.id)}">${n.type==='extra'?'말 걸기':'이야기하기'} · ${rel<2?'처음 대화':'다시 대화'}</button></article>`}).join('')}</div></div>`}
function roomObjects(room){return (roomObjectNames[room]||[]).map((x,i)=>`<button type="button" class="room-hotspot h${i}" data-mansion-inspect="${i}"><span class="hotspot-dot">●</span><b>${esc(x)}</b><small>눌러서 조사</small></button>`).join('')}
function dailyEventView(){
  const e=S.event;
  if(!e||e.used)return `<div class="daily-empty"><b>오늘의 특별한 일</b><span>아직 눈에 띄는 일이 없습니다. 도시를 돌아다니며 찾아보세요.</span></div>`;
  const p=me();
  const here=e.area===p?.loc;
  return `<section class="daily-event ${here?'nearby':''}">
    <div class="event-kicker">TODAY · ${esc(e.area==='estate'?'저택':names[e.area]||'도시')}</div>
    <h3>${esc(e.title)}</h3><p>${esc(e.text)}</p>
    ${here?`<div class="event-actions"><button type="button" data-event="investigate">직접 살펴본다 <small>단서 + 보상</small></button><button type="button" data-event="help">도와준다 <small>보상 +10c</small></button><button type="button" data-event="ignore">오늘은 지나친다</button></div>`:`<div class="event-away"><span>이 사건은 ${esc(names[e.area]||e.area)}에서 기다리고 있습니다.</span><button type="button" data-move="${esc(e.area)}">그곳으로 가기 →</button></div>`}
  </section>`;
}
function rewardStrip(){
 const p=me(),m=S.mansionState||{}; const clock=`DAY ${m.day||1} · ${String(m.time??8).padStart(2,'0')}:00`;
 return `<div class="dopamine-strip"><div><b>오늘의 발견</b><span>${esc(lastResult||'빛나는 물건이나 새로운 사람을 찾아보세요.')}</span></div><div class="meters"><span>${clock}</span><span>기운 <b>${m.energy??6}/6</b></span><span>허기 <b>${m.hunger??6}/6</b></span><span>행동 <b>${p.actions}</b></span><span>돈 <b>${p.money}c</b></span><span>발견 <b>${p.clues?.length||0}</b></span></div></div>`;
}
function homeView(){const p=me(),m=S.mansionState||{room:'hall',home_clean:5,house_condition:5,water:5,food:5,fuel:5,unlocks:[]},r=mansion[m.room]||mansion.hall;const actions=r.actions||[];return `<section class="play">${rewardStrip()}${dailyEventView()}<div class="scene-head"><div><span class="eyebrow">저택 · ${r.floor}</span><h2>${esc(r.name)}</h2><p>${esc(r.desc)}</p></div><button class="room-list-btn" type="button" data-room-drawer>▦ 다른 방 보기</button></div><div class="room-art ${m.room}"><div class="room-backdrop"></div>${roomObjects(m.room)}<div class="room-caption"><b>${esc(r.name)}</b><span>화면의 빛나는 물건을 눌러보세요</span></div></div><div class="status-row mansion-resources"><span>집 ${m.house_condition}/10</span><span>청결 ${m.home_clean}/10</span><span>물 ${m.water}/10</span><span>식량 ${m.food}/10</span><span>연료 ${m.fuel}/10</span><span>재료 ${m.materials??0}</span><span>지식 ${m.knowledge??0}</span><span>관계 ${m.relationship??0}</span></div>${npcView()}<div class="section-title"><span>지금 할 수 있는 생활</span><small>버튼을 누르면 바로 시간이 흐릅니다</small></div><div class="action-cards">${actions.map(a=>`<button type="button" data-mansion-action="${a}"><b>${actionLabel[a]}</b><small>${actionHint[a]}</small></button>`).join('')}</div>${p.loc==='estate'?`<div class="exit-card"><div><span class="eyebrow">밖으로</span><b>도시로 나가기</b><p>저택의 현관에서 바로 갈 수 있는 곳입니다.</p></div><div class="exit-buttons"><button type="button" data-move="market">운하 시장</button><button type="button" data-move="pier">낡은 선착장</button></div></div>`:''}<div class="recent-change"><span>최근 변화</span><b>${esc(lastResult||S.log?.[S.log.length-1]?.t||'아직 아무 행동도 하지 않았습니다.')}</b></div></section>`}
function roomDrawer(){const m=S.mansionState||{room:'hall',unlocks:[]};const groups={};for(const [k,v] of Object.entries(mansion)){if(lockedRooms.has(k)&&!(m.unlocks||[]).includes(k))continue;(groups[v.floor]??=[]).push([k,v])}return `<div class="overlay room-overlay" data-close-room><div class="drawer"><div class="drawer-head"><div><b>저택의 방</b><small>현재 방: ${esc(mansion[m.room]?.name||'현관 홀')}</small></div><button type="button" data-close-room>닫기</button></div>${Object.entries(groups).map(([f,rs])=>`<div class="floor"><span>${f}</span><div>${rs.map(([k,v])=>`<button type="button" class="${m.room===k?'here':''}" data-mansion-move="${k}">${v.name}${m.room===k?' · 현재':''}</button>`).join('')}</div></div>`).join('')}</div></div>`}
function cityView(){const p=me();if(p.loc==='estate')return `<section class="play empty-city">${rewardStrip()}${dailyEventView()}<div class="city-hero"><span class="eyebrow">도시로 나가기</span><h2>저택 밖의 수몰 도시</h2><p>수면 위와 아래가 하나의 생활권으로 이어집니다. 장소를 고른 뒤 실제로 이동하세요.</p><div><button type="button" data-move="market">운하 시장으로 이동</button><button type="button" data-move="pier">낡은 선착장으로 이동</button></div></div></section>`;const hereSpots=spots[p.loc]||[];return `<section class="play">${rewardStrip()}${dailyEventView()}<div class="scene-head"><div><span class="eyebrow">도시 · ${names[p.loc]}</span><h2>${names[p.loc]}</h2><p>${esc(desc[p.loc]||'')}</p></div><button class="map-btn" type="button" data-map-open>지도 열기</button></div><div class="city-art ${p.loc}"><div class="city-building a"></div><div class="city-building b"></div><div class="city-boat"></div><div class="city-caption"><b>${names[p.loc]}</b><span>이곳의 생활과 사람을 살펴보세요</span></div></div>${npcView()}${p.loc==='salon'?miniView():''}<div class="section-title"><span>이곳에서 할 일</span><small>발견 → 선택 → 보상 → 다음 행동으로 이어집니다</small></div><div class="spot-cards">${hereSpots.map((x,i)=>`<button type="button" data-inspect="${i}"><span class="spot-dot">●</span><b>${esc(x)}</b><small>가까이 가서 조사</small></button>`).join('')}</div><div class="city-actions"><button type="button" class="big-map" data-map-open>🧭 다른 장소로 이동하기</button></div><div class="recent-change"><span>최근 변화</span><b>${esc(lastResult||S.log?.[S.log.length-1]?.t||'아직 아무것도 조사하지 않았습니다.')}</b></div></section>`}
function mapOverlay(){
 const p=me(); if(!p)return '';
 return `<div class="overlay map-overlay" data-close-map>
   <div class="map-modal">
     <div class="drawer-head">
       <div><span class="eyebrow">CITY MAP</span><h2>어디로 갈까요?</h2><small>바로 옆 장소는 행동 1, 먼 장소는 행동 2가 듭니다.</small></div>
       <button type="button" data-close-map>닫기</button>
     </div>
     <div class="map-lines">${Object.entries(names).filter(([k])=>k!=='estate').map(([k,n])=>{
       const here=k===p.loc;
       const direct=(links[p.loc]||[]).includes(k);
       return here
        ? `<div class="map-node here"><b>${n}</b><small>현재 위치</small></div>`
        : `<button type="button" class="map-node can" data-move="${k}"><b>${n}</b><small>${direct?'바로 이동 · 행동 1':'이동 · 행동 2'} →</small></button>`;
     }).join('')}</div>
     <div class="map-footnote">도시는 하나의 생활권입니다. 막혀 있는 장소 대신 갈 수 있는 곳을 선택하세요.</div>
   </div>
 </div>`;
}
function caseView(){const p=me(),clues=(p.clues||[]).slice().reverse();return `<section class="play"><div class="scene-head"><div><span class="eyebrow">기록</span><h2>사건 기록</h2><p>발견한 결과를 다시 읽는 곳입니다. <b>여기서는 새로운 행동을 시작하지 않습니다.</b></p></div></div><div class="record-now"><span>최근 기록</span><b>${esc(lastResult||S.log?.[S.log.length-1]?.t||'아직 발견한 것이 없습니다.')}</b></div><div class="record-list">${clues.map(c=>`<article><span>DAY ${c.day}</span><b>${esc(c.text)}</b><small>${esc(c.area)}</small></article>`).join('')||`<div class="empty-record">아직 기록이 없습니다.<br>저택의 빛나는 물건이나 도시의 조사 카드를 눌러보세요.</div>`}</div></section>`}
function bagView(){const p=me();return `<section class="play"><div class="scene-head"><div><span class="eyebrow">가방</span><h2>가방</h2><p>탐험하면서 직접 얻은 물건입니다.</p></div></div><div class="bag-grid">${(p.items||[]).map(x=>`<article><b>${esc(x)}</b><small>소지품</small></article>`).join('')||'<div class="empty-record">아직 아무것도 없습니다.</div>'}</div><div class="status-big"><div><b>기운</b><strong>${p.energy}</strong></div><div><b>허기</b><strong>${p.hunger}</strong></div><div><b>행동</b><strong>${p.actions}</strong></div><div><b>돈</b><strong>${p.money}c</strong></div></div></section>`}
function miniView(){const p=me();if(p.loc!=='salon')return '';const m=p.minigame;return `<div class="mini-wrap"><div class="section-title"><span>카드 살롱</span><small>게임 코인 5개 · 실제 돈 없음</small></div><div class="mini-tabs"><button type="button" data-mini-play="poker">포커 한 판</button><button type="button" data-mini-play="baccarat" data-mini-choice="player">바카라 · 플레이어</button><button type="button" data-mini-play="baccarat" data-mini-choice="banker">바카라 · 뱅커</button><button type="button" data-mini-play="baccarat" data-mini-choice="tie">바카라 · 타이</button></div>${m?`<div class="mini-result jackpot"><b>${m.type==='poker'?'포커 결과':'바카라 결과'}</b><p>${m.type==='poker'?(m.won?'승리! +5코인':m.tie?'무승부':'패배'):`PLAYER ${m.pt} · BANKER ${m.bt} · ${m.result}`}</p></div>`:''}</div>`}
function mansionEventOverlay(){
 const ev=S.mansionEvent;if(!ev)return '';
 return `<div class="overlay mansion-event-overlay"><div class="mansion-event-card">
   <span class="eyebrow">저택의 작은 사건</span>
   <h2>${esc(ev.title)}</h2><p>${esc(ev.text)}</p>
   <div class="mansion-event-choices">${(ev.choices||[]).map((c,i)=>`<button type="button" data-mansion-event-choice="${esc(c.id)}"><span>${String.fromCharCode(65+i)}</span><div><b>${esc(c.text)}</b><small>선택에 따라 자원·관계·새 방이 달라질 수 있습니다.</small></div></button>`).join('')}</div>
 </div></div>`;
}
function sceneOverlay(){const sc=S.scene;if(!sc)return '';return `<div class="overlay scene-overlay"><div class="scene-card"><div class="scene-live">지금 선택하면 바로 결과가 바뀝니다</div><span class="eyebrow">조사 결과 · ${names[sc.loc]||sc.loc}</span><h2>${esc(sc.title)}</h2><p>${esc(sc.text)}</p><div class="choices">${(sc.choices||[]).map((c,i)=>`<button type="button" data-scene-choice="${esc(c.id)}"><span>${String.fromCharCode(65+i)}</span><div><b>${esc(c.label)}</b><small>${c.knowledge?`단서 +${c.knowledge}`:''}${c.item?' · 물건 발견':''}</small></div></button>`).join('')}</div></div></div>`}
function render(){shell();const p=me();if(!p)return;$('#view').innerHTML=nav()+guide()+(tab==='home'?homeView():tab==='city'?cityView():tab==='case'?caseView():bagView());if(roomsOpen){document.body.insertAdjacentHTML('beforeend',roomDrawer());roomsOpen=false}if(mapOpen){document.querySelector('.map-overlay')?.remove();document.body.insertAdjacentHTML('beforeend',mapOverlay())}document.querySelector('.scene-overlay')?.remove();document.querySelector('.mansion-event-overlay')?.remove();if(S.mansionEvent)document.body.insertAdjacentHTML('beforeend',mansionEventOverlay());if(S.scene)document.body.insertAdjacentHTML('beforeend',sceneOverlay())}
function start(){manualSessionEpoch++;resumeInFlight=false;clearSession();const name=$('#name').value.trim()||'나';socket.auth={...(socket.auth||{}),code:'',name,sessionToken:''};if(!socket.connected){showFeedback('연결 중','서버 연결이 끝나면 다시 눌러 주세요.','error');return}socket.emit('create',{name},r=>{if(!r?.ok){showFeedback('도시를 만들 수 없음',r?.error||'새 도시를 만들지 못했습니다.','error');return}socket.auth={...(socket.auth||{}),code:r.code,name,sessionToken:r.sessionToken||''};saveSession(r.code,name,r.sessionToken||'');showFeedback('새 도시가 열렸습니다',`초대 코드: ${r.code}`,'reward')})}
function closeAllModals(){
  document.querySelectorAll('.feedback-pop,.map-overlay,.room-overlay,.scene-overlay,.mansion-event-overlay').forEach(x=>x.remove());
  document.body.classList.remove('modal-open');mapOpen=false;roomsOpen=false;
}
let lastHandledButton=null,lastHandledAt=0;
function handleWaterlineButton(b){
  if(!b || b.disabled) return false;
  const now=Date.now();
  if(lastHandledButton===b && now-lastHandledAt<450) return true;
  lastHandledButton=b; lastHandledAt=now;
  try{
    if(b.dataset.closeFeedback || b.classList.contains('feedback-confirm')){ b.closest('.feedback-pop')?.remove(); document.body.classList.remove('modal-open'); return true; }
    if(b.dataset.tab){ tab=b.dataset.tab; render(); return true; }
    if(b.dataset.roomDrawer){ closeAllModals(); roomsOpen=true; document.body.insertAdjacentHTML('beforeend',roomDrawer()); roomsOpen=false; return true; }
    if(b.dataset.closeRoom){ b.closest('.room-overlay')?.remove(); roomsOpen=false; return true; }
    if(b.dataset.mapOpen){ closeAllModals(); mapOpen=true; document.body.insertAdjacentHTML('beforeend',mapOverlay()); return true; }
    if(b.dataset.closeMap){ b.closest('.map-overlay')?.remove(); mapOpen=false; return true; }
    if(b.dataset.mansionMove){ call('mansionMove',{room:b.dataset.mansionMove}); b.closest('.room-overlay')?.remove(); roomsOpen=false; return true; }
    if(b.dataset.mansionAction){ call('mansionAction',{action:b.dataset.mansionAction}); return true; }
    if(b.dataset.mansionEventChoice){ call('mansionEventChoice',{eventId:S?.mansionEvent?.id||S?.mansionState?.activeEvent,choiceId:b.dataset.mansionEventChoice}); return true; }
    if(b.dataset.mansionInspect){ call('mansionInspect',{index:Number(b.dataset.mansionInspect)}); return true; }
    if(b.dataset.npcTalk){ call('talk',{npc:b.dataset.npcTalk}); return true; }
    if(b.dataset.npcExtra){ call('extraTalk',{id:b.dataset.npcExtra}); return true; }
    if(b.dataset.move){ const p=me(); if(p && b.dataset.move!==p.loc){ mapOpen=false; document.querySelector('.map-overlay')?.remove(); call('move',{to:b.dataset.move}); } return true; }
    if(b.dataset.inspect){ call('inspect',{spot:Number(b.dataset.inspect)}); return true; }
    if(b.dataset.sceneChoice){ call('sceneChoice',{choice:b.dataset.sceneChoice}); return true; }
    if(b.dataset.event){ call('eventChoice',{choice:b.dataset.event}); return true; }
    if(b.dataset.miniPlay){ call('miniPlay',b.dataset.miniPlay==='baccarat'?{game:'baccarat',choice:b.dataset.miniChoice}:{game:'poker'}); return true; }
    return false;
  }catch(err){ console.error('WATERLINE interaction error',err); showFeedback('버튼 오류','이 행동을 처리하는 중 문제가 발생했습니다.','error'); return true; }
}
function waterlinePointer(e){
  const b=e.target?.closest?.('button');
  if(!b) return;
  if(handleWaterlineButton(b)){ e.preventDefault(); }
}
document.addEventListener('pointerup',waterlinePointer,true);
document.addEventListener('click',waterlinePointer,true);
$('#create').onclick=start;
$('#join').onclick=()=>{manualSessionEpoch++;resumeInFlight=false;const name=$('#name').value.trim()||'나',code=$('#code').value.trim().toUpperCase();if(!code){showFeedback('초대 코드 필요','참여할 게임방의 초대 코드를 입력하세요.','error');return}clearSession();socket.auth={...(socket.auth||{}),code,name,sessionToken:''};if(!socket.connected){showFeedback('연결 중','서버 연결이 끝나면 다시 눌러 주세요.','error');return}socket.emit('join',{name,code},r=>{if(!r?.ok){showFeedback('게임방을 찾을 수 없음',r?.error||'초대 코드를 확인하세요.','error');return}socket.auth={...(socket.auth||{}),code:r.code,name,sessionToken:r.sessionToken||''};saveSession(r.code,name,r.sessionToken||'');showFeedback('게임방에 합류했습니다',`방 코드: ${r.code}`,'reward')})};
$('#rest').onclick=()=>call('rest');
socket.on('connect',()=>{const saved=loadSession();if(saved?.code && !resumeInFlight){const epoch=manualSessionEpoch;resumeInFlight=true;socket.emit('resume',{code:saved.code,name:saved.name||'나',sessionToken:saved.sessionToken||''},r=>{resumeInFlight=false;if(epoch!==manualSessionEpoch)return;if(r?.ok){socket.auth={...(socket.auth||{}),code:r.code,name:saved.name||'나',sessionToken:r.sessionToken||saved.sessionToken||''};saveSession(r.code,saved.name||'나',r.sessionToken||saved.sessionToken||'')}else{clearSession();S=null;$('#game').classList.add('hidden');$('#lobby').classList.remove('hidden');showFeedback('이전 게임방이 종료됨','서버가 재시작되어 이전 방이 사라졌습니다. 새 도시를 시작하거나 새 초대 코드를 입력하세요.','error')}})}});
socket.on('state',x=>{S=x;const p=me();if(p){if(p.loc==='estate'&&tab==='city')tab='home';else if(p.loc!=='estate'&&tab==='home')tab='city';}render()});
socket.on('connect_error',()=>{if(!S)showFeedback('서버 연결 중','잠시 후 다시 연결합니다.','error');});
socket.on('disconnect',()=>{if(S)showFeedback('잠시 연결이 끊김','게임 상태는 서버에 남아 있습니다. 재연결을 기다리는 중입니다.','error')});
socket.on('chat',x=>showFeedback(x.name,x.text,'result'));
})();
