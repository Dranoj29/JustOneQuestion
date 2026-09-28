import{createContext,useContext,useEffect,useRef,useState,type ReactNode,type ComponentProps}from'react';import{Navigate,Route,Routes,useNavigate,useParams}from'react-router-dom';import{motion}from'framer-motion';import{ChevronLeft,Heart,ArrowUp,ArrowDown,Trash2,Save,Download,LogOut,Plus,Copy,Upload}from'lucide-react';import Confetti from'react-confetti';import html2canvas from'html2canvas';import emailjs from'@emailjs/browser';import{supabase}from'./supabase';
type Kind='place'|'food'|'date'|'time';type Sug={id:string;kind:Kind;name:string;emoji:string;value:string;remarks:string;sort_order:number};type Rec={id:string;code:string;name:string};type Hero={page_key:string;emoji:string;media_url:string};type Resp={id?:string;recipient_id?:string;recipient?:Rec;selected_date:string;preferred_time:string;places:string[];foods:string[];custom_place:string;custom_food:string;notes:string;created_at?:string};type MusicCfg={enabled:boolean;track_name:string;music_url:string;volume:number};const today=()=>{const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`},clock=()=>{const d=new Date(),h=d.getHours();return`${String(h%12||12).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')} ${h>=12?'PM':'AM'}`};const empty=():Resp=>({selected_date:today(),preferred_time:clock(),places:[],foods:[],custom_place:'',custom_food:'',notes:''});const AppC=createContext<any>(null);
function Provider({children}:{children:ReactNode}){
  const [data,setData]=useState(empty);
  const [flow,setFlow]=useState({accepted:false,date:false,time:false,places:false,foods:false,notes:false});
  const [isEditing,setIsEditing]=useState(false);
  const [responseId,setResponseId]=useState<string|null>(null);

  const set=(x:Partial<Resp>)=>setData((v:Resp)=>({...v,...x}));
  const done=(k:string)=>setFlow(v=>({...v,[k]:true}));

  const reset=()=>{
    setData(empty());
    setFlow({accepted:false,date:false,time:false,places:false,foods:false,notes:false});
    setIsEditing(false);
    setResponseId(null);
  };

  const startEditing=(response:Resp)=>{
    setData({
      selected_date:response.selected_date,
      preferred_time:response.preferred_time,
      places:response.places||[],
      foods:response.foods||[],
      custom_place:response.custom_place||'',
      custom_food:response.custom_food||'',
      notes:response.notes||''
    });
    setFlow({accepted:true,date:true,time:true,places:true,foods:true,notes:true});
    setIsEditing(true);
    setResponseId(response.id||null);
  };

  return <AppC.Provider value={{data,set,flow,done,reset,isEditing,responseId,startEditing}}>{children}</AppC.Provider>;
}

const useApp=()=>useContext(AppC);
//-----------------------------------
const MusicC=createContext<any>(null);
function MusicProvider({children}:{children:ReactNode}){
  const a=useRef<HTMLAudioElement>(null),
  [cfg,setCfg]=useState<MusicCfg>({
    enabled:false,
    track_name:'Cute Music',
    music_url:'/music/fassounds-cute-cute-music-549927.mp3',
    volume:.5
  });

  const [userMuted,setUserMuted]=useState(
    localStorage.getItem('music-muted')!=='false'
  );

  async function refresh(){
    const {data}=await supabase
      .from('music_settings')
      .select('*')
      .eq('id',1)
      .single();

    if(data){
      setCfg({
        enabled:data.enabled,
        track_name:data.track_name,
        music_url:data.music_url,
        volume:Number(data.volume ?? .5)
      });
    }
  }

  async function play(){
    if(!a.current || !cfg.enabled || userMuted)return;

    a.current.volume=cfg.volume;

    try{
      await a.current.play();
    }catch{}
  }

  async function toggleMusic(){
    if(!a.current || !cfg.enabled)return;

    if(userMuted){
      setUserMuted(false);
      localStorage.setItem('music-muted','false');
      a.current.volume=cfg.volume;

      try{
        await a.current.play();
      }catch{}

      return;
    }

    a.current.pause();
    setUserMuted(true);
    localStorage.setItem('music-muted','true');
  }

  useEffect(()=>{
    refresh();
  },[]);

  useEffect(()=>{
    if(!a.current)return;

    a.current.volume=cfg.volume;

    if(!cfg.enabled || userMuted){
      a.current.pause();
      return;
    }

    a.current.load();
    play();
  },[cfg,userMuted]);

  return(
    <MusicC.Provider value={{cfg,refresh,userMuted,toggleMusic}}>
      <audio
        ref={a}
        src={cfg.music_url}
        loop
        preload="auto"
      />
      {children}
    </MusicC.Provider>
  );
}


const useMusic=()=>useContext(MusicC);
const defaults:any={welcome:'🐶',proposal:'🐱',date:'📅',time:'⏰',places:'📍',foods:'🍽️',notes:'📝',confirm:'❤️',success:'🎉'};function Hero({page,heroes}:{page:string;heroes:Hero[]}){const h=heroes.find(x=>x.page_key===page);return h?.media_url?<img className="hero" src={h.media_url}/>:<div className="pet">{h?.emoji||defaults[page]}</div>}
function Shell({children,step,back=true,wide=false}:{children:ReactNode;step?:number;back?:boolean;wide?:boolean}){
  const n=useNavigate();
  const music=useMusic();

  return <main className={'shell '+(wide?'wide':'')}>
    {back&&<button className="back" onClick={()=>n(-1)}><ChevronLeft/></button>}

    {music?.cfg?.enabled&&(
      <button
        onClick={music.toggleMusic}
        style={{
          position:'fixed',
          top:16,
          right:16,
          zIndex:999,
          width:42,
          height:42,
          border:'1px solid white',
          borderRadius:22,
          background:'#ffffffdf',
          cursor:'pointer'
        }}
      >
        {music.userMuted?'🔇':'🎵'}
      </button>
    )}

    {step&&<div className="progress"><i style={{width:`${step/7*100}%`}}/></div>}

    <motion.section className="card" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
      {children}
    </motion.section>
  </main>
}

function Primary(p:ComponentProps<typeof motion.button>){
  return <motion.button whileTap={{scale:.96}} className="primary" {...p}/>;
}

function useSug(k:Kind){
  const[x,setX]=useState<Sug[]>([]);
  useEffect(()=>{
    supabase.from('suggestions').select('*').eq('kind',k).order('sort_order').then(r=>setX((r.data||[])as Sug[]));
  },[k]);
  return x;
}

function Guard({step,code,children}:{step:number;code:string;children:ReactNode}){const{flow}=useApp(),o=['accepted','date','time','places','foods','notes'];return step===0||flow[o[step-1]]?<>{children}</>:<Navigate to={`/r/${code}/${step<=1?'proposal':o[step-1]}`} replace/>}
function RecipientApp(){
  const {code=''}=useParams();
  const n=useNavigate();
  const {startEditing}=useApp();
  const [r,setR]=useState<Rec|null>(null);
  const [heroes,setHeroes]=useState<Hero[]>([]);
  const [existingResponse,setExistingResponse]=useState<Resp|null>(null);
  const [load,setLoad]=useState(true);

  useEffect(()=>{
    let active=true;

    async function loadInvitation(){
      setLoad(true);

      const recipientResult=await supabase
        .from('recipients')
        .select('*')
        .eq('code',code)
        .eq('active',true)
        .single();

      const heroesResult=await supabase
        .from('page_heroes')
        .select('*');

      if(!active)return;

      const recipient=recipientResult.data as Rec|null;
      setR(recipient);
      setHeroes((heroesResult.data||[]) as Hero[]);

      if(recipient){
        const responseResult=await supabase
          .from('responses')
          .select('*')
          .eq('recipient_id',recipient.id)
          .order('created_at',{ascending:false})
          .limit(1)
          .maybeSingle();

        if(active){
          setExistingResponse((responseResult.data||null) as Resp|null);
        }
      }

      if(active)setLoad(false);
    }

    loadInvitation();

    return()=>{
      active=false;
    };
  },[code]);

  if(load)return <Shell back={false}>Loading...</Shell>;
  if(!r)return <Shell back={false}><h1>Invitation not found</h1></Shell>;

  return <Routes>
    <Route index element={
      <Welcome
        r={r}
        h={heroes}
        existingResponse={existingResponse}
        onEdit={()=>{
          if(!existingResponse)return;
          startEditing(existingResponse);
          window.scrollTo(0,0);
          n('date');
        }}
      />
    }/>
    <Route path="proposal" element={<Guard step={0} code={code}><Proposal h={heroes}/></Guard>}/>
    <Route path="date" element={<Guard step={1} code={code}><DatePage h={heroes}/></Guard>}/>
    <Route path="time" element={<Guard step={2} code={code}><TimePage h={heroes}/></Guard>}/>
    <Route path="places" element={<Guard step={3} code={code}><Select kind="place" h={heroes}/></Guard>}/>
    <Route path="foods" element={<Guard step={4} code={code}><Select kind="food" h={heroes}/></Guard>}/>
    <Route path="notes" element={<Guard step={5} code={code}><Notes h={heroes}/></Guard>}/>
    <Route path="confirm" element={<Guard step={6} code={code}><Confirm r={r} h={heroes}/></Guard>}/>
  </Routes>;
}

function Welcome({r,h,existingResponse,onEdit}:{r:Rec;h:Hero[];existingResponse:Resp|null;onEdit:()=>void}){
  const n=useNavigate();
  const {reset}=useApp();

  useEffect(()=>{
    if(!existingResponse)reset();
  },[existingResponse]);

  if(existingResponse){
    return <Shell back={false}>
      <Hero page="welcome" heroes={h}/>
      <h1>Hi {r.name} ❤️</h1>
      <p>✅ You have already completed this invitation.</p>
      <p>Thank you for sharing your preferred date, time, places, and food choices. 💕</p>
      <p>You can view your certificate or update your response anytime.</p>
      <Primary onClick={()=>n(`/success/${existingResponse.id}`)}>View My Certificate ❤️</Primary>
      <br/>
      <Primary onClick={onEdit}>Edit My Response ✏️</Primary>
    </Shell>;
  }

  return <Shell back={false}>
    <Hero page="welcome" heroes={h}/>
    <h1>Hi {r.name} ❤️</h1>
    <p>I have something I'd like to ask you. 🫣</p>
    <Primary onClick={()=>n('proposal')}>Open</Primary>
  </Shell>;
}

function Proposal({h}:{h:Hero[]}){
  const n=useNavigate();
  const {done}=useApp();
  const yes=useRef<HTMLButtonElement>(null);
  const labels=['No 😅','Are you sure? 😯','Really sure? 😔','Please? 🥺','Last chance? 🤭'];
  const [c,setC]=useState(0);
  const [p,setP]=useState({left:16,top:90});
  const esc=c===4;

  function move(){
    const b=yes.current?.getBoundingClientRect();
    for(let i=0;i<80;i++){
      const x=16+Math.random()*(innerWidth-172);
      const y=70+Math.random()*(innerHeight-155);
      const hit=b&&x<b.right+36&&x+140>b.left-36&&y<b.bottom+36&&y+54>b.top-36;
      if(!hit)return setP({left:x,top:y});
    }
  }

  useEffect(()=>{
    if(esc)move();
  },[esc]);

  return <Shell step={1} wide>
    <Hero page="proposal" heroes={h}/>
    <h1>Would you like to go out with me? ❤️</h1>
    <div className="proposal">
      <motion.button ref={yes} className="primary" onClick={()=>{done('accepted');n('../date')}}>Yes ❤️</motion.button>
      {!esc&&<button className="secondary" onClick={()=>setC(v=>v+1)}>{labels[c]}</button>}
    </div>
    {esc&&<button className="secondary escape" style={p} onPointerEnter={move} onClick={move}>{labels[c]}</button>}
  </Shell>;
}

function PartsDate({v,set}:{v:string;set:(x:string)=>void}){const[y,m,d]=v.split('-').map(Number),ys=[new Date().getFullYear(),new Date().getFullYear()+1,new Date().getFullYear()+2],days=new Date(y,m,0).getDate(),go=(yy=y,mm=m,dd=d)=>set(`${yy}-${String(mm).padStart(2,'0')}-${String(Math.min(dd,new Date(yy,mm,0).getDate())).padStart(2,'0')}`);return <div className="parts"><label>MM<select value={m} onChange={e=>go(y,+e.target.value,d)}>{[...Array(12)].map((_,i)=><option value={i+1}>{String(i+1).padStart(2,'0')}</option>)}</select></label><label>DD<select value={d} onChange={e=>go(y,m,+e.target.value)}>{[...Array(days)].map((_,i)=><option value={i+1}>{String(i+1).padStart(2,'0')}</option>)}</select></label><label>YYYY<select value={y} onChange={e=>go(+e.target.value,m,d)}>{ys.map(x=><option>{x}</option>)}</select></label></div>}function DatePage({h}:{h:Hero[]}){const s=useSug('date'),n=useNavigate(),{data,set,done}=useApp();return <Shell step={2}><Hero page="date" heroes={h}/><h1>Pick our date 💕</h1><div className="quick">{s.map(x=><button className={data.selected_date===x.value?'selected':''} onClick={()=>set({selected_date:x.value})}><span>{x.emoji}</span><b>{new Date(x.value+'T00:00').toLocaleDateString(undefined,{month:'short',day:'numeric'})}</b><small>{x.name}</small><em>{x.remarks}</em></button>)}</div><PartsDate v={data.selected_date} set={v=>set({selected_date:v})}/><Primary disabled={data.selected_date<today()} onClick={()=>{done('date');window.scrollTo(0,0);n('../time')}}>Continue</Primary></Shell>}
function PartsTime({v,set}:{v:string;set:(x:string)=>void}){const[t,ap]=v.split(' '),[hh,mm]=t.split(':');return <div className="parts"><label>HH<select value={hh} onChange={e=>set(`${e.target.value}:${mm} ${ap}`)}>{[...Array(12)].map((_,i)=><option>{String(i+1).padStart(2,'0')}</option>)}</select></label><label>MM<select value={mm} onChange={e=>set(`${hh}:${e.target.value} ${ap}`)}>{[...Array(60)].map((_,i)=><option>{String(i).padStart(2,'0')}</option>)}</select></label><label>AM/PM<select value={ap} onChange={e=>set(`${hh}:${mm} ${e.target.value}`)}><option>AM</option><option>PM</option></select></label></div>}function TimePage({h}:{h:Hero[]}){const s=useSug('time'),n=useNavigate(),{data,set,done}=useApp();return <Shell step={3}><Hero page="time" heroes={h}/><h1>What time should we meet? ⏰</h1><div className="quick">{s.map(x=><button className={data.preferred_time===x.value?'selected':''} onClick={()=>set({preferred_time:x.value})}><span>{x.emoji}</span><b>{x.name}</b><small>{x.value}</small></button>)}</div><PartsTime v={data.preferred_time} set={v=>set({preferred_time:v})}/><Primary onClick={()=>{done('time');window.scrollTo(0,0);n('../places')}}>Continue</Primary></Shell>}
function Select({kind,h}:{kind:'place'|'food';h:Hero[]}){const items=useSug(kind),n=useNavigate(),{data,set,done}=useApp(),[q,setQ]=useState(''),key=kind==='place'?'places':'foods',selected=data[key],custom=kind==='place'?data.custom_place:data.custom_food,shown=items.filter(x=>x.name.toLowerCase().includes(q.toLowerCase())),toggle=(v:string)=>set({[key]:selected.includes(v)?selected.filter((z:string)=>z!==v):[...selected,v]});return <Shell step={kind==='place'?4:5}><Hero page={kind==='place'?'places':'foods'} heroes={h}/><h1>{kind==='place'?'Where should we go?':'What should we eat?'}</h1><input className="input" placeholder="Search..." value={q} onChange={e=>setQ(e.target.value)}/><div className="choices">{shown.map(x=><button className={selected.includes(x.name)?'selected':''} onClick={()=>toggle(x.name)}><span>{x.emoji}</span><b>{x.name}</b></button>)}</div><input className="input" placeholder="Other (optional)" value={custom} onChange={e=>set(kind==='place'?{custom_place:e.target.value}:{custom_food:e.target.value})}/><Primary disabled={!selected.length&&!custom} onClick={()=>{done(kind==='place'?'places':'foods');window.scrollTo(0,0);n(kind==='place'?'../foods':'../notes')}}>Continue</Primary></Shell>}function Notes({h}:{h:Hero[]}){const n=useNavigate(),{data,set,done}=useApp();return <Shell step={6}><Hero page="notes" heroes={h}/><h1>Anything you'd like me to know? ❤️</h1><textarea rows={5} value={data.notes} onChange={e=>set({notes:e.target.value})}/><Primary onClick={()=>{done('notes');window.scrollTo(0,0);n('../confirm')}}>{data.notes?'Continue':'Skip'}</Primary></Shell>}
function Summary({d}:{d:Resp}){
  return <div className="summary">
    <div><small>Date</small><b>{d.selected_date}</b></div>
    <div><small>Time</small><b>{d.preferred_time}</b></div>
    <div><small>Places</small><b>{[...d.places,d.custom_place].filter(Boolean).join(', ')}</b></div>
    <div><small>Foods</small><b>{[...d.foods,d.custom_food].filter(Boolean).join(', ')}</b></div>
    {d.notes&&<div><small>Message</small><b>{d.notes}</b></div>}
  </div>;
}

async function submit(d:Resp,r:Rec,isEditing:boolean,responseId:string|null){
  const payload={
    selected_date:d.selected_date,
    preferred_time:d.preferred_time,
    places:d.places,
    foods:d.foods,
    custom_place:d.custom_place,
    custom_food:d.custom_food,
    notes:d.notes,
    recipient_id:r.id
  };

  let savedId=responseId;

  if(isEditing&&responseId){
    const {error}=await supabase
      .from('responses')
      .update(payload)
      .eq('id',responseId)
      .eq('recipient_id',r.id);

    if(error)throw error;
  }else{
    const {data,error}=await supabase
      .from('responses')
      .insert(payload)
      .select('id')
      .single();

    if(error)throw error;
    savedId=data.id;
  }

  if(!savedId)throw new Error('Response ID was not returned.');

  const s=import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const t=import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const k=import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  if(s&&t&&k){
    emailjs.send(s,t,{
      response_id:savedId,
      recipient:r.name,
      submission_type:isEditing?'Response Updated':'New Response',
      selected_date:d.selected_date,
      preferred_time:d.preferred_time,
      places:[...d.places,d.custom_place].filter(Boolean).join(', '),
      foods:[...d.foods,d.custom_food].filter(Boolean).join(', '),
      notes:d.notes||'None'
    },k).catch(()=>{});
  }

  return savedId;
}

function Confirm({r,h}:{r:Rec;h:Hero[]}){
  const {data,isEditing,responseId}=useApp();
  const n=useNavigate();
  const [busy,setBusy]=useState(false);
  const [err,setErr]=useState('');

  return <Shell step={7}>
    <Hero page="confirm" heroes={h}/>
    <h1>Our Date Plan ❤️</h1>
    <Summary d={data}/>
    {err&&<p className="error">{err}</p>}
    <Primary disabled={busy} onClick={async()=>{
      setBusy(true);
      setErr('');
      try{
        const id=await submit(data,r,isEditing,responseId);
        n('/success/'+id);
      }catch(e){
        setErr(e instanceof Error?e.message:'Failed');
      }finally{
        setBusy(false);
      }
    }}>
      {busy?'Saving...':isEditing?'Update My Response ❤️':'Submit ❤️'}
    </Primary>
  </Shell>;
}

function Success(){const{id}=useParams(),[d,setD]=useState<Resp|null>(null),[h,setH]=useState<Hero[]>([]),[load,setLoad]=useState(true),cert=useRef<HTMLDivElement>(null);useEffect(()=>{Promise.all([supabase.from('responses').select('*,recipient:recipients(*)').eq('id',id).single(),supabase.from('page_heroes').select('*')]).then(([a,b])=>{setD(a.data);setH((b.data||[])as Hero[]);setLoad(false)})},[id]);
async function dl(){
  if(!cert.current)return;

  const canvas=await html2canvas(cert.current,{
    scale:2,
    useCORS:true,
    backgroundColor:'#fff9fb'
  });

  const blob=await new Promise<Blob|null>(resolve=>{
    canvas.toBlob(resolve,'image/png',1);
  });

  if(!blob)throw new Error('Certificate image could not be created.');

  const isMobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if(isMobile){
    const file=new File(
      [blob],
      'date-certificate.png',
      {type:'image/png'}
    );

    if(
      typeof navigator.share==='function'&&
      typeof navigator.canShare==='function'&&
      navigator.canShare({files:[file]})
    ){
      try{
        await navigator.share({
          title:'Date Certificate',
          files:[file]
        });
        return;
      }catch(error){
        if(error instanceof DOMException&&error.name==='AbortError')return;
      }
    }
  }

  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');

  link.href=url;
  link.download='date-certificate.png';
  link.style.display='none';

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

if(load)return <Shell back={false}>Loading...</Shell>;if(!d)return <Shell back={false}>Not found</Shell>;return <Shell back={false}><Confetti recycle={false}/><Hero page="success" heroes={h}/><h1>Thank you {d.recipient?.name} ❤️</h1><div className="certificate" ref={cert}><div className="seal">♥</div>
<h2>🏆 Certificate of Date Acceptance ❤️</h2>
<p className="cert-intro">
💌 This is to certify that
</p>
<h3>🌸 Ms. {d.recipient?.name} 🌸</h3>
<p className="cert-body">
Has officially accepted a heartfelt invitation and agreed to embark on a lovely little adventure together. 💕
</p>
<p className="cert-body">
May this certificate serve as a reminder that every beautiful story starts with a simple "Yes" ❤️, a little courage 🌹, and the excitement of creating unforgettable memories together ✨🥰.
</p>
<p className="cert-footer">
🦋 Awarded with affection, gratitude, and anticipation for the wonderful date ahead ❤️
</p><Summary d={d}/><small>Reference ID: {id}</small></div><div className="buttons"><Primary onClick={dl}><Download/> Certificate</Primary><Primary onClick={()=>navigator.clipboard.writeText(id||'')}><Copy/> Copy ID</Primary></div><div className="ready"><h3>Get ready for the day ✨</h3><p>✨ Prepare your best smile ☺️</p><p>✨ Bring your good vibes 🤩</p><p>✨ Save your appetite 😋</p><p>✨ See ya 😎</p></div></Shell>}
function Login(){const n=useNavigate(),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[err,setErr]=useState('');return <main className="admin"><section><h1>Admin Login</h1><input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/><input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}/><Primary onClick={async()=>{const{error}=await supabase.auth.signInWithPassword({email,password});if(error)setErr(error.message);else n('/admin')}}>Sign in</Primary><p>{err}</p></section></main>}function AGuard({children}:{children:ReactNode}){const[ok,setOk]=useState<boolean|null>(null);useEffect(()=>{supabase.auth.getSession().then(x=>setOk(!!x.data.session))},[]);return ok===null?null:ok?<>{children}</>:<Navigate to="/admin/login"/>}
function exportFile(rows:any[],type:'json'|'csv'){const h=['id','recipient','selected_date','preferred_time','places','foods','notes','created_at'];let text=type==='json'?JSON.stringify(rows,null,2):[h.join(','),...rows.map(r=>h.map(k=>'"'+String(k==='recipient'?r.recipient?.name:Array.isArray(r[k])?r[k].join('|'):r[k]??'').replaceAll('"','""')+'"').join(','))].join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text]));a.download=`responses.${type}`;a.click()}
function MusicAdmin(){const{cfg,refresh}=useMusic(),[x,setX]=useState<MusicCfg>(cfg),[saving,setSaving]=useState(false),[msg,setMsg]=useState('');useEffect(()=>setX(cfg),[cfg]);async function upload(f:File){setSaving(true);const path=`tracks/${Date.now()}-${f.name.replace(/[^a-zA-Z0-9._-]/g,'-')}`,u=await supabase.storage.from('music').upload(path,f,{contentType:f.type||'audio/mpeg'});if(u.error){setMsg(u.error.message);setSaving(false);return}setX(v=>({...v,music_url:supabase.storage.from('music').getPublicUrl(path).data.publicUrl,track_name:f.name.replace(/\.[^.]+$/,'')}));setMsg('Uploaded. Save settings.');setSaving(false)}async function save(){setSaving(true);const{error}=await supabase.from('music_settings').upsert({id:1,...x,updated_at:new Date().toISOString()});setMsg(error?error.message:'Saved');if(!error)await refresh();setSaving(false)}return <div className="music-admin"><h2>Music Settings</h2><label><input type="checkbox" checked={x.enabled} onChange={e=>setX({...x,enabled:e.target.checked})}/> Music enabled</label><label>Track name<input value={x.track_name} onChange={e=>setX({...x,track_name:e.target.value})}/></label><label>Music URL<input value={x.music_url} onChange={e=>setX({...x,music_url:e.target.value})}/></label><label><Upload/> Upload MP3<input type="file" accept="audio/*" onChange={e=>{const f=e.target.files?.[0];if(f)upload(f)}}/></label><label>Volume: {Math.round(x.volume*100)}%<input type="range" min="0" max="100" value={Math.round(x.volume*100)} onChange={e=>setX({...x,volume:+e.target.value/100})}/></label><button onClick={save} disabled={saving}>{saving?'Saving...':'Save Music'}</button>{msg&&<p>{msg}</p>}</div>}
function Admin(){const[tab,setTab]=useState<'responses'|'recipients'|'heroes'|'music'|Kind>('responses'),[rows,setRows]=useState<any[]>([]),[rec,setRec]=useState<Rec[]>([]),[s,setS]=useState<Sug[]>([]),[h,setH]=useState<Hero[]>([]),[search,setSearch]=useState('');async function load(){const[a,b,c,d]=await Promise.all([supabase.from('responses').select('*,recipient:recipients(*)').order('created_at',{ascending:false}),supabase.from('recipients').select('*').order('created_at'),supabase.from('suggestions').select('*').order('sort_order'),supabase.from('page_heroes').select('*')]);setRows(a.data||[]);setRec((b.data||[])as Rec[]);setS((c.data||[])as Sug[]);setH((d.data||[])as Hero[])}useEffect(()=>{load()},[]);async function move(x:Sug,d:number){const l=s.filter(v=>v.kind===x.kind),i=l.findIndex(v=>v.id===x.id),j=i+d;if(j<0||j>=l.length)return;await Promise.all([supabase.from('suggestions').update({sort_order:l[j].sort_order}).eq('id',x.id),supabase.from('suggestions').update({sort_order:x.sort_order}).eq('id',l[j].id)]);load()}async function heroUpload(page:string,f:File){const path=`${page}/${Date.now()}-${f.name}`,u=await supabase.storage.from('hero-media').upload(path,f);if(u.error)return alert(u.error.message);await supabase.from('page_heroes').update({media_url:supabase.storage.from('hero-media').getPublicUrl(path).data.publicUrl}).eq('page_key',page);load()}return <main className="admin"><section><header><h1>Admin v3.1.2</h1><button onClick={async()=>{await supabase.auth.signOut();location.href='/admin/login'}}><LogOut/></button></header><nav>{(['responses','recipients','heroes','music','date','time','place','food']as const).map(x=><button className={tab===x?'active':''} onClick={()=>setTab(x)}>{x}</button>)}</nav>{tab==='responses'?<><div className="tools"><input placeholder="Search" value={search} onChange={e=>setSearch(e.target.value)}/><button onClick={()=>exportFile(rows,'csv')}>CSV</button><button onClick={()=>exportFile(rows,'json')}>JSON</button></div>{rows.filter(x=>JSON.stringify(x).toLowerCase().includes(search.toLowerCase())).map(x=><article><h3>{x.recipient?.name}</h3><Summary d={x}/><small>{x.id}</small></article>)}</>:tab==='recipients'?<><button className="add" onClick={async()=>{const name=prompt('Recipient name');if(name){await supabase.from('recipients').insert({name});load()}}}><Plus/> Add recipient</button>{rec.map(x=><div className="admin-row recipient"><input value={x.name} onChange={e=>setRec(v=>v.map(q=>q.id===x.id?{...q,name:e.target.value}:q))}/><code>{location.origin}/r/{x.code}</code><button onClick={()=>navigator.clipboard.writeText(`${location.origin}/r/${x.code}`)}><Copy/></button><button onClick={async()=>{await supabase.from('recipients').update({name:x.name}).eq('id',x.id)}}><Save/></button><button onClick={async()=>{await supabase.from('recipients').delete().eq('id',x.id);load()}}><Trash2/></button></div>)}</>:tab==='heroes'?<>{h.map(x=><div className="hero-edit"><b>{x.page_key}</b><input value={x.emoji} onChange={e=>setH(v=>v.map(q=>q.page_key===x.page_key?{...q,emoji:e.target.value}:q))}/>{x.media_url&&<img src={x.media_url}/>}<label><Upload/> Upload<input type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(f)heroUpload(x.page_key,f)}}/></label><button onClick={async()=>{await supabase.from('page_heroes').update({emoji:x.emoji,media_url:''}).eq('page_key',x.page_key);load()}}>Use emoji</button></div>)}</>:tab==='music'?<MusicAdmin/>:<><button className="add" onClick={async()=>{await supabase.from('suggestions').insert({kind:tab,name:'New item',emoji:'✨',value:'',remarks:'',sort_order:s.filter(x=>x.kind===tab).length});load()}}><Plus/> Add</button>{s.filter(x=>x.kind===tab).map(x=><div className="admin-row"><input value={x.emoji} onChange={e=>setS(v=>v.map(q=>q.id===x.id?{...q,emoji:e.target.value}:q))}/><input value={x.name} onChange={e=>setS(v=>v.map(q=>q.id===x.id?{...q,name:e.target.value}:q))}/><input value={x.value} onChange={e=>setS(v=>v.map(q=>q.id===x.id?{...q,value:e.target.value}:q))}/><input value={x.remarks} onChange={e=>setS(v=>v.map(q=>q.id===x.id?{...q,remarks:e.target.value}:q))}/><button onClick={()=>move(x,-1)}><ArrowUp/></button><button onClick={()=>move(x,1)}><ArrowDown/></button><button onClick={async()=>{await supabase.from('suggestions').update(x).eq('id',x.id)}}><Save/></button><button onClick={async()=>{await supabase.from('suggestions').delete().eq('id',x.id);load()}}><Trash2/></button></div>)}</>}</section></main>}
export default function App(){return <MusicProvider><Provider><Routes><Route path="/" element={<Shell back={false}><h1>Use your unique invitation link ❤️</h1></Shell>}/><Route path="/r/:code/*" element={<RecipientApp/>}/><Route path="/success/:id" element={<Success/>}/><Route path="/admin/login" element={<Login/>}/><Route path="/admin" element={<AGuard><Admin/></AGuard>}/><Route path="*" element={<Navigate to="/"/>}/></Routes></Provider></MusicProvider>}