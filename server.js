
const express=require("express"),http=require("http"),fs=require("fs"),{Server}=require("socket.io");
const app=express(),server=http.createServer(app),io=new Server(server);
const path=require("path"),PORT=process.env.PORT||3000;
app.use(express.static(path.join(__dirname,"public"),{etag:false,setHeaders:(res,file)=>{if(file.endsWith("app.js"))res.setHeader("Cache-Control","no-store");}}));
app.get("/health",(q,r)=>r.json({ok:true,version:"65.0"}));
app.get("*",(q,r)=>r.sendFile(path.join(__dirname,"public/index.html")));

const A={
estate:{n:"오래된 저택",links:["market","pier"],spots:["온실","서재","현관"],kind:"home",desc:"도시의 가장자리. 두 아이와 변이동물이 사는 오래된 집."},
market:{n:"운하 시장",links:["estate","pier","district","salon"],spots:["파이 가게","골동품상","수로 계단"],kind:"social",desc:"사람과 소문이 가장 많이 모이는 곳."},
pier:{n:"낡은 선착장",links:["estate","market","canal","salon"],spots:["계류 밧줄","발자국","수면"],kind:"explore",desc:"수면 아래 도시로 내려가는 오래된 부두."},
canal:{n:"수중 운하",links:["pier","archive","district"],spots:["우체통","유리창","잠긴 문"],kind:"explore",desc:"도시의 아래쪽을 잇는 물길."},
archive:{n:"기록보관소",links:["canal","station"],spots:["열람실","금고","금지서고"],kind:"lore",desc:"도시의 오래된 생활 기록을 보관한다."},
station:{n:"폐역",links:["archive","district"],spots:["승강장","역무실","조금 느리게 가는 오래된 시계"],kind:"mystery",desc:"사용하지 않는 역이지만 건물과 승강장은 남아 있다."},
district:{n:"구주거구",links:["station","hospital","market"],spots:["빈 집","세탁소","옥상"],kind:"life",desc:"도시의 평범한 생활과 이상현상이 겹치는 곳."},
hospital:{n:"수중 병원",links:["district","theater"],spots:["접수실","수중 병실","기록실"],kind:"lore",desc:"수면 위와 아래의 주민들이 이용하는 수중 병원."},
theater:{n:"침수 극장",links:["hospital","deep"],spots:["매표소","무대","영사실"],kind:"mystery",desc:"오래된 극장과 영사실을 관리하는 사람들이 있다."},
deep:{n:"심층 진입구",links:["theater"],spots:["잠수엘리베이터","수문","수중 계단"],kind:"danger",desc:"수면 아래 생활권으로 이어지는 깊은 진입구."},
salon:{n:"운하 살롱",links:["market","pier"],spots:["카드 테이블","창가 좌석","낡은 주크박스"],kind:"social",desc:"물길을 오가는 사람들이 쉬어 가는 작은 카드 살롱. 여기서 게임을 즐길 수 있다."}
};

const NPC={
childA:{n:"아이 A",area:"estate",max:8,desc:"저택에서 함께 사는 아이."},
childB:{n:"아이 B",area:"estate",max:8,desc:"저택에서 함께 사는 아이."},
pie:{n:"파이 장인",area:"market",max:6},
antique:{n:"골동품상",area:"market",max:7},
keeper:{n:"역무원",area:"station",max:8},
archivist:{n:"기록관 세라",area:"archive",max:8},
doctor:{n:"의사 로웬",area:"hospital",max:8},
actor:{n:"극장 관리인 이오",area:"theater",max:8},
washer:{n:"세탁소 주인",area:"district",max:6}
};

const MAIN=[
{id:"M1",ch:1,title:"저택의 하루",need:0,area:"estate",text:"새로운 하루가 시작되었다. 집 안을 살피고 오늘 필요한 일을 정해 보자.",goal:"저택을 둘러보고 오늘 할 일을 하나 정하라."},
{id:"M2",ch:1,title:"도시로 나가기",need:3,area:"estate",text:"집 밖에는 수면 위와 아래로 이어지는 도시가 있다.",goal:"운하 시장이나 선착장을 한 번 방문하라."},
{id:"M3",ch:1,title:"도시의 생활",need:6,area:"market",text:"시장과 선착장은 사람과 변이동물이 오가는 생활 공간이다.",goal:"도시의 물건 세 가지를 조사하라."},
{id:"M4",ch:2,title:"집으로 돌아오기",need:10,area:"estate",text:"도시에서 가져온 물건과 이야기는 저택의 생활에도 영향을 준다.",goal:"저택으로 돌아와 물건을 정리하거나 수리하라."},
{id:"M5",ch:2,title:"새로운 길",need:14,area:"canal",text:"수로를 따라가면 아직 가보지 않은 생활권이 열린다.",goal:"새로운 도시 지역 하나를 발견하라."},
{id:"M6",ch:2,title:"도시의 사람들",need:19,area:"district",text:"주민들은 각자의 일과 생활을 이어가고 있다.",goal:"도시 주민과 이야기를 나눠 보라."},
{id:"M7",ch:3,title:"저택을 돌보기",need:25,area:"estate",text:"큰 집을 유지하려면 물과 식량, 수리와 청소가 필요하다.",goal:"저택의 상태를 한 가지 개선하라."},
{id:"M8",ch:3,title:"함께하는 시간",need:31,area:"estate",text:"아이들과 변이동물도 저택의 하루를 함께 만든다.",goal:"저택에서 가족과 시간을 보내라."},
{id:"M9",ch:4,title:"도시의 작은 사건",need:38,area:"market",text:"평범한 하루에도 작은 사건이 생긴다. 직접 보고 선택해 보자.",goal:"도시에서 발생한 사건 하나를 해결하라."},
{id:"M10",ch:4,title:"나만의 생활 방식",need:46,area:"estate",text:"탐험, 생활, 수집, 미니게임 중 원하는 활동을 반복할 수 있다.",goal:"원하는 활동을 세 번 반복하라."},
{id:"M11",ch:5,title:"더 깊은 생활권",need:55,area:"canal",text:"도시의 수로와 연결된 장소를 하나씩 탐험한다.",goal:"새로운 생활권을 하나 해금하라."},
{id:"M12",ch:5,title:"계속되는 하루",need:66,area:"estate",text:"하루가 지나도 도시는 계속되고, 저택에도 새로운 일이 생긴다.",goal:"하루를 마치고 다음 날을 맞이하라."}
];

const SIDE=[
{id:"S1",area:"market",title:"사라진 파이",steps:4,text:["파이 장인의 파이 하나가 사라졌다.","발자국은 시장 안쪽으로 이어진다.","주변 사람들에게 물어보니 아이가 들고 간 것 같다.","결국 배고픈 아이에게 나눠 준 것으로 밝혀졌다."]},
{id:"S2",area:"district",title:"빈집의 따뜻한 컵",steps:5,text:["사람이 없는 집에 따뜻한 컵이 놓여 있다.","주민에게 물어보니 집주인은 가끔 들른다고 한다.","창문에는 최근 닦은 흔적이 있다.","집 안의 물건을 정리해 주기로 한다.","다음 방문 때는 깨끗한 집이 되어 있다."]},
{id:"S3",area:"station",title:"역무실의 부탁",steps:6,text:["역무원이 오래된 물품을 찾아 달라고 부탁한다.","승강장 근처에서 상자를 발견한다.","상자 안에는 사용 가능한 부품이 있다.","역무실 장부와 물품 번호를 대조한다.","필요한 물건을 역무원에게 건넨다.","다음 방문부터 작은 할인 혜택을 받는다."]},
{id:"S4",area:"hospital",title:"병원의 물품 정리",steps:5,text:["수중 병원에 새 물품이 들어왔다.","직원은 보관실 정리를 부탁한다.","오래된 상자와 새 상자를 구분한다.","필요한 물건을 찾는다.","정리가 끝나고 병원에서 작은 보상을 준다."]},
{id:"S5",area:"theater",title:"극장 정리",steps:7,text:["극장 관리인이 오래된 상영관을 정리하고 있다.","좌석 사이에서 표 한 장을 찾는다.","무대 뒤의 상자도 확인한다.","사용 가능한 장식품을 골라낸다.","영사실의 먼지를 닦는다.","관리인이 다음 상영 준비를 시작한다.","극장은 다시 사람을 맞을 준비를 한다."]},
{id:"S6",area:"canal",title:"빨간 우체통",steps:5,text:["수중 우체통에 이름 없는 편지가 들어 있다.","우편물을 확인한다.","주소가 번져 있어 주변을 살핀다.","배달할 곳을 찾아낸다.","편지를 전달하고 하루를 마친다."]}
];

const RANDOM=[
["시장 소동","상인 둘이 같은 물건을 서로 자기 것이라 주장한다.","market"],
["수위 상승","운하 수위가 올라 평소 못 가던 계단이 드러난다.","canal"],
["정전","도시 일부의 불이 꺼지고 주민들이 촛불을 켠다.","district"],
["낯선 파이","시장에 누구도 주문하지 않은 파이가 하나 놓였다.","market"],
["젖은 편지","선착장 우편함에 이름 없는 편지가 들어왔다.","pier"],
["옥상의 노래","구주거구 옥상에서 누군가 악기를 연주한다.","district"],
["온실의 발자국","온실에 누군가 다녀간 흔적이 생겼다.","greenhouse"],
["관측소 경보","수위 관측소에서 점검 경보가 울린다.","observatory"],
["저택의 손님","현관에 도시 주민이 잠시 들렀다.","estate"],
["변이동물의 장난","집에 돌아오니 변이동물이 물건 하나를 물고 있다.","estate"]
];

function mk(code){return{
code,day:1,min:510,chapter:1,score:0,progress:0,objective:MAIN[0].goal,players:new Map(),
side:Object.fromEntries(SIDE.map(x=>[x.id,{step:0,done:false}])),
flags:{},event:null,log:[],stats:{discoveries:0,talks:0,events:0,quests:0,days:1},choiceState:{current:null,history:[]},mansionState:{room:'hall',day:1,time:8,home_clean:5,house_condition:5,water:5,food:5,fuel:5,materials:3,parts:0,knowledge:0,relationship:0,energy:6,hunger:6,prepared:0,unlocks:[]},inventory:[],saveVersion:22,
world:{marketTrust:0,stationPower:0,hospitalTrust:0,theaterPower:0,waterLevel:0,doorProgress:0,
history:[],ending:null,opened:{estate:true,market:true,pier:true,canal:true,district:true,archive:false,station:false,hospital:false,theater:false,deep:false,oldtown:false,greenhouse:false,observatory:false,archive2:false,salon:true}},
choices:{},combos:[],achievements:[],dailySeed:0,scene:null,sceneHistory:[],spotVisits:{}}}
function player(id,name,role){return{id,sessionToken:null,name:(name||"플레이어").slice(0,12),role,loc:"estate",energy:100,hunger:10,warmth:100,actions:10,money:30,items:role==="A"?["낡은 열쇠","방수노트"]:["작은 손전등"],clues:[],shared:[],rel:{},completed:[]}}
const rooms=new Map();
const sessions=new Map();
const SAVE_VERSION=1;
function serializeRoom(r){return {...r,players:[...r.players.values()]};}
function restoreRoom(raw){
  if(!raw||!raw.code)return null;
  const r={...raw,players:new Map((raw.players||[]).map(p=>[p.id,p]))};
  return r;
}
function loadRooms(){
  try{
    if(!fs.existsSync(SAVE_FILE))return;
    const raw=JSON.parse(fs.readFileSync(SAVE_FILE,'utf8'));
    if(raw.version!==SAVE_VERSION||!Array.isArray(raw.rooms))return;
    for(const item of raw.rooms){
      const r=restoreRoom(item); if(!r)continue;
      for(const p of r.players.values()){p.disconnectedAt=p.disconnectedAt||Date.now(); if(p.sessionToken)sessions.set(p.sessionToken,{code:r.code,playerId:p.id});}
      rooms.set(r.code,r);
    }
    console.log(`restored ${rooms.size} saved game room(s)`);
  }catch(e){console.warn('save load failed',e.message)}
}
let saveTimer=null;
function saveRooms(){
  try{
    if(!fs.existsSync(DATA_DIR))fs.mkdirSync(DATA_DIR,{recursive:true});
    const payload={version:SAVE_VERSION,savedAt:Date.now(),rooms:[...rooms.values()].map(serializeRoom)};
    const tmp=SAVE_FILE+'.tmp';
    fs.writeFileSync(tmp,JSON.stringify(payload));
    fs.renameSync(tmp,SAVE_FILE);
  }catch(e){console.warn('save failed',e.message)}
}
function scheduleSave(){if(saveTimer)return;saveTimer=setTimeout(()=>{saveTimer=null;saveRooms()},250);}

function newSessionToken(){return Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2);}
function bindSession(r,p){
  if(!p.sessionToken) p.sessionToken=newSessionToken();
  sessions.set(p.sessionToken,{code:r.code,playerId:p.id});
  return p.sessionToken;
}
function unbindSession(p){if(p?.sessionToken)sessions.delete(p.sessionToken)}
loadRooms();
setInterval(saveRooms,5000);
process.on('SIGTERM',()=>{saveRooms();process.exit(0)});
process.on('SIGINT',()=>{saveRooms();process.exit(0)});
function me(r,id){return r?.players.get(id)}
function getRoom(s){
  const code=s.data?.code || String(s.handshake?.auth?.code||'').toUpperCase();
  return rooms.get(String(code||'').toUpperCase());
}
function resumeIntoRoom(s,code,name,token){
  let r=null,p=null;
  const byToken=token ? sessions.get(token) : null;
  if(byToken) r=rooms.get(byToken.code);
  if(!r && code) r=rooms.get(String(code).toUpperCase());
  if(!r) return null;
  if(byToken && byToken.code===r.code){
    p=r.players.get(byToken.playerId) || [...r.players.values()].find(x=>x.sessionToken===token);
  }
  const wanted=(name||'').trim();
  if(!p && wanted) p=[...r.players.values()].find(x=>x.name===wanted && x.disconnectedAt);
  if(!p && r.players.size<2){p=player(s.id,wanted||'나',r.players.size?'B':'A');}
  if(!p) return null;
  if(p.id!==s.id){r.players.delete(p.id);p.id=s.id;}
  p.disconnectedAt=0;r.players.set(s.id,p);
  const sessionToken=bindSession(r,p);
  s.join(r.code);s.data.code=r.code;s.data.name=p.name;s.data.sessionToken=sessionToken;
  return r;
}
function log(r,t,k="normal"){r.log.push({t,k});if(r.log.length>100)r.log.shift()}
function hour(r){return`${String(Math.floor(r.min/60)).padStart(2,"0")}:${String(r.min%60).padStart(2,"0")}`}
function advance(r,n=20){r.min+=n;if(r.min>=1440){r.min-=1440;r.day++;r.flags.freeplay=true;for(const p of r.players.values()){p.actions=10;p.energy=Math.min(100,p.energy+35);p.hunger=Math.max(0,p.hunger-12);p.warmth=100}newEvent(r);log(r,`DAY ${r.day}. 도시가 새로운 하루를 시작했다.`,"day")}if(r.min>=1320&&!r.flags.night){r.flags.night=true;log(r,"밤이 되었다. 폐역과 극장에서 특별한 사건이 발생할 수 있다.","night")}if(r.min<1320)r.flags.night=false}
function newEvent(r){let x=RANDOM[Math.floor(Math.random()*RANDOM.length)];r.event={title:x[0],text:x[1],area:x[2],day:r.day,used:false};r.stats.events++}
function pub(r){return{code:r.code,day:r.day,time:hour(r),chapter:r.chapter,objective:r.objective,night:!!r.flags.night,event:r.event,scene:r.scene,players:[...r.players.values()].map(p=>({id:p.id,name:p.name,role:p.role,loc:p.loc,energy:p.energy,hunger:p.hunger,warmth:p.warmth,actions:p.actions,money:p.money,items:p.items,clues:p.clues,shared:p.shared,rel:p.rel,completed:p.completed,minigame:p.minigame||null})),side:r.side,stats:r.stats,log:r.log.slice(-70),flags:r.flags,world:r.world,choices:r.choices,achievements:r.achievements,mansionState:r.mansionState,mansionClock:r.mansionState?`${String(r.mansionState.time||8).padStart(2,"0")}:00`:null,mansionEvent:(r.mansionState?.activeEvent?(MANSION_EVENTS[r.mansionState.activeEvent]?{...MANSION_EVENTS[r.mansionState.activeEvent],id:r.mansionState.activeEvent}:null):null),currentSpace:r.currentSpace||null,spaceStates:r.spaceStates||{},life:r.life||null}}
function maybeMain(r){let current=MAIN[r.progress];if(!current)return;if(r.score>=current.need&&r.progress<MAIN.length){r.objective=current.goal;if(r.chapter<current.ch)r.chapter=current.ch;}}
function clue(r,p,text,area,kind="clue"){p.clues.push({text,area,day:r.day,kind});r.score++;r.stats.discoveries++;maybeMain(r)}
function randomLine(p,loc,spot){const m={
"estate:온실":"온실의 식물이 오늘은 유난히 싱싱하다.","estate:서재":"도시 지도를 펼치니 새로운 골목 하나가 눈에 들어온다.","estate:현관":"현관에 물기가 남아 있다. 누군가 방금 돌아온 모양이다.",
"market:파이 가게":"갓 구운 파이 냄새가 골목까지 퍼진다.","market:골동품상":"상인이 오래된 생활용품을 정리하고 있다.","market:수로 계단":"사람들이 계단을 오르내리며 수로를 건넌다.",
"pier:계류 밧줄":"배 한 척이 새로 묶여 있다.","pier:발자국":"젖은 발자국이 선착장 끝까지 이어진다.","pier:수면":"잔물결 사이로 작은 물고기가 지나간다.",
"canal:우체통":"오늘 배달할 우편물이 몇 통 들어 있다.","canal:유리창":"수중 생활권의 불빛이 유리 너머로 보인다.","canal:잠긴 문":"문은 잠겨 있지만 관리용 표지가 붙어 있다.",
"archive:열람실":"도시의 오래된 생활 기록이 정리되어 있다.","archive:금고":"보관 물품 목록이 가지런히 적혀 있다.","archive:금지서고":"오래된 지도와 생활 문서가 쌓여 있다.",
"station:승강장":"오늘도 승강장에는 오래된 안내판이 서 있다.","station:역무실":"역무원이 시간을 확인하고 있다.","station:조금 느리게 가는 오래된 시계":"시계가 조금 늦지만 아직 작동한다.",
"district:빈 집":"사람이 드나든 흔적이 남아 있다.","district:세탁소":"세탁소 주인이 젖은 옷을 정리한다.","district:옥상":"옥상에서 수면 위와 아래의 생활권이 한눈에 보인다.",
"hospital:접수실":"오늘도 수중 생활권의 주민들이 오간다.","hospital:수중 병실":"병실 창문 너머로 물고기 떼가 지나간다.","hospital:기록실":"환자와 시설 기록이 날짜순으로 정리되어 있다.",
"theater:매표소":"다음 상영을 준비하는 안내지가 붙어 있다.","theater:무대":"무대 위 장식이 조금 기울어 있다.","theater:영사실":"관리인이 영사기를 점검하고 있다.",
"deep:잠수엘리베이터":"수중 통로로 내려가는 오래된 승강기가 있다.","deep:수문":"수문 관리 장치가 작동 중이다.","deep:검은 계단":"계단 아래에서 물 흐르는 소리가 난다."};return m[`${loc}:${spot}`]||`${spot} 주변을 살펴보았다.`}
function sideAdvance(r,p){for(const q of SIDE){let st=r.side[q.id];if(st.done||p.loc!==q.area)continue;if(st.step<q.steps&&p.actions>0){st.step++;p.actions--;advance(r);let t=q.text[st.step-1];clue(r,p,`${q.title} · ${t}`,q.area,"side");log(r,`${q.title} ${st.step}/${q.steps} · ${t}`,"quest");if(st.step===q.steps){st.done=true;r.stats.quests++;p.money+=15;log(r,`${q.title} 사건이 해결되었다. 보상 15c.`,"reward")}}}}

function canEnter(r,to){
  if(r.world.opened[to]) return true;
  if(to==="archive") return r.score>=8;
  if(to==="station") return r.score>=14 || r.world.stationPower>=1;
  if(to==="hospital") return r.score>=22 || r.world.hospitalTrust>=2;
  if(to==="theater") return r.score>=32 || r.world.theaterPower>=1;
  if(to==="deep") return r.world.doorProgress>=2 || (r.players.size>=2 && r.score>=40);
  if(to==="oldtown") return r.score>=10;
  if(to==="greenhouse") return r.world.waterLevel<=1 || r.score>=24;
  if(to==="observatory") return r.score>=18 || r.world.stationPower>=1;
  if(to==="archive2") return r.score>=28 && r.world.doorProgress>=1;
  return false;
}
function achievement(r,id,label){if(!r.achievements.includes(id)){r.achievements.push(id);log(r,`ACHIEVEMENT · ${label}`,"achievement")}}
function choiceWorld(r,id,val){
  r.choices[id]=val;r.world.history.push({day:r.day,id,val});
  if(id==="market_fire") r.world.marketTrust += val==="help"?2:val==="ignore"?-1:0;
  if(id==="station_clock") r.world.stationPower += val==="repair"?2:val==="break"?-1:0;
  if(id==="hospital_patient") r.world.hospitalTrust += val==="believe"?2:val==="report"?1:-1;
  if(id==="theater_film") r.world.theaterPower += val==="watch"?2:val==="burn"?-2:0;
  if(id==="water_gate") r.world.doorProgress += val==="turn"?1:val==="wait"?0:0;
  if(r.world.marketTrust>=2) r.world.opened.district=true;
  if(r.world.stationPower>=2) r.world.opened.station=true;
  if(r.world.hospitalTrust>=2) r.world.opened.hospital=true;
  if(r.world.theaterPower>=2) r.world.opened.theater=true;
  if(r.world.doorProgress>=2) r.world.opened.deep=true;
}
function combine(r,p){
  const all=r.players.size?Array.from(r.players.values()).flatMap(x=>x.clues):p.clues;
  const texts=all.map(x=>x.text);
  const has=(s)=>texts.some(t=>t.includes(s));
  if(has("생활번호")&&has("두 개의 손바닥")){r.world.doorProgress=Math.max(r.world.doorProgress,1);achievement(r,"combo생활번호","생활번호 + 손바닥 자국")}
  if(has("13분")&&has("없는 사람")){r.world.stationPower=Math.max(r.world.stationPower,1);achievement(r,"combo13","13분 + 없는 사람")}
  if(has("수중 병실")&&has("필름")){r.world.hospitalTrust=Math.max(r.world.hospitalTrust,1);achievement(r,"combo17","수중 병실 + 필름")}
  if(has("종소리")&&has("수문")){r.world.doorProgress=Math.max(r.world.doorProgress,1);achievement(r,"comboBell","종소리 + 수문")}
  if(r.world.doorProgress>=2) r.world.opened.deep=true;
}


const REGIONS_EXTRA={
 oldtown:{name:"구시가지",desc:"오래된 상점과 골목이 겹쳐진 생활권",spots:["시계 수리점","빈 극장표 가게","벽화 골목"],npcs:["MARA"]},
 greenhouse:{name:"유리온실",desc:"도시의 수위가 낮을 때만 입구가 드러나는 온실",spots:["말라붙은 연못","유리 천장","씨앗 보관함"],npcs:["LUNE"]},
 observatory:{name:"수문 관측소",desc:"도시 전체의 수위와 종소리를 기록하는 곳",spots:["수위계","낡은 망원경","기록실"],npcs:["ORIN"]},
 archive2:{name:"생활 기록 서고",desc:"오래된 생활 기록과 지도 사본이 쌓이는 서고",spots:["봉인 서랍","오래된 기록","열람대"],npcs:["VEIL"]}
};
function extendedMap(){
 A.oldtown={name:"구시가지",links:["market","district","greenhouse"],spots:REGIONS_EXTRA.oldtown.spots};
 A.greenhouse={name:"유리온실",links:["oldtown","observatory"],spots:REGIONS_EXTRA.greenhouse.spots};
 A.observatory={name:"수문 관측소",links:["greenhouse","station","archive2"],spots:REGIONS_EXTRA.observatory.spots};
 A.archive2={name:"생활 기록 서고",links:["observatory","archive"],spots:REGIONS_EXTRA.archive2.spots};
}
extendedMap();
const NPC_EXTRA={
 MARA:{name:"마라",area:"oldtown",mood:"까칠하지만 도시 생활에 익숙하다",lines:["어제와 오늘의 골목이 다르다는 걸 눈치챘어?","사라진 사람보다 오래된 기록을 잘 살펴봐야 해.","시계는 시간을 알려주는 게 아니라 틀린 시간을 숨기는 물건이야."],gift:"오래된 회중시계"},
 LUNE:{name:"룬",area:"greenhouse",mood:"조용하고 관찰력이 뛰어나다",lines:["식물은 물과 빛을 먹고 자라.","온실 바닥에 계절마다 자라는 식물이 달라.","씨앗 보관함을 열면 씨앗을 심으면 새로운 잎이 난다는 소문이 있어."],gift:"유리 씨앗"},
 ORIN:{name:"오린",area:"observatory",mood:"숫자와 기록을 믿는다",lines:["수위는 매일 정확히 오르내리지 않아.","13분의 오차는 기계 고장이 아니라 도시의 습관이야.","종이 세 번 울린 날엔 지도에서 한 구역이 사라졌어."],gift:"수위 기록표"},
 VEIL:{name:"베일",area:"archive2",mood:"말을 아끼며 정보를 교환한다",lines:["오래된 기록도 직접 확인하는 게 좋아.","생활 기록은 필요한 사람에게 공개할 수 있어.","찾는 물건이 있으면 목록부터 확인해 봐."],gift:"오래된 기록 조각"}
};
const SIDE_EXTRA=[
{id:"clockwork",title:"멈춘 시계",area:"oldtown",goal:"구시가지 시계 수리점에서 3개의 시계를 비교하라",reward:15},
{id:"glassseed",title:"유리 씨앗",area:"greenhouse",goal:"유리온실의 씨앗 보관함을 조사하라",reward:18},
{id:"waterchart",title:"수위의 거짓말",area:"observatory",goal:"수문 관측소의 기록과 현재 수위를 비교하라",reward:20},
{id:"ownerless",title:"오래된 생활 기록",area:"archive2",goal:"생활 기록 서고에서 소유자가 없는 기록을 찾아라",reward:25}
];
const DAILY_EXTRA=[
["초승달 우편","pier","누군가 수로 우편함에 이름 없는 편지를 넣었다."],
["시장 경매","market","상인이 오래된 열쇠 하나를 경매에 내놓았다."],
["빈 의자","district","어제까지 있던 의자가 사라지고 그 자리에 사진이 놓였다."],
["반복되는 방송","station","폐역 방송이 같은 문장을 13분 간격으로 반복한다."],
["젖은 필름","theater","극장 입구에 비에 젖은 필름 조각이 떨어져 있다."],
["온실의 발자국","greenhouse","아무도 들어갈 수 없었던 온실에 발자국이 생겼다."],
["시계가 늦은 날","oldtown","구시가지의 모든 시계가 서로 다른 시간을 가리킨다."],
["관측소 경보","observatory","수위 관측소에서 존재하지 않는 홍수 경보가 울린다."]
];


const CHOICE_TREE = {
  pier_letter:{title:"이름 없는 편지",text:"선착장 우편함 안에 젖은 편지가 있다.",choices:[
    {id:"read",text:"편지를 읽는다",effects:{flags:{letter_read:true},score:2},next:"pier_letter_read"},
    {id:"deliver",text:"주소를 찾아 배달한다",effects:{flags:{letter_delivered:true},money:4},next:null},
    {id:"keep",text:"편지를 보관한다",effects:{flags:{letter_kept:true},items:["젖은 편지"]},next:null}
  ]},
  pier_letter_read:{title:"편지 속 부탁",text:"편지는 수로 건너편 가게에 작은 물건을 전해 달라는 부탁이다.",choices:[
    {id:"accept",text:"부탁을 받아들인다",effects:{flags:{delivery_accept:true},score:3},next:"delivery_done"},
    {id:"decline",text:"정중히 거절한다",effects:{flags:{delivery_decline:true},score:1},next:null}
  ]},
  delivery_done:{title:"작은 심부름",text:"가게에 물건을 전달했다. 주인은 고맙다며 간식을 건넨다.",choices:[
    {id:"take",text:"간식을 받는다",effects:{items:["작은 간식"],score:2},next:null},
    {id:"decline",text:"사양한다",effects:{flags:{gift_declined:true},score:1},next:null}
  ]}
};

const SIDE_CHOICE_TREES = {
  greenhouse_seed:{title:"온실의 씨앗",text:"온실의 씨앗 보관함에서 새 씨앗을 발견했다.",choices:[
    {id:"plant",text:"온실에 심는다",effects:{flags:{seed_planted:true},score:4},next:null},
    {id:"save",text:"보관한다",effects:{items:["새 씨앗"],score:2},next:null},
    {id:"give",text:"아이들에게 보여준다",effects:{flags:{seed_shared:true},relationship:1},next:null}
  ]},
  observatory_water:{title:"수위 기록",text:"관측소 기록과 실제 수위가 조금 다르다.",choices:[
    {id:"correct",text:"기록을 바로잡는다",effects:{flags:{water_corrected:true},score:4},next:null},
    {id:"note",text:"차이를 메모한다",effects:{items:["수위 기록표"],score:2},next:null},
    {id:"leave",text:"そのまま 두고 나온다",effects:{flags:{water_left:true},score:1},next:null}
  ]},
  archive_ownerless:{title:"오래된 기록",text:"기록보관소의 봉인 서랍에서 낡은 생활 기록을 발견했다.",choices:[
    {id:"open",text:"기록을 읽는다",effects:{flags:{archive_opened:true},score:5},next:"archive_after"},
    {id:"report",text:"관리자에게 알린다",effects:{flags:{archive_reported:true},score:3},next:null},
    {id:"seal",text:"다시 봉인한다",effects:{flags:{archive_resealed:true},score:2},next:null}
  ]},
  archive_after:{title:"오래된 생활 기록",text:"기록에는 수몰 도시에서 살아가던 사람들의 평범한 하루가 남아 있다.",choices:[
    {id:"copy",text:"필요한 부분을 옮겨 적는다",effects:{items:["생활 기록 사본"],score:4},next:null},
    {id:"close",text:"책을 닫는다",effects:{flags:{archive_closed:true}},next:null}
  ]}
};

const CROSS_WORLD_TREES = {};

const MANSION_ROOMS = {
hall:{name:"현관 홀",floor:"1F",desc:"낡은 석조 현관. 도시에서 돌아오면 가장 먼저 지나게 되는 곳.",actions:["clean","inspect"]},
kitchen:{name:"주방",floor:"1F",desc:"큰 조리대와 오래된 저장고가 있다.",actions:["cook","clean","repair"]},
dining:{name:"식당",floor:"1F",desc:"긴 식탁이 놓인 방. 창밖으로 수면 위 도시가 보인다.",actions:["eat","talk"]},
living:{name:"거실",floor:"1F",desc:"가족이 가장 오래 머무는 공간.",actions:["talk","rest","clean"]},
laundry:{name:"세탁실",floor:"1F",desc:"빗물과 지하수를 이용하는 오래된 세탁 설비.",actions:["wash","repair"]},
storage:{name:"창고",floor:"1F",desc:"도시에서 가져온 물건과 생활 자원을 보관한다.",actions:["sort","inspect"]},
greenhouse:{name:"온실",floor:"1F",desc:"깨진 유리 사이로 물가 식물이 자라는 온실.",actions:["plant","water","inspect"]},
dock:{name:"실내 선착장",floor:"1F",desc:"저택 뒤쪽 수로와 직접 연결된 작은 선착장.",actions:["prepare_trip","fish"]},
kids_a:{name:"아이 A의 방",floor:"2F",desc:"아이가 모아온 작은 물건들로 가득하다.",actions:["talk","clean","inspect"]},
kids_b:{name:"아이 B의 방",floor:"2F",desc:"책과 지도, 오래된 장난감이 놓여 있다.",actions:["talk","clean","inspect"]},
study:{name:"공동 서재",floor:"2F",desc:"도시의 지도와 저택의 오래된 기록을 함께 보관한다.",actions:["read","sort","inspect"]},
bedroom:{name:"옛 주인 침실",floor:"2F",desc:"아직 사용하지 않는 방. 오래된 가구가 그대로 남아 있다.",actions:["inspect"]},
guest:{name:"손님방",floor:"2F",desc:"필요할 때 잠시 쉴 수 있는 방.",actions:["rest","clean"]},
attic:{name:"다락",floor:"3F",desc:"아직 정리되지 않은 상자와 가구가 쌓여 있다.",actions:["inspect","sort"]},
archive:{name:"옛 주인 서재",floor:"3F",desc:"도시와 저택에 관한 문서가 남아 있다.",actions:["read","inspect"]},
music:{name:"음악실",floor:"3F",desc:"물에 젖지 않은 악기들이 이상할 정도로 잘 보존되어 있다.",actions:["play","inspect"]},
boiler:{name:"보일러실",floor:"B1",desc:"난방과 온수의 핵심.",actions:["repair","fuel"]},
water:{name:"물 저장고",floor:"B1",desc:"수면 아래에서 들어오는 물을 저장하고 정화한다.",actions:["purify","inspect"]},
workshop:{name:"수리실",floor:"B1",desc:"도시에서 가져온 부품을 수리할 수 있는 작업장.",actions:["repair","craft"]},
basement:{name:"지하 저장고",floor:"B2",desc:"절반이 물에 잠겨 있다. 방수 구조 덕분에 내부는 놀라울 정도로 보존되어 있다.",actions:["inspect","dive"]},
underwater:{name:"수중 복도",floor:"B2",desc:"저택 아래를 가로지르는 오래된 복도.",actions:["dive","inspect"]},
garden_b:{name:"지하 정원",floor:"B2",desc:"수면 아래에서도 살아가는 식물이 자라는 공간.",actions:["plant","inspect"]}
};
const MANSION_ACTIONS = {
clean:{label:"청소하기",effects:{home_clean:2,time:1,energy:-1,hunger:-1},text:"먼지를 걷어냈다."},
cook:{label:"요리하기",effects:{food:2,time:1,energy:-1,hunger:2},text:"간단한 식사를 준비했다."},
eat:{label:"함께 식사하기",effects:{hunger:2,relationship:1,time:1,energy:-1,food:-1},text:"식탁에 둘러앉아 식사를 했다."},
talk:{label:"이야기하기",effects:{relationship:2,time:1,energy:-1},text:"별것 아닌 이야기를 오래 나눴다."},
rest:{label:"쉬기",effects:{energy:2,time:2,hunger:-1},text:"잠깐 몸을 쉬게 했다."},
repair:{label:"수리하기",effects:{house_condition:2,time:2,energy:-2,materials:-1},text:"망가진 곳을 손봤다."},
wash:{label:"빨래하기",effects:{home_clean:1,time:1,energy:-1,water:-1},text:"빨래를 널었다."},
sort:{label:"정리하기",effects:{home_clean:1,time:1,energy:-1},text:"물건들을 정리했다."},
inspect:{label:"둘러보기",effects:{discover:1,time:1,energy:-1},text:"공간을 천천히 살펴봤다."},
plant:{label:"식물 돌보기",effects:{home_clean:1,time:1,energy:-1,water:-1},text:"식물을 돌봤다."},
water:{label:"물 주기",effects:{home_clean:1,time:1,energy:-1,water:-1},text:"온실에 물을 줬다."},
prepare_trip:{label:"원정 준비",effects:{prepared:1,time:1,energy:-1},text:"가방과 동물용 장비를 점검했다."},
fish:{label:"낚시하기",effects:{food:2,time:2,energy:-2,hunger:-1},text:"수로에서 먹을 것을 건졌다."},
read:{label:"기록 읽기",effects:{knowledge:2,time:1,energy:-1},text:"오래된 기록을 읽었다."},
play:{label:"악기 연주하기",effects:{relationship:1,energy:1,time:1},text:"낡은 악기의 음을 맞춰 보았다."},
fuel:{label:"연료 보충",effects:{fuel:2,time:1,energy:-1},text:"보일러에 연료를 넣었다."},
purify:{label:"물 정화",effects:{water:3,time:1,energy:-1},text:"저장된 물을 정화했다."},
craft:{label:"부품 만들기",effects:{materials:-1,parts:1,time:2,energy:-2},text:"남은 재료로 부품을 만들었다."},
dive:{label:"잠수해서 조사",effects:{knowledge:2,time:2,energy:-2,water:-1},text:"물속 복도를 조사했다."}
};

const MANSION_EVENT_COUNT = 8;
const MANSION_EVENTS = {
  kitchen_morning:{room:"kitchen",title:"아침의 부엌",text:"창문에 물방울이 잔뜩 맺혀 있다. 아이 A가 창밖을 보다가 작은 배 한 척을 가리킨다.",choices:[
    {id:"look",text:"같이 창밖을 본다",effects:{relationship:1,knowledge:1}},
    {id:"cook",text:"아침부터 배부터 챙긴다",effects:{food:1,relationship:1,energy:-1}},
    {id:"ask",text:"무슨 배인지 물어본다",effects:{knowledge:2,flags:{boat_watch:true}}}
  ]},
  pantry_mystery:{room:"kitchen",title:"식료품장 안의 봉투",text:"식료품장 뒤에서 방수 봉투가 하나 떨어진다. 안에는 오래된 열쇠와 짧은 메모가 있다.",choices:[
    {id:"open",text:"봉투를 열어 확인한다",effects:{knowledge:2,materials:1,flags:{old_room:true}}},
    {id:"save",text:"봉투째 보관한다",effects:{materials:1,flags:{sealed_note:true}}},
    {id:"ignore",text:"지금은 다시 넣어 둔다",effects:{energy:1}}
  ]},
  greenhouse_glow:{room:"greenhouse",title:"온실의 이상한 빛",text:"물가 식물 사이에서 작은 초록빛이 깜빡인다. 가까이 가면 빛이 잠깐 멈춘다.",choices:[
    {id:"touch",text:"빛을 손으로 건드린다",effects:{knowledge:2,water:-1,flags:{greenhouse_glow:true}}},
    {id:"observe",text:"건드리지 않고 기록한다",effects:{knowledge:1,relationship:1}},
    {id:"water",text:"식물부터 돌본다",effects:{home_clean:1,water:-1}}
  ]},
  dock_guest:{room:"dock",title:"선착장의 낯선 배",text:"아무 표시도 없는 작은 배가 선착장에 묶여 있다. 배 안에는 젖은 상자 하나가 있다.",choices:[
    {id:"search",text:"상자를 조사한다",effects:{knowledge:2,materials:2,flags:{dock_box:true}}},
    {id:"wait",text:"주인을 기다린다",effects:{relationship:1,flags:{harbor_visit:true}}},
    {id:"leave",text:"괜히 건드리지 않는다",effects:{energy:1}}
  ]},
  kids_map:{room:"kids_b",title:"아이들의 비밀 지도",text:"아이들이 지도에 빨간 점 하나를 새로 찍어 놓았다. 평소에는 없던 지점이다.",choices:[
    {id:"follow",text:"표시를 따라가자고 한다",effects:{knowledge:2,relationship:1,prepared:1,flags:{child_map:true}}},
    {id:"ask",text:"왜 찍었는지 물어본다",effects:{relationship:2}},
    {id:"erase",text:"위험할 수 있으니 지운다",effects:{house_condition:1,relationship:-1}}
  ]},
  study_letter:{room:"study",title:"책 사이의 젖은 편지",text:"도시 지도를 펼치자 사이에서 젖은 편지가 미끄러져 나온다. 수신인은 적혀 있지 않다.",choices:[
    {id:"read",text:"편지를 읽는다",effects:{knowledge:3,flags:{mystery_letter:true}}},
    {id:"dry",text:"말려서 보관한다",effects:{knowledge:1,materials:1,flags:{kept_letter:true}}},
    {id:"close",text:"원래대로 돌려놓는다",effects:{energy:1}}
  ]},
  archive_echo:{room:"archive",title:"기록보관소의 빈 줄",text:"오래된 장부 한 페이지에 이상하게 비어 있는 한 줄이 있다. 누군가 일부러 지운 것처럼 보인다.",choices:[
    {id:"trace",text:"지워진 흔적을 추적한다",effects:{knowledge:3,flags:{archive_trace:true}}},
    {id:"copy",text:"현재 상태를 그대로 베껴 둔다",effects:{knowledge:1,materials:1}},
    {id:"close",text:"아직은 손대지 않는다",effects:{energy:1}}
  ]},
  underwater_signal:{room:"underwater",title:"수중 복도의 신호",text:"어두운 복도 끝에서 세 번의 빛이 반복된다. 누군가 신호를 보내는 것 같다.",choices:[
    {id:"answer",text:"손전등으로 신호를 돌려준다",effects:{knowledge:4,water:-1,flags:{underwater_signal:true}}},
    {id:"wait",text:"조용히 지켜본다",effects:{knowledge:2}},
    {id:"retreat",text:"오늘은 돌아간다",effects:{energy:1}}
  ]}
};

function wlPlaceKey(location){
  const x=String(location||"").toLowerCase();
  for(const [k,vals] of Object.entries(WL_PLACE_KEYS)){
    if(vals.some(v=>x.includes(String(v).toLowerCase()))) return k;
  }
  return ["market","canal","mansion","harbor"][Math.abs(hashCode(x))%4];
}
function hashCode(x){
  let h=2166136261;
  for(let i=0;i<x.length;i++) h=Math.imul(h^x.charCodeAt(i),16777619);
  return h|0;
}
function wlPick(arr,seed){
  return arr[Math.abs(hashCode(String(seed)))%arr.length];
}
function wlRecentEventKeys(r){
  return new Set((r.dailyEvents||[]).slice(-20).map(e=>String(e.key||"")));
}
function generateProceduralDailyEvent(r,p){
  const day=Math.max(1,Number(r.day||1));
  const location=p?.location||r.currentLocation||"저택";
  const place=wlPlaceKey(location);
  const pool=WL_EVENT_POOLS[place]||WL_EVENT_POOLS.mansion;
  const recent=wlRecentEventKeys(r);
  let idx=Math.abs(hashCode(`${day}:${place}:${JSON.stringify(r.worldFlags||{})}`))%pool.length;
  let item=pool[idx];
  for(let i=0;i<pool.length && recent.has(`${place}:${idx}`);i++){
    idx=(idx+1)%pool.length; item=pool[idx];
  }
  const f=r.worldFlags||{};
  const echoes=[];
  if(f.market_help) echoes.push("전에 도움을 받은 사람이 당신을 알아본다.");
  if(f.child_talk) echoes.push("아이들이 전에 나눈 이야기를 기억하고 있다.");
  if(f.old_room) echoes.push("저택에서 전에 살펴본 곳과 연결되는 흔적이 보인다.");
  if(f.harbor_visit) echoes.push("지난번 선착장에서 보았던 흔적이 다시 눈에 들어온다.");

  const choices = place==="mansion"
    ? ["살펴본다","아이에게 묻는다","오늘은 지나친다"]
    : ["가까이 가본다","누군가에게 묻는다","지나친다"];

  return {
    day, place, key:`${place}:${idx}`,
    title:item[0], text:item[1],
    choices, echoes,
    source:"procedural"
  };
}
function buildDailyWorldState(r,p){
  const day=Number(r.day||1), f=r.worldFlags||{};
  const visitCount=Object.values(r.locationVisits||{}).reduce((a,b)=>a+Number(b||0),0);
  const relation=Number(p.relation||0);
  const discoveries=Number(p.knowledge||0);
  const phase=day%7;
  const recurring=[
    "운하의 수위가 조금 달라졌다.",
    "도시의 상인들이 평소보다 일찍 문을 열었다.",
    "저택 주변으로 작은 배들이 지나간다.",
    "수로 아래쪽에서 새로운 이동 경로가 열려 있다.",
    "아이들이 오늘은 평소보다 바쁘게 움직인다.",
    "선착장에 낯선 화물이 들어왔다.",
    "시장에 새로운 물건이 진열되었다."
  ][phase];
  const echoes=[];
  if(f.market_help) echoes.push("지난번에 도운 상인이 당신을 알아본다.");
  if(f.child_talk) echoes.push("아이들이 전에 나눈 이야기를 기억하고 있다.");
  if(f.old_room) echoes.push("저택에서 전에 살펴본 곳과 연결되는 흔적이 보인다.");
  if(f.harbor_visit) echoes.push("선착장에서 지난 방문의 흔적을 발견한다.");
  return {
    day, phase, recurring, echoes,
    stats:{relation,discoveries,visitCount},
    flags:f
  };
}
function advanceWaterlineDay(r){
  r.dayHistory ||= [];
  r.day = Number.isFinite(Number(r.day)) ? Number(r.day) + 1 : 2;
  r.dayLog = {};
  r.dayStartedAt = Date.now();
  for(const p of (r.players||[])){
    p.dailyActions = 0;
    p.dailyRest = 0;
  }
}
function rememberAction(r,p,key,value=true){
  r.worldFlags ||= {};
  r.worldFlags[key]=value;
  p.dailyActions=(p.dailyActions||0)+1;
}
function daySummary(r,p){
  const flags=r.worldFlags||{};
  const labels=[];
  if(flags.market_help) labels.push("운하시장에서 상인을 도왔다");
  if(flags.market_observe) labels.push("운하시장의 이상한 흔적을 살폈다");
  if(flags.child_talk) labels.push("아이와 이야기를 나눴다");
  if(flags.old_room) labels.push("저택의 오래된 방을 조사했다");
  if(flags.harbor_visit) labels.push("선착장을 둘러보았다");
  if(!labels.length) labels.push("특별한 사건 없이 하루를 보냈다");
  return labels;
}
io.on("connection",s=>{
// 재접속은 클라이언트의 resume 한 번으로만 처리한다. create/join과 자동 resume이
// 동시에 실행되어 새 게임을 옛 세션이 덮어쓰는 레이스를 방지한다.

s.on("create",({name},cb)=>{
  // 명시적으로 새 게임을 만든 요청이므로 기존 소켓 세션과 분리한다.
  const oldRoom=getRoom(s); if(oldRoom){const oldPlayer=oldRoom.players.get(s.id); if(oldPlayer) oldPlayer.disconnectedAt=Date.now();}
  let code; do code=Math.random().toString(36).slice(2,8).toUpperCase(); while(rooms.has(code));
  const r=mk(code),p=player(s.id,name,"A");
  r.players.set(s.id,p);rooms.set(code,r);bindSession(r,p);s.join(code);s.data.code=code;s.data.name=p.name;
  s.data.sessionToken=p.sessionToken;newEvent(r);log(r,"DAY 1 · 08:30 — 평범한 하루가 시작되었다.","chapter");
  cb({ok:true,code,sessionToken:p.sessionToken});scheduleSave();io.to(code).emit("state",pub(r));
});
s.on("join",({name,code},cb)=>{
  const normalized=String(code||"").trim().toUpperCase(),r=rooms.get(normalized);
  if(!r)return cb({ok:false,error:"게임방을 찾을 수 없다. 방장이 먼저 새 도시를 시작했는지 확인해 주세요."});
  if(r.players.size>=2)return cb({ok:false,error:"2인방은 가득 찼다."});
  const p=player(s.id,name,"B");r.players.set(s.id,p);bindSession(r,p);s.join(r.code);s.data.code=r.code;s.data.name=p.name;s.data.sessionToken=p.sessionToken;
  log(r,`${name||"동료"}가 도시에 합류했다.` ,"system");cb({ok:true,code:r.code,sessionToken:p.sessionToken});scheduleSave();io.to(r.code).emit("state",pub(r));
});
s.on("resume",({code,name,sessionToken},cb)=>{
  const r=resumeIntoRoom(s,code,name,sessionToken);
  if(!r)return cb?.({ok:false,error:"이 게임방은 현재 서버에 없습니다. 새 도시를 시작하거나 방장의 새 초대 코드를 입력해 주세요."});
  cb?.({ok:true,code:r.code,sessionToken:s.data.sessionToken});
  scheduleSave();io.to(r.code).emit("state",pub(r));
});

s.on("move",({to},cb)=>{
 let r=getRoom(s),p=me(r,s.id);
 if(!r||!p)return cb({ok:false,error:"게임 방을 찾을 수 없다."});
 if(!A[to])return cb({ok:false,error:"존재하지 않는 장소다."});
 if(to===p.loc)return cb({ok:true,text:"이미 이곳에 있다."});
 if(p.actions<1)return cb({ok:false,error:"행동력이 부족하다. 잠깐 쉬어도 된다."});
 const direct=(A[p.loc]?.links||[]).includes(to);
 const cost=direct?1:2;
 if(p.actions<cost)return cb({ok:false,error:cost===2?"먼 곳으로 가려면 행동력 2가 필요하다.":"행동력이 부족하다."});
 p.actions-=cost;
 p.loc=to;
 advance(r,cost===2?30:20);
 log(r,`${p.name} → ${A[to].n}`,"move");
 sideAdvance(r,p);
 scheduleSave();io.to(r.code).emit("state",pub(r));
 cb({ok:true,text:`${A[to].n}에 도착했다.`,cost});
});


s.on("inspect",({spot},cb)=>{
 let r=getRoom(s),p=me(r,s.id);
 if(!r||!p)return cb({ok:false,error:"게임 방을 찾을 수 없다."});
 const list=A[p.loc]?.spots||[]; const index=Number(spot);
 const spotName=list[index];
 if(!spotName)return cb({ok:false,error:"이 장소에는 그런 조사 지점이 없다."});
 if(p.actions<1)return cb({ok:false,error:"행동력이 부족하다. 잠깐 쉬거나 다른 행동을 해보자."});
 const key=`${p.loc}:${spotName}`;
 r.spotVisits[key]=(r.spotVisits[key]||0)+1;
 p.actions-=1; advance(r,20);
 const scene=sceneFor(p.loc,spotName,r,p);
 const visit=r.spotVisits[key];
 scene.loc=p.loc;scene.spot=spotName;scene.visit=visit;
 scene.choices=(scene.choices||[]).map(c=>({
   id:c.id,label:c.label,
   knowledge:c.knowledge||0,
   item:c.item||null,
   result:c.result||`${c.label}을 선택했다.`,
   money:c.money||0,
   clue:c.clue||null,
   flag:c.flag||null
 }));
 r.scene=scene;
 log(r,`${p.name}이(가) ${A[p.loc].n}의 ${spotName}을 조사했다. (${visit}회차)`,'scene');
 io.to(r.code).emit('state',pub(r));
 cb({ok:true,scene,text:`${scene.title} — ${scene.text}`});
});

s.on("sceneChoice",({choice},cb)=>{
 let r=getRoom(s),p=me(r,s.id);
 if(!r||!p)return cb({ok:false,error:"게임 방을 찾을 수 없다."});
 const sc=r.scene;
 if(!sc)return cb({ok:false,error:"먼저 조사할 곳을 선택해야 한다."});
 const c=(sc.choices||[]).find(x=>x.id===choice);
 if(!c)return cb({ok:false,error:"그 선택지는 지금 사용할 수 없다."});
 p.actions=Math.max(0,p.actions);
 if(c.money)p.money+=c.money;
 if(c.knowledge){r.mansionState=r.mansionState||{};r.mansionState.knowledge=(r.mansionState.knowledge||0)+c.knowledge;}
 if(c.item){p.items=p.items||[];if(!p.items.includes(c.item))p.items.push(c.item);}
 if(c.flag){p.flags=p.flags||{};p.flags[c.flag]=true;}
 if(c.clue)clue(r,p,c.clue,sc.loc,'discovery');
 else {r.score++;r.stats.discoveries++;maybeMain(r);}
 r.scene=null;
 advance(r,10);
 const result=c.result||`${c.label}을 선택했다.`;
 log(r,`${p.name}의 선택: ${result}`,'choice');
 io.to(r.code).emit('state',pub(r));
 cb({ok:true,text:result,item:c.item||null});
});

s.on("eventChoice",({choice},cb)=>{
 let r=getRoom(s),p=me(r,s.id);
 if(!r||!p)return cb({ok:false,error:"게임 방을 찾을 수 없다."});
 const e=r.event;
 if(!e)return cb({ok:false,error:"지금 진행 중인 사건이 없다."});
 if(e.used)return cb({ok:false,error:"오늘의 사건은 이미 지나갔다. 내일 새로운 사건이 생긴다."});
 if(e.area!==p.loc)return cb({ok:false,error:`이 사건은 ${A[e.area]?.n||e.area}에서 발생하고 있다.`});
 const results={
   investigate:`직접 살펴보니 ${e.title}의 상황을 자세히 알 수 있었다. 작은 단서를 챙겼다.`,
   help:`사람을 도왔다. 일이 조금 늦어졌지만 서로 고맙다는 말을 나눴다.`,
   ignore:`오늘은 지나쳤다. 내일 다시 같은 장소를 지나갈 수도 있다.`
 };
 const text=results[choice]||results.ignore;
 e.used=true;
 if(choice==='investigate'){p.money+=5;clue(r,p,`${e.title}: 직접 조사했다.`,e.area,'event');}
 else if(choice==='help'){p.money+=10;clue(r,p,`${e.title}: 도움을 주었다.`,e.area,'event');}
 else log(r,`${e.title}: 오늘은 지나쳤다.`,'event');
 p.actions=Math.max(0,p.actions-1);advance(r,15);
 log(r,`${e.title} · ${text}`,'event');
 io.to(r.code).emit('state',pub(r));
 cb({ok:true,text});
});

s.on("talk",({npc},cb)=>{
 let r=getRoom(s),p=me(r,s.id),n=NPC[npc];
 if(!r||!p||!n||n.area!==p.loc)return cb({ok:false,error:"지금 이곳에서 만날 수 없는 사람이다."});
 p.rel=p.rel||{};p.flags=p.flags||{};p.items=p.items||[];
 const step=p.rel[npc]||0;
 const lines={
 childA:["오늘 시장에 가면 작은 배들이 많이 들어온대.","오늘은 집에 있고 싶어. 같이 있어 줄래?","선착장에 가면 재미있는 동물이 있을지도 몰라.","도시에서 본 것 중 제일 재미있었던 걸 들려줘.","내일은 같이 시장에 가자.","이 집도 도시도 매일 조금씩 달라지는 것 같아."],
 childB:["서재에서 본 지도가 재미있었어. 수면 아래 길도 표시되어 있더라.","시장에 가면 오래된 물건을 볼 수 있대.","선착장 쪽에서 배가 지나가는 걸 보고 싶어.","네가 주워 온 물건 보여 줄래?","오늘 저녁엔 같이 정리하자.","내일은 내가 갈 곳을 정해 볼게."],
 pie:["오늘은 파이가 일찍 다 팔릴 것 같아.","수로 계단 쪽으로 배달을 하나 보내야 해.","시장 사람들은 서로 물건을 빌려 쓰기도 하지.","저택에 사는 아이들도 가끔 온다고 들었어.","다음에 오면 오늘 만든 걸 하나 남겨 둘게.","시장에서는 매일 새로운 얼굴을 만나게 돼."],
 antique:["방수된 물건은 오래 보관하기 좋아.","수몰 전 물건도 아직 생활 속에서 쓸 수 있어.","쓸모없는 물건도 누군가에게는 꼭 필요한 물건이지.","저택에는 오래된 물건이 많을 것 같군.","다음에는 집에서 쓰지 않는 걸 가져와도 좋아.","도시의 물건은 사람들의 생활을 따라 변해."],
 keeper:["이 역은 지금도 가끔 물품을 옮길 때 써.","수면 아래 길은 날씨에 따라 조금 달라져.","배와 사람의 이동 시간을 맞추는 게 내 일이야.","오래된 시설도 방수만 잘 되면 계속 쓸 수 있지.","다음에 오면 오늘 들어온 물품을 보여 줄게.","도시는 생각보다 많은 길로 연결되어 있어."],
 archivist:["기록관에는 거창한 사건보다 생활 기록이 더 많아.","누가 어디에서 무엇을 샀는지도 기록이 되지.","도시의 변화는 작은 기록에서 먼저 보여.","저택에 관한 오래된 생활 기록도 조금 남아 있어.","다음에는 지도 사본을 보여 줄게.","기록은 직접 본 사람의 말과 함께 봐야 해."],
 doctor:["수면 위와 아래를 오가는 사람은 몸을 잘 적응시켜야 해.","변이동물과 함께 사는 사람도 많지.","물가에서는 작은 상처도 바로 씻어 두는 게 좋아.","도시 생활에서 가장 중요한 건 무리하지 않는 거야.","필요하면 언제든 들러.","사람마다 물에 적응하는 방식이 달라."],
 actor:["오늘 저녁 공연은 작은 공연이야.","수중 극장은 소리가 아주 다르게 울려.","관객들이 배를 타고 오는 날도 있어.","오래된 극장도 사람들이 다시 쓰면 살아나지.","다음 공연은 아이들도 보기 좋아.","도시에는 일상 속 작은 공연이 많아."],
 washer:["이 동네는 빨래가 정말 많이 나와.","수면 아래 집들은 배수 관리를 자주 해야 해.","주민끼리 서로 일을 나눠 하는 편이야.","시장보다 이쪽이 조용해서 살기 좋아.","다음에 오면 새 세제를 보여 줄게.","도시의 생활은 결국 서로 돕는 일의 연속이지."]};
 const arr=lines[npc]||["오늘은 평범한 하루야.","도시에는 오늘도 사람들이 오가고 있어.","필요한 일이 있으면 말해."];
 const text=arr[Math.min(step,arr.length-1)]; p.rel[npc]=Math.min(step+1,n.max||8);p.money+=2;
 clue(r,p,`${n.n}: ${text}`,n.area,"talk");r.stats.talks=(r.stats.talks||0)+1;log(r,`${n.n}: ${text}`,"npc");
 scheduleSave();io.to(r.code).emit("state",pub(r));cb({ok:true,text});
});

s.on("extraTalk",({id},cb)=>{
 let r=getRoom(s),p=me(r,s.id),ex=NPC_EXTRA[id];
 if(!r||!p||!ex||ex.area!==p.loc)return cb({ok:false,error:"이 사람은 지금 여기 없다."});
 p.rel=p.rel||{};p.flags=p.flags||{};p.items=p.items||[];let step=p.rel[id]||0;let text=ex.lines[Math.min(step,ex.lines.length-1)];
 p.rel[id]=step+1;p.money+=2;clue(r,p,`${ex.name}: ${text}`,ex.area,"talk");log(r,`${ex.name}: ${text}`,"npc");
 scheduleSave();io.to(r.code).emit("state",pub(r));cb({ok:true,text});
});

function applyChoiceEffects(p,effects){
 effects=effects||{};p.flags=p.flags||{};p.items=p.items||[];p.rel=p.rel||{};
 if(effects.flags)Object.assign(p.flags,effects.flags);
 if(Array.isArray(effects.items))for(const it of effects.items)if(!p.items.includes(it))p.items.push(it);
 if(typeof effects.score==="number")p.score+=effects.score;
 if(typeof effects.money==="number")p.money+=effects.money;
 for(const [k,v] of Object.entries(effects)){if(k.endsWith("_trust"))p.rel[k.replace("_trust","")]=(p.rel[k.replace("_trust","")]||0)+v;}
}
function choiceAvailable(p,c){
 const req=c.require||{};if(req.flag && !p.flags?.[req.flag])return false;
 if(req.item && !(p.items||[]).includes(req.item))return false;
 if(typeof req.score==="number" && p.score<req.score)return false;
 return true;
}
function beginChoiceTree(r,p,id){
 const tree=CHOICE_TREE[id]||SIDE_CHOICE_TREES[id];if(!tree)return null;
 r.choiceState=r.choiceState||{current:null,history:[]};
 r.choiceState.current={id,tree};return tree;
}


s.on("worldConsequence",({kind},cb)=>{
 let r=getRoom(s),p=me(r,s.id);
 if(!r||!p)return cb({ok:false,error:"방을 찾을 수 없다."});
 let id=null;
 if(kind==="mara" && (p.flags?.clock_taken||p.flags?.clock_opened||p.flags?.letter_kept)) id="mara_confrontation";
 if(kind==="lune" && p.flags?.seed_planted) id="lune_seed";
 if(kind==="archive" && p.flags?.archive_opened) id="archive_consequence";
 if(!id)return cb({ok:false,error:"지금은 발생할 세계 변화가 없다."});
 const tree=CROSS_WORLD_TREES[id];
 beginChoiceTree(r,p,id);
 scheduleSave();io.to(r.code).emit("state",pub(r));
 cb({ok:true,tree});
});
s.on("triggerChoice",({kind},cb)=>{
 let r=getRoom(s),p=me(r,s.id);if(!r||!p)return cb({ok:false,error:"방을 찾을 수 없다."});
 const ids={pier:"pier_letter",oldtown:"oldtown_clock",greenhouse:"greenhouse_seed",observatory:"observatory_water",archive2:"archive_ownerless"};
 const id=ids[p.loc];if(!id)return cb({ok:false,error:"이 지역에는 아직 선택지가 없다."});
 const tree=beginChoiceTree(r,p,id);scheduleSave();io.to(r.code).emit("state",pub(r));cb({ok:true,tree});
});




s.on("lifeAction",({action},cb)=>{
 let r=getRoom(s);if(!r)return cb({ok:false,error:"방을 찾을 수 없다."});
 ensureLife(r);const a=LIFE_ACTIONS[action];if(!a)return cb({ok:false,error:"알 수 없는 행동이다."});
 const phase=lifePhase(r.life.minutes);
 if(action==="cook" && (phase==="night"))return cb({ok:false,error:"밤이라 부엌 불을 켜기 어렵다."});
 if(action==="garden" && phase==="night")return cb({ok:false,error:"온실은 너무 어둡다."});
 if(r.life.energy+a.energy<=0)return cb({ok:false,error:"너무 지쳤다. 잠깐 쉬어야 한다."});
 r.life.minutes+=a.time;r.life.energy=Math.max(0,Math.min(100,r.life.energy+a.energy));
 r.life.hunger=Math.max(0,Math.min(100,r.life.hunger+a.hunger||0));
 r.life.house=Math.max(0,Math.min(100,r.life.house+a.house||0));
 r.life.animal=Math.max(0,Math.min(100,r.life.animal+a.animal||0));
 r.life.relation=Math.max(0,Math.min(100,r.life.relation+a.relation||0));
 r.life.flags[a.flag]=true;
 if(r.life.minutes>=1440){r.life.minutes-=1440;r.life.day++;r.life.hunger=Math.max(0,r.life.hunger-15);r.life.energy=85;}
 log(r,`${a.text}`,"life");
 scheduleSave();io.to(r.code).emit("state",pub(r));cb({ok:true,text:a.text});
});
s.on("spaceEnter",({space},cb)=>{let r=getRoom(s);if(!r||!SPACE_STATES[space])return cb({ok:false,error:"공간을 찾을 수 없다."});r.spaceStates=r.spaceStates||{};r.spaceStates[space]=r.spaceStates[space]||{stage:"quiet",seen:0};r.spaceStates[space].seen++;r.currentSpace=space;scheduleSave();io.to(r.code).emit("state",pub(r));cb({ok:true});});
s.on("spaceAction",({space,action},cb)=>{let r=getRoom(s),ss=r?.spaceStates?.[space],sp=SPACE_STATES[space],ac=SPACE_ACTIONS[action];if(!r||!ss||!sp||!ac)return cb({ok:false,error:"행동할 수 없다."});let stage=sp.stages[ss.stage];if(!stage.actions.includes(action))return cb({ok:false,error:"지금은 그 행동을 할 수 없다."});ss.stage=ac[0];r.flags=r.flags||{};r.flags[ac[3]]=true;r.mansionState=r.mansionState||{};r.mansionState.knowledge=(r.mansionState.knowledge||0)+ac[2];log(r,sp.label+": "+ac[1],"space");scheduleSave();io.to(r.code).emit("state",pub(r));cb({ok:true,text:ac[1]});});
s.on("mansionEvent",({eventId},cb)=>{
 let r=getRoom(s);if(!r)return cb({ok:false,error:"방을 찾을 수 없다."});
 const ev=MANSION_EVENTS[eventId];if(!ev)return cb({ok:false,error:"존재하지 않는 사건이다."});
 const ms=r.mansionState||{};
 if(ms.room!==ev.room)return cb({ok:false,error:"지금은 이 사건이 발생할 장소에 있지 않다."});
 ms.activeEvent=eventId;r.mansionState=ms;scheduleSave();io.to(r.code).emit("state",pub(r));cb({ok:true,event:ev});
});
s.on("mansionEventChoice",({eventId,choiceId},cb)=>{
 let r=getRoom(s);if(!r)return cb({ok:false,error:"방을 찾을 수 없다."});
 const ev=MANSION_EVENTS[eventId];const ch=ev?.choices?.find(x=>x.id===choiceId);
 if(!ch)return cb({ok:false,error:"존재하지 않는 선택이다."});
 const ms=r.mansionState||{};
 if(ms.activeEvent!==eventId)return cb({ok:false,error:"진행 중인 사건이 아니다."});
 for(const [k,v] of Object.entries(ch.effects||{})){
   if(k==="flags"){ms.flags=ms.flags||{};Object.assign(ms.flags,v);}
   else if(k==="unlock") { ms.unlocks=ms.unlocks||[]; for(const room of [].concat(v)) if(!ms.unlocks.includes(room)) ms.unlocks.push(room); }
   else ms[k]=(ms[k]||0)+v;
 }
 ms.home_clean=Math.max(0,Math.min(10,ms.home_clean||0));
 ms.house_condition=Math.max(0,Math.min(10,ms.house_condition||0));
 ms.water=Math.max(0,Math.min(10,ms.water||0));
 ms.food=Math.max(0,Math.min(10,ms.food||0));
 ms.fuel=Math.max(0,Math.min(10,ms.fuel||0));
 ms.energy=Math.max(0,Math.min(6,ms.energy||0));
 ms.hunger=Math.max(0,Math.min(6,ms.hunger||0));
 if(ms.knowledge>=5&&!ms.unlocks.includes("archive"))ms.unlocks.push("archive");
 if(ms.parts>=2&&!ms.unlocks.includes("music"))ms.unlocks.push("music");
 if(ms.house_condition>=10&&!ms.unlocks.includes("basement"))ms.unlocks.push("basement");
 if(ms.knowledge>=10&&!ms.unlocks.includes("underwater"))ms.unlocks.push("underwater");
 ms.activeEvent=null;ms.eventCount=(ms.eventCount||0)+1;r.mansionState=ms;
 log(r,`${ev.title}: ${ch.text}`,"mansion-event");
 scheduleSave();io.to(r.code).emit("state",pub(r));cb({ok:true});
});
s.on("mansionMove",({room},cb)=>{
 let r=getRoom(s);if(!r)return cb({ok:false,error:"방을 찾을 수 없다."});
 if(!MANSION_ROOMS[room])return cb({ok:false,error:"존재하지 않는 방이다."});
 r.mansionState=r.mansionState||{room:"hall",day:1,time:8,unlocks:[]};
 if(!r.mansionState.unlocks)r.mansionState.unlocks=[];
 const locked=["bedroom","attic","archive","music","basement","underwater","garden_b"];
 if(locked.includes(room)&&!r.mansionState.unlocks.includes(room))return cb({ok:false,error:"아직 들어갈 수 없는 곳이다."});
 r.mansionState.room=room;scheduleSave();io.to(r.code).emit("state",pub(r));cb({ok:true});
});

const ROOM_OBJECTS={
 hall:["젖은 우산","우편함","현관 거울"], kitchen:["오래된 냄비","식료품장","벽의 메모"], dining:["긴 식탁","빈 의자","창가"], living:["벽시계","낡은 소파","수조"], laundry:["세탁통","빨랫줄","배수구"], storage:["목상자","공구함","방수 가방"], greenhouse:["유리 화분","물가 식물","금 간 창"], dock:["계류 밧줄","낡은 보트","수면 아래 사다리"], kids_a:["작은 상자","그림","창문"], kids_b:["지도 묶음","장난감 배","서랍"], study:["도시 지도","장부","책상 서랍"], bedroom:["침대 옆 탁자","초상화","잠긴 서랍"], guest:["침대","여행 가방","창문"], attic:["먼지 쌓인 상자","오래된 깃발","작은 문"], archive:["장부 선반","봉인 문서","지도 서랍"], music:["피아노","악보","축음기"], boiler:["보일러 게이지","밸브","연료통"], water:["수위계","정화 필터","수조"], workshop:["작업대","부품 상자","손전등"], basement:["잠긴 상자","침수 계단","벽의 금속판"], underwater:["수중 창","녹슨 표지판","검은 문"], garden_b:["빛나는 수초","돌 연못","뿌리 사이의 틈"]
};
s.on("mansionInspect",({index},cb)=>{
 let r=getRoom(s),p=me(r,s.id); if(!r||!p)return cb({ok:false,error:"방을 찾을 수 없다."});
 const room=r.mansionState?.room||"hall", list=ROOM_OBJECTS[room]||[]; const obj=list[Number(index)];
 if(!obj)return cb({ok:false,error:"조사할 물건을 찾을 수 없다."});
 const key=`home:${room}:${obj}`;r.spotVisits[key]=(r.spotVisits[key]||0)+1;advance(r,10);
 const repeat=r.spotVisits[key]; const texts={
  "젖은 우산":"아직 물기가 남아 있다. 누군가 방금 도시에서 돌아온 것 같다.","우편함":"오늘은 편지가 없다. 대신 바닥에 작은 물방울이 세 개 있다.","현관 거울":"거울에 비친 현관이 깨끗하게 정리되어 있다.",
  "오래된 냄비":"바닥에 오래된 수로 지도가 희미하게 새겨져 있다.","식료품장":"남은 식량을 세어 보니 예상보다 하나 많다.","벽의 메모":"오늘 할 일이 적힌 생활 메모가 붙어 있다.",
  "긴 식탁":"식탁 위에 두 사람이 먹을 만큼의 그릇이 놓여 있다.","빈 의자":"누군가 앉았다 일어난 듯 물기가 남아 있다.","창가":"수면 위를 지나가는 작은 배가 오늘은 반대 방향으로 간다.",
  "벽시계":"초침이 잠깐 멈췄다가 두 칸 앞으로 뛰었다.","낡은 소파":"쿠션 아래에서 오래된 동전 하나가 나온다.","수조":"변이동물이 수면 아래 무언가를 바라보고 있다.",
  "세탁통":"주머니에서 작은 열쇠가 하나 나온다.","빨랫줄":"마른 옷 사이에 젖은 소매 하나가 섞여 있다.","배수구":"배수구에서 물이 천천히 빠지고 있다.",
  "목상자":"방수된 상자 안에 오래된 생활용품이 남아 있다.","공구함":"쓸 수 있는 부품 하나를 찾았다.","방수 가방":"가방 안쪽에 아직 마르지 않은 흙이 묻어 있다."
 };
 const text=texts[obj]||`${obj}을 자세히 살펴봤다. ${repeat>1?"전에 보았던 흔적과 조금 달라져 있다.":"아직 처음 보는 흔적이 남아 있다."}`;
 if(p.money!==undefined&&obj==="낡은 소파"&&repeat===1)p.money+=2;
 log(r,`${p.name}이(가) 저택의 ${obj}을 조사했다.`,'scene');
 io.to(r.code).emit('state',pub(r)); cb({ok:true,text,item:repeat===1&&obj==="낡은 소파"?"오래된 동전":null});
});
s.on("mansionAction",({action},cb)=>{
 let r=getRoom(s);if(!r)return cb({ok:false,error:"방을 찾을 수 없다."});
 const ms=r.mansionState||{};const act=MANSION_ACTIONS[action];if(!act)return cb({ok:false,error:"존재하지 않는 행동이다."});
 if(ms.activeEvent)return cb({ok:false,error:"진행 중인 작은 사건부터 해결해 보자."});
 const e=act.effects||{};
 if((ms.energy||0)+Number(e.energy||0)<0)return cb({ok:false,error:"기운이 다 떨어졌다. 쉬면서 회복하자."});
 if((ms.food||0)+Number(e.food||0)<0)return cb({ok:false,error:"식량이 부족하다."});
 if((ms.water||0)+Number(e.water||0)<0)return cb({ok:false,error:"물이 부족하다."});
 if((ms.materials||0)+Number(e.materials||0)<0)return cb({ok:false,error:"재료가 부족하다."});
 for(const [k,v] of Object.entries(e)){ if(k!=="time") ms[k]=(ms[k]||0)+v; }
 ms.home_clean=Math.max(0,Math.min(10,ms.home_clean||0));ms.house_condition=Math.max(0,Math.min(10,ms.house_condition||0));
 ms.water=Math.max(0,Math.min(10,ms.water||0));ms.food=Math.max(0,Math.min(10,ms.food||0));ms.fuel=Math.max(0,Math.min(10,ms.fuel||0));
 ms.energy=Math.max(0,Math.min(6,ms.energy||0));ms.hunger=Math.max(0,Math.min(6,ms.hunger||0));ms.materials=Math.max(0,ms.materials||0);
 ms.unlocks=ms.unlocks||[];
 if(ms.house_condition>=8&&!ms.unlocks.includes("bedroom"))ms.unlocks.push("bedroom","attic");
 if(ms.knowledge>=5&&!ms.unlocks.includes("archive"))ms.unlocks.push("archive");
 if(ms.parts>=2&&!ms.unlocks.includes("music"))ms.unlocks.push("music");
 if(ms.house_condition>=10&&!ms.unlocks.includes("basement"))ms.unlocks.push("basement");
 if(ms.knowledge>=10&&!ms.unlocks.includes("underwater"))ms.unlocks.push("underwater");
 const timeCost=Number(e.time||1); ms.time=(ms.time||8)+timeCost;
 let newDay=false;
 if(ms.time>=24){ms.time=8;ms.day=(ms.day||1)+1;newDay=true;ms.hunger=Math.max(0,ms.hunger-1);ms.energy=6;ms.prepared=0;}
 if(ms.home_clean<=2 && Math.random()<0.3) log(r,"집 안에 먼지가 다시 쌓였다.","warning");
 if(ms.water<=2 && Math.random()<0.25) log(r,"저택의 물 저장량이 위험 수준이다.","warning");
 if(ms.food<=1 && Math.random()<0.25) log(r,"식량이 얼마 남지 않았다.","warning");
 // 같은 방의 사건은 조건을 만족할 때만 등장한다. 하루에 같은 사건을 무한 반복하지 않는다.
 ms.seenEvents=ms.seenEvents||{};
 const candidates=Object.entries(MANSION_EVENTS).filter(([id,ev])=>ev.room===ms.room && !ms.seenEvents[id]);
 if(!ms.activeEvent && candidates.length && (Math.random()<0.32 || newDay)){
   const [id]=candidates[Math.floor(Math.random()*candidates.length)];ms.activeEvent=id;ms.seenEvents[id]=true;
   log(r,`작은 사건 · ${MANSION_EVENTS[id].title}`,"event");
 }
 r.mansionState=ms;log(r,`${act.label}: ${act.text}`,"mansion");
 scheduleSave();io.to(r.code).emit("state",pub(r));cb({ok:true,text:act.text,newDay});
});
s.on("choiceTree",({id},cb)=>{
 let r=getRoom(s),p=me(r,s.id);if(!r||!p)return cb({ok:false,error:"방을 찾을 수 없다."});
 let tree=beginChoiceTree(r,p,id);if(!tree)return cb({ok:false,error:"존재하지 않는 선택지 트리다."});
 scheduleSave();io.to(r.code).emit("state",pub(r));cb({ok:true,tree});
});
s.on("choicePick",({choice},cb)=>{
 let r=getRoom(s),p=me(r,s.id);if(!r||!p)return cb({ok:false,error:"방을 찾을 수 없다."});
 const cur=r.choiceState?.current?.tree;if(!cur)return cb({ok:false,error:"진행 중인 선택지가 없다."});
 const c=cur.choices.find(x=>x.id===choice);if(!c||!choiceAvailable(p,c))return cb({ok:false,error:"선택할 수 없다."});
 applyChoiceEffects(p,c.effects);
 r.choiceState.history.push({tree:r.choiceState.current.id,choice:c.id,at:Date.now()});
 p.stats.events++;
 if(c.next){beginChoiceTree(r,p,c.next);}
 else r.choiceState.current=null;
 combine(r,p);log(r,`${p.name}의 선택: ${c.text}`,"choice");
 scheduleSave();io.to(r.code).emit("state",pub(r));cb({ok:true,next:c.next||null});
});
s.on("worldAction",({action},cb)=>{
 let r=getRoom(s),p=me(r,s.id);if(!r||!p)return cb({ok:false,error:"방을 찾을 수 없다."});
 if(action==="openGate"){r.world.doorProgress=Math.min(2,(r.world.doorProgress||0)+1);if(r.world.doorProgress>=2){r.world.opened.deep=true;achievement(r,"deep","새로운 수중 통로");log(r,"수문이 열렸다. 아래쪽 생활권으로 가는 길이 열렸다.","chapter");}else log(r,"수문 장치를 한 번 작동했다. 반대편 장치도 확인해 보자.","puzzle");}
 if(action==="ending"){if(r.score>=20){r.world.ending="LIFE_MILESTONE";achievement(r,"ending","오늘의 큰 사건");log(r,"오늘의 큰 사건을 마쳤다. 이제 자유롭게 도시와 저택을 계속 플레이할 수 있다.","ending");}else return cb({ok:false,error:"조금 더 생활하고 탐험한 뒤 큰 사건을 마무리할 수 있다."});}
 scheduleSave();io.to(r.code).emit("state",pub(r));cb({ok:true});
});

function cardRankValue(rank){return Math.min(rank,10)}
function drawCard(){const suits=["♠","♥","♦","♣"], ranks=["A","2","3","4","5","6","7","8","9","10","J","Q","K"];const rank=Math.floor(Math.random()*13)+1;return{rank,symbol:ranks[rank-1],suit:suits[Math.floor(Math.random()*4)],value:rank===1?1:cardRankValue(rank)}}
function handTotal(hand){let total=hand.reduce((a,c)=>a+c.value,0),aces=hand.filter(c=>c.rank===1).length;while(total>21&&aces){total-=10;aces--}return total}
function startPoker(p){const deck=[...Array(5)].map(drawCard);p.minigame={type:'poker',phase:'result',player:deck,house:[drawCard(),drawCard()],cost:5};}
function startBaccarat(p){p.minigame={type:'baccarat',phase:'bet',cost:5};}
s.on("miniOpen",({game},cb)=>{let r=getRoom(s),p=me(r,s.id);if(!r||!p||p.loc!=="salon")return cb({ok:false,error:"운하 살롱에서만 할 수 있다."});p.minigame=null;io.to(r.code).emit('state',pub(r));cb({ok:true});});
s.on("miniPlay",({game,choice},cb)=>{
 let r=getRoom(s),p=me(r,s.id);if(!r||!p||p.loc!=="salon")return cb({ok:false,error:"운하 살롱에서만 할 수 있다."});
 const cost=5;if((p.money||0)<cost)return cb({ok:false,error:"살롱 코인이 부족하다. 시장에서 일을 하거나 물건을 팔아 코인을 마련하자."});
 p.money-=cost;
 if(game==='poker'){
   const player=[drawCard(),drawCard(),drawCard(),drawCard(),drawCard()], house=[drawCard(),drawCard(),drawCard(),drawCard(),drawCard()];
   function rankHand(h){const counts={};h.forEach(c=>counts[c.rank]=(counts[c.rank]||0)+1);const vals=Object.values(counts).sort((a,b)=>b-a);const sorted=h.map(c=>c.rank===1?14:c.rank).sort((a,b)=>a-b);const straight=sorted.every((v,i)=>i===0||v===sorted[i-1]+1)||JSON.stringify(sorted)===JSON.stringify([2,3,4,5,14]);const flush=h.every(c=>c.suit===h[0].suit);if(straight&&flush)return 8;if(vals[0]===4)return 7;if(vals[0]===3&&vals[1]===2)return 6;if(flush)return 5;if(straight)return 4;if(vals[0]===3)return 3;if(vals[0]===2&&vals[1]===2)return 2;if(vals[0]===2)return 1;return 0}
   const a=rankHand(player),b=rankHand(house);let mult=a>b?2:a===b?1:0;if(mult)p.money+=cost*mult; p.minigame={type:'poker',phase:'result',player,house,playerRank:a,houseRank:b,won:a>b,tie:a===b};
 } else if(game==='baccarat'){
   const player=[drawCard(),drawCard()],banker=[drawCard(),drawCard()];const pt=handTotal(player)%10,bt=handTotal(banker)%10;let result=pt>bt?'player':pt<bt?'banker':'tie';const bet=choice||'player';let mult=bet==='tie'?8:1;let win=bet===result;if(win)p.money+=cost*(mult+1);p.minigame={type:'baccarat',phase:'result',player,banker,pt,bt,result,bet,won:win};
 } else return cb({ok:false,error:"알 수 없는 미니게임이다."});
 log(r,`${p.name}이(가) 살롱에서 ${game}을 플레이했다.`,'minigame');io.to(r.code).emit('state',pub(r));cb({ok:true});
});

s.on("rest",(payload,cb)=>{
 const r=getRoom(s),p=me(r,s.id);
 if(!r||!p)return cb({ok:false,error:"게임 방을 찾을 수 없다."});
 const before=r.day||1;
 const summary=daySummary(r,p);
 advanceWaterlineDay(r);
 p.dailyRest=1;
 scheduleSave();io.to(r.code).emit("state",pub(r));
 cb({ok:true,advanced:true,fromDay:before,toDay:r.day,summary});
});

s.on("dailyEventChoice",({choice,title,key},cb)=>{
 const r=getRoom(s),p=me(r,s.id);
 if(!r||!p)return cb({ok:false,error:"게임 방을 찾을 수 없다."});
 r.worldFlags ||= {};
 r.dailyEvents ||= [];
 r.dailyEvents.push({day:Number(r.day||1),title:String(title||"").slice(0,80),
   choice:String(choice||"").slice(0,40),key:String(key||"").slice(0,60)});
 const c=String(choice||"");
 if(c.includes("살펴본다")||c.includes("가까이")) p.knowledge=(p.knowledge||0)+1;
 if(c.includes("묻는다")||c.includes("아이에게")) p.relation=(p.relation||0)+1;
 cb({ok:true,day:r.day,choice:c,knowledge:p.knowledge||0,relation:p.relation||0});
});

s.on("generateDailyEvent",(payload,cb)=>{
 const r=getRoom(s),p=me(r,s.id);
 if(!r||!p)return cb({ok:false,error:"게임 방을 찾을 수 없다."});
 const event=generateProceduralDailyEvent(r,p);
 cb({ok:true,event});
});
s.on("save",(_,cb)=>{let r=getRoom(s);if(!r)return cb({ok:false});cb({ok:true,data:pub(r)})});
s.on("disconnect",()=>{
 let r=getRoom(s);
 if(!r)return;
 const p=r.players.get(s.id);
 if(p)p.disconnectedAt=Date.now();
 // 잠시 방을 유지해 모바일/브라우저의 재연결이 게임방을 잃지 않게 한다.
 setTimeout(()=>{
   const rr=rooms.get(r.code);
   if(!rr)return;
   const stale=[...rr.players.entries()].filter(([id,x])=>x.disconnectedAt&&Date.now()-x.disconnectedAt>10*60*1000);
   for(const [id,p] of stale){unbindSession(p);rr.players.delete(id);}
   if(!rr.players.size)rooms.delete(rr.code);
   else io.to(rr.code).emit("state",pub(rr));
   scheduleSave();
 },10*60*1000);
 scheduleSave();io.to(r.code).emit("state",pub(r));
});
});
server.listen(PORT,"0.0.0.0",()=>console.log("WATERLINE V62 running"));



