import React,{useState,useRef,useEffect,useCallback,Component} from "react";
import * as THREE from 'three';
import {BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,LineChart,Line,RadarChart,Radar,PolarGrid,PolarAngleAxis} from 'recharts';
import {anthropicChat,parseJsonSafe,hasApiKey,setApiKey,clearApiKey,generateImage} from './api';
import {listProjects,saveProject,loadProject,deleteProject} from './storage';

// ══════════════════════════════════════
// CONSTANTS & DATA
// ══════════════════════════════════════
const gold="#d4a853",goldL="#f0c87a",bg="#07080d",card="#10121c",brd="#1c1f33",sub="#6b7394",txt="#dde0f0";
const BG_BLUEPRINT="#001428";

const I18N={
  TR:{title:"ArchitectAI",sub:"AI Mimari Tasarım Platformu",start:"Sıfırdan Başla",generate:"AI ile Üret",generating:"AI Üretiyor...",next:"İleri →",back:"← Geri",save:"Kaydet",templates:"Şablonlar",projects:"Projeler",dashboard:"Dashboard",compare:"Karşılaştır",present:"Sunum",quote:"Teklif",export:"PDF",newProject:"Yeni Proje",language:"Dil",blueprintMode:"Blueprint Mod",darkMode:"Koyu Mod"},
  EN:{title:"ArchitectAI",sub:"AI Architecture Design Platform",start:"Start from Scratch",generate:"Generate with AI",generating:"AI Generating...",next:"Next →",back:"← Back",save:"Save",templates:"Templates",projects:"Projects",dashboard:"Dashboard",compare:"Compare",present:"Present",quote:"Quote",export:"PDF",newProject:"New Project",language:"Language",blueprintMode:"Blueprint Mode",darkMode:"Dark Mode"},
  RU:{title:"ArchitectAI",sub:"AI Платформа Архитектурного Дизайна",start:"Начать с нуля",generate:"Создать с AI",generating:"AI Генерирует...",next:"Далее →",back:"← Назад",save:"Сохранить",templates:"Шаблоны",projects:"Проекты",dashboard:"Панель",compare:"Сравнить",present:"Презентация",quote:"Предложение",export:"PDF",newProject:"Новый Проект",language:"Язык",blueprintMode:"Чертёж",darkMode:"Тёмный"},
};

const PALETTES={modern:{c:["#f5f5f5","#2c2c2c","#e8e0d0","#8a8a8a","#c4b89a"],d:"Nötr & temiz"},minimalist:{c:["#ffffff","#f0ede8","#d4cfc9","#b8b4ae","#3a3632"],d:"Saf beyaz & bej"},brutalist:{c:["#8a8680","#5c5854","#3a3834","#d4c8b8","#a89880"],d:"Ham beton"},parametric:{c:["#0a1628","#1a3a5c","#2a6496","#64b4dc","#c8e8f8"],d:"Teknolojik mavi"},futuristic:{c:["#050810","#0a1020","#1a2840","#40a0ff","#80d0ff"],d:"Derin uzay"},japanese:{c:["#f5f0e8","#c8b89a","#8a7060","#4a5840","#d4c8a8"],d:"Wabi-sabi"},scandinavian:{c:["#f8f5f0","#e8e0d0","#c8c0b0","#7a8a78","#4a5848"],d:"Nordik doğal"},mediterranean:{c:["#f5e8c8","#e8c878","#d4a840","#5a8ab0","#285898"],d:"Akdeniz güneşi"},ottoman:{c:["#8b0000","#c8a040","#1a3050","#2a5840","#f0e8d0"],d:"Tarihi zarafet"},organic:{c:["#2d4a20","#4a7830","#8ab840","#c8d8a0","#f0e8c8"],d:"Doğa yeşili"},industrial:{c:["#3a3830","#5a5850","#8a8878","#c4b898","#e0d8c8"],d:"Çelik endüstriyel"},cyberpunk:{c:["#050808","#101820","#ff0080","#00ffff","#ff8800"],d:"Neon kontrast"},zahahadid:{c:["#e8e0d8","#c0b8b0","#808080","#404040","#1a1a2e"],d:"Akışkan parametrik"},gehry:{c:["#c0c8d0","#8090a0","#506070","#d4c8b0","#f0e8d8"],d:"Titanyum & çelik"},tadaoando:{c:["#c8c4c0","#a0a0a0","#606060","#404040","#181818"],d:"Saf beton & ışık"},lecorbusier:{c:["#f5f0e0","#e8d8a0","#c0a040","#406080","#204060"],d:"Purism & renk"},};

const ARCH_MASTERS=[
  {id:"zahahadid",l:"Zaha Hadid",i:"🌊",d:"Parametrik akışkan formlar, dinamik cepheler, fütüristik eğriler",style:"futuristic"},
  {id:"gehry",l:"Frank Gehry",i:"🌀",d:"Dekonstriktivist titanium kıvrımlar, parçalı hacimler",style:"parametric"},
  {id:"tadaoando",l:"Tadao Ando",i:"⬜",d:"Minimalist ham beton, ışık ve gölge oyunları, japon estetiği",style:"japanese"},
  {id:"lecorbusier",l:"Le Corbusier",i:"📐",d:"Purism, pilotiler, çatı bahçesi, yatay pencere",style:"minimalist"},
  {id:"rempiano",l:"Renzo Piano",i:"🔩",d:"High-tech, şeffaflık, hafif çelik strüktür",style:"industrial"},
  {id:"normfoster",l:"Norman Foster",i:"🔮",d:"Sürdürülebilir high-tech, cam kubbeler, akıllı bina",style:"modern"},
];

const TYPES=[{id:"daire",l:"Daire",i:"🏠"},{id:"villa",l:"Villa",i:"🏡"},{id:"apartman",l:"Apartman",i:"🏢"},{id:"ofis",l:"Ofis",i:"🏦"},{id:"restoran",l:"Restoran",i:"🍽️"},{id:"kafe",l:"Kafe",i:"☕"},{id:"otel",l:"Otel",i:"🏨"},{id:"hastane",l:"Hastane",i:"🏥"},{id:"okul",l:"Okul",i:"🏫"},{id:"avm",l:"AVM",i:"🛍️"},{id:"kultur",l:"Kültür",i:"🎭"},{id:"spor",l:"Spor",i:"🏟️"},{id:"ic",l:"İç Mekan",i:"🛋️"},{id:"peyzaj",l:"Peyzaj",i:"🌿"},{id:"diger",l:"Diğer",i:"✏️"}];
const STYLES=[{id:"modern",l:"Modern"},{id:"minimalist",l:"Minimalist"},{id:"brutalist",l:"Brutalist"},{id:"parametric",l:"Parametrik"},{id:"futuristic",l:"Fütüristik"},{id:"japanese",l:"Japon"},{id:"scandinavian",l:"İskandinav"},{id:"mediterranean",l:"Akdeniz"},{id:"ottoman",l:"Osmanlı"},{id:"organic",l:"Organik"},{id:"industrial",l:"Endüstriyel"},{id:"cyberpunk",l:"Cyberpunk"}];
const MATS=["Beton","Cam","Ahşap","Taş","Çelik","Bambu","Kompozit","Alüminyum","Seramik","Mermer","Tuğla","Sürd. Malzeme"];
const LIGHTS=["Doğal Işık","Ambiyans","LED Strip","Spot","Güneş Tüpü","Akıllı","Endüstriyel","Gizli"];
const SUSTAIN=[{l:"Güneş Paneli",i:"☀️"},{l:"Yeşil Çatı",i:"🌱"},{l:"Doğal Havalandırma",i:"💨"},{l:"Yağmur Suyu",i:"💧"},{l:"Yüksek Yalıtım",i:"🔒"},{l:"Akıllı Ev",i:"🤖"},{l:"EV Şarj",i:"⚡"},{l:"Biyofilik Tasarım",i:"🌿"}];
const RMAP={daire:["Oturma","Yatak","Mutfak","Banyo","Hol"],villa:["Salon","Yemek","Mutfak","Yatak","Banyo","Garaj","Teras"],ofis:["Açık Ofis","Toplantı","Yönetici","Mutfak","WC"],restoran:["Yemek Salonu","Mutfak","Bar","Depo","WC"],otel:["Lobi","Oda","Resepsiyon","Restoran","Toplantı"]};
const MCOST={"Beton":4500,"Cam":6000,"Ahşap":5500,"Taş":7000,"Çelik":8000,"Bambu":4000,"Kompozit":6500,"Alüminyum":7500,"Seramik":5000,"Mermer":9000,"Tuğla":4200,"Sürd. Malzeme":6800};
const LMUL={"istanbul":1.4,"ankara":1.15,"izmir":1.2,"antalya":1.1,"bodrum":1.35};
const EQZ={"İstanbul":{z:1,r:"Çok Yüksek",c:"#ff4444"},"İzmir":{z:1,r:"Çok Yüksek",c:"#ff4444"},"Ankara":{z:3,r:"Orta",c:"#ffa500"},"Bodrum":{z:1,r:"Çok Yüksek",c:"#ff4444"},"Antalya":{z:2,r:"Yüksek",c:"#ffcc00"},"Konya":{z:4,r:"Düşük",c:"#4caf80"}};
const CO2_MAT={"Beton":410,"Cam":1200,"Ahşap":-200,"Taş":100,"Çelik":2500,"Bambu":-400,"Kompozit":800,"Alüminyum":8000,"Seramik":700,"Mermer":200,"Tuğla":300,"Sürd. Malzeme":50};
const ENERGY_MAT={"Yüksek Yalıtım":-30,"Güneş Paneli":-25,"Doğal Havalandırma":-15,"Akıllı Ev":-20,"Yeşil Çatı":-10,"Biyofilik Tasarım":-5};
const FURN=[{id:"sofa",l:"Koltuk",i:"🛋️"},{id:"bed",l:"Yatak",i:"🛏️"},{id:"table",l:"Masa",i:"🪑"},{id:"dining",l:"Yemek",i:"🍽️"},{id:"kitchen",l:"Mutfak",i:"🍳"},{id:"bath",l:"Banyo",i:"🛁"},{id:"desk",l:"Çalışma",i:"💻"},{id:"closet",l:"Dolap",i:"🪄"},{id:"tv",l:"TV",i:"📺"},{id:"plant",l:"Bitki",i:"🌿"}];
const CLIMATE_CITIES={"İstanbul":{sun:2520,rain:820,wind:16,hot:28,cold:4,humid:72,zone:"Ilıman Okyanus"},"İzmir":{sun:2900,rain:680,wind:12,hot:32,cold:8,humid:58,zone:"Akdeniz"},"Ankara":{sun:2600,rain:380,wind:14,hot:30,cold:-2,humid:55,zone:"Karasal"},"Bodrum":{sun:3100,rain:560,wind:18,hot:34,cold:10,humid:60,zone:"Akdeniz"},"Antalya":{sun:3000,rain:1060,wind:10,hot:36,cold:10,humid:62,zone:"Akdeniz"},"Konya":{sun:2700,rain:320,wind:13,hot:32,cold:-5,humid:48,zone:"Karasal"}};
const STEPS=["Proje","Alan","Stil","Malzeme","Yeşil","Sonuç"];
const TMPLS=[
  {id:"t1",n:"Minimalist Villa",i:"🏡",d:"3 katlı minimalist",data:{type:"villa",area:"350",plot:"600",floors:"3",rooms:"6",loc:"İstanbul",budget:"8M TL",style:"minimalist",mats:["Beton","Cam","Ahşap"],lights:["Doğal Işık","Gizli"],sus:["Güneş Paneli","Yeşil Çatı"],master:""}},
  {id:"t2",n:"Modern Ofis",i:"🏢",d:"Açık plan 4 katlı",data:{type:"ofis",area:"500",plot:"0",floors:"4",rooms:"8",loc:"Ankara",budget:"12M TL",style:"modern",mats:["Cam","Çelik","Alüminyum"],lights:["LED Strip","Akıllı"],sus:["Akıllı Ev","EV Şarj"],master:""}},
  {id:"t3",n:"Zen Kafe",i:"☕",d:"Japon stili minimalist",data:{type:"kafe",area:"120",plot:"150",floors:"1",rooms:"3",loc:"İstanbul",budget:"2M TL",style:"japanese",mats:["Ahşap","Bambu","Taş"],lights:["Doğal Işık","Ambiyans"],sus:["Biyofilik Tasarım"],master:"tadaoando"}},
  {id:"t4",n:"Lüks Otel",i:"🏨",d:"Akdeniz boutique",data:{type:"otel",area:"2000",plot:"3000",floors:"5",rooms:"30",loc:"Bodrum",budget:"50M TL",style:"mediterranean",mats:["Taş","Mermer","Cam"],lights:["Ambiyans","Gizli"],sus:["Güneş Paneli","Yağmur Suyu"],master:""}},
  {id:"t5",n:"Zaha Hadid Villa",i:"🌊",d:"Parametrik akışkan form",data:{type:"villa",area:"600",plot:"1200",floors:"3",rooms:"8",loc:"İstanbul",budget:"25M TL",style:"futuristic",mats:["Kompozit","Cam","Alüminyum"],lights:["Gizli","LED Strip"],sus:["Akıllı Ev","Güneş Paneli"],master:"zahahadid"}},
  {id:"t6",n:"Tadao Ando Ev",i:"⬜",d:"Saf beton & ışık",data:{type:"daire",area:"280",plot:"400",floors:"2",rooms:"5",loc:"İzmir",budget:"7M TL",style:"japanese",mats:["Beton","Cam"],lights:["Doğal Işık"],sus:["Biyofilik Tasarım","Yüksek Yalıtım"],master:"tadaoando"}},
];

const RTABS=["📐 Konsept","🏗️ Kat Planı","🎨 Moodboard","🏛️ 3D","🎬 Animasyon","🏙️ Cephe","✂️ Kesit","🌳 Peyzaj","🔥 Yangın","📏 Teknik","♿ Erişim","🖼️ Render","💰 Maliyet","✨ Varyasyon","☀️ Güneş","🛋️ Mobilya","🌍 Deprem","🔀 Alternatif","🔍 Eleştiri","📅 Takvim","📈 ROI","💬 Müzakere","🏛️ Mimar Stili","🔋 Enerji","🌿 Karbon","🏗️ BIM","🌆 Şehir","🏆 Yarışma","🌡️ İklim","📐 Parametrik","🤖 Chat"];
const TAB_GROUPS=[{name:"Çizimler",tabs:[0,1,2,3,4,5,6,7,8,9,10,11]},{name:"Analiz",tabs:[12,14,15,16,23,24,25,26,28]},{name:"AI & Maliyet",tabs:[13,17,18,19,20,21,22,27,29,30]}];

const calcCost=(area,mats,loc)=>{const bm=mats?.length?mats.reduce((s,m)=>s+(MCOST[m]||5000),0)/mats.length:5000;const lk=Object.keys(LMUL).find(k=>(loc||"").toLowerCase().includes(k));const lm=lk?LMUL[lk]:1;return{min:Math.round(area*bm*lm*.85),max:Math.round(area*bm*lm*1.15),per:Math.round(bm*lm)};};

// ── ARCHITECT STYLE ENGINE ──
function ArchMasterEngine({data,res}){
  const [sel,setSel]=useState(data.master||"");
  const [r,setR]=useState(null),[load,setLoad]=useState(false);
  const master=ARCH_MASTERS.find(m=>m.id===sel);
  const [err,setErr]=useState<string|null>(null);
  const gen=async()=>{
    if(!sel)return;setLoad(true);setErr(null);
    const out=await anthropicChat([{role:"user",content:`${master?.l} mimarının tasarım felsefesi ve yaklaşımıyla ${data.type} ${data.area}m² için özel tasarım analizi. SADECE JSON: {"konsept":"200 kelime Türkçe ${master?.l} stiliyle konsept","imzaUnsurlar":["unsur1","unsur2","unsur3","unsur4"],"mjPrompt":"100 kelime İngilizce ${master?.l} architectural style render prompt","renk":"renk yaklaşımı açıklaması","form":"form yaklaşımı","malzeme":"malzeme yaklaşımı"}`}],{max_tokens:800});
    if(out.ok) setR(parseJsonSafe(out.data,{})); else setErr(out.error);
    setLoad(false);
  };
  const pal=PALETTES[master?.id]||PALETTES[data.style]||PALETTES.modern;
  return(<div>
    <p style={{color:sub,fontSize:11,marginBottom:12}}>🏛️ Ünlü mimar stiliyle tasarım üret</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:9,marginBottom:14}}>
      {ARCH_MASTERS.map(m=><div key={m.id} onClick={()=>setSel(s=>s===m.id?"":m.id)} style={{background:sel===m.id?"linear-gradient(135deg,#181a2e,#1d1f3a)":card,border:`1px solid ${sel===m.id?gold:brd}`,borderRadius:11,padding:12,cursor:"pointer",transition:"all .2s"}}>
        <div style={{fontSize:24,marginBottom:5}}>{m.i}</div>
        <div style={{color:sel===m.id?goldL:txt,fontWeight:700,fontSize:12,marginBottom:2}}>{m.l}</div>
        <div style={{color:sub,fontSize:10,lineHeight:1.5}}>{m.d}</div>
        {sel===m.id&&<div style={{display:"flex",gap:3,marginTop:8}}>{(PALETTES[m.id]?.c||[]).slice(0,4).map((c,i)=><div key={i} style={{flex:1,height:5,borderRadius:2,background:c}}/>)}</div>}
      </div>)}
    </div>
    {err&&<div style={{padding:10,borderRadius:8,background:"#1a0808",border:"1px solid #ff4444",color:"#ff8888",fontSize:12,marginBottom:10}}>{err}</div>}
    {sel&&<div style={{marginBottom:12}}>
      <button onClick={gen} disabled={load} style={{width:"100%",padding:12,borderRadius:10,background:load?"#1c1f33":`linear-gradient(135deg,${gold},#b8892a)`,color:load?sub:"#080810",fontWeight:700,fontSize:13,border:"none",cursor:"pointer"}}>{load?`⏳ ${master?.l} stili analiz ediliyor...`:`🎨 ${master?.l} Stiliyle Analiz Et`}</button>
    </div>}
    {r&&<div>
      <div style={{padding:14,background:"#0a0c14",borderRadius:10,border:`1px solid ${brd}`,marginBottom:10}}>
        <p style={{color:goldL,fontWeight:700,fontSize:11,marginBottom:8}}>✦ {master?.l} Mimari Konsept</p>
        <p style={{color:txt,fontSize:12,lineHeight:1.8,margin:0}}>{r.konsept}</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
        {[{l:"Form",v:r.form},{l:"Malzeme",v:r.malzeme},{l:"Renk",v:r.renk}].map(({l,v})=><div key={l} style={{background:"#0a0c14",borderRadius:8,padding:10,border:`1px solid ${brd}`}}><div style={{color:goldL,fontSize:10,fontWeight:700,marginBottom:4}}>{l}</div><div style={{color:txt,fontSize:10,lineHeight:1.6}}>{v}</div></div>)}
      </div>
      <div style={{padding:12,background:"#0a0c14",borderRadius:10,border:`1px solid ${brd}`,marginBottom:10}}>
        <p style={{color:"#4a9aff",fontWeight:700,fontSize:11,marginBottom:8}}>✦ İmza Unsurları</p>
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{r.imzaUnsurlar?.map((u,i)=><span key={i} style={{padding:"5px 12px",borderRadius:20,background:pal.c[i%pal.c.length]+"22",color:pal.c[i%pal.c.length],border:`1px solid ${pal.c[i%pal.c.length]}44`,fontSize:11}}>{u}</span>)}</div>
      </div>
      <div style={{background:"#07080d",borderRadius:8,padding:12,border:`1px solid ${brd}`}}>
        <p style={{color:gold,fontSize:10,fontWeight:700,marginBottom:5}}>🖼️ MIDJOURNEY PROMPT</p>
        <p style={{color:txt,fontSize:11,lineHeight:1.7,margin:0}}>{r.mjPrompt}</p>
      </div>
    </div>}
  </div>);
}

// ── ENERGY SIMULATION ──
function EnergySimulation({data}){
  const area=parseInt(data.area)||100,floors=parseInt(data.floors)||3;
  const basekWh=area*100;
  const susReduction=data.sus?.reduce((s,x)=>s+(ENERGY_MAT[x]||0),0)||0;
  const matBonus=data.mats?.includes("Cam")?8:0;
  const finalkWh=Math.round(basekWh*(1+(susReduction+matBonus)/100));
  const m2kWh=Math.round(finalkWh/area);
  const grade=m2kWh<50?"A+":m2kWh<75?"A":m2kWh<100?"B":m2kWh<150?"C":m2kWh<200?"D":m2kWh<250?"E":"F";
  const gradeColor={"A+":"#00e676","A":"#4caf80","B":"#8bc34a","C":"#ffd600","D":"#ffa500","E":"#ff7043","F":"#f44336"}[grade];
  const monthData=["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"].map((m,i)=>{
    const seasonal=[1.4,1.3,1.1,.9,.7,.8,1.0,1.1,.8,.9,1.2,1.3][i];
    return{ay:m,tüketim:Math.round(finalkWh/12*seasonal/1000),üretim:data.sus?.includes("Güneş Paneli")?Math.round(area*0.12*[.6,.7,.9,1.1,1.2,1.3,1.3,1.2,1.0,.8,.6,.5][i]):0};
  });
  const GRADES=["A+","A","B","C","D","E","F"];
  return(<div>
    <div style={{display:"flex",gap:14,marginBottom:16,alignItems:"center"}}>
      <div style={{width:80,height:80,borderRadius:12,background:gradeColor+"22",border:`3px solid ${gradeColor}`,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",flexShrink:0}}>
        <span style={{color:gradeColor,fontSize:30,fontWeight:900}}>{grade}</span>
        <span style={{color:sub,fontSize:9}}>EKB Sınıfı</span>
      </div>
      <div>
        <div style={{color:goldL,fontWeight:700,fontSize:14,marginBottom:4}}>Enerji Kimlik Belgesi</div>
        <div style={{color:txt,fontSize:12,marginBottom:2}}>Yıllık: <span style={{color:gradeColor,fontWeight:700}}>{finalkWh.toLocaleString()} kWh</span></div>
        <div style={{color:sub,fontSize:11}}>m² başına: {m2kWh} kWh/m²·yıl</div>
      </div>
    </div>
    <div style={{marginBottom:14}}>
      {GRADES.map(g=>{const gc={"A+":"#00e676","A":"#4caf80","B":"#8bc34a","C":"#ffd600","D":"#ffa500","E":"#ff7043","F":"#f44336"}[g];const w={"A+":25,"A":35,"B":50,"C":65,"D":78,"E":88,"F":100}[g];return(<div key={g} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
        <span style={{color:gc,fontSize:11,fontWeight:700,width:18}}>{g}</span>
        <div style={{flex:1,height:16,background:"#0a0c14",borderRadius:4,overflow:"hidden",position:"relative"}}>
          <div style={{width:`${w}%`,height:"100%",background:gc,opacity:.7,borderRadius:4}}/>
          {g===grade&&<div style={{position:"absolute",top:0,left:0,right:0,bottom:0,border:`2px solid ${gc}`,borderRadius:4}}/>}
        </div>
        {g===grade&&<span style={{color:gc,fontSize:9,fontWeight:700}}>← Projeniz</span>}
      </div>);})}
    </div>
    <div style={{height:130}}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={monthData}><XAxis dataKey="ay" tick={{fill:sub,fontSize:8}}/><YAxis tick={{fill:sub,fontSize:8}}/><Tooltip contentStyle={{background:"#10121c",border:`1px solid ${brd}`,color:txt,fontSize:10}} formatter={v=>`${v} MWh`}/><Bar dataKey="tüketim" fill="#ff7043" name="Tüketim" radius={[2,2,0,0]}/>{data.sus?.includes("Güneş Paneli")&&<Bar dataKey="üretim" fill="#4caf80" name="Üretim" radius={[2,2,0,0]}/>}</BarChart>
      </ResponsiveContainer>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginTop:10}}>
      {[{l:"CO₂/Yıl",v:`${Math.round(finalkWh*0.42/1000)}t`},{l:"Tasarruf",v:`%${Math.abs(susReduction)}`},{l:"Geri Dönüş",v:data.sus?.includes("Güneş Paneli")?"~8 yıl":"—"}].map(({l,v})=><div key={l} style={{textAlign:"center",padding:9,background:"#0a0c14",borderRadius:8,border:`1px solid ${brd}`}}><div style={{color:goldL,fontWeight:700,fontSize:13}}>{v}</div><div style={{color:sub,fontSize:9,marginTop:2}}>{l}</div></div>)}
    </div>
  </div>);
}

// ── CARBON FOOTPRINT ──
function CarbonCalc({data}){
  const area=parseInt(data.area)||100;
  const matCO2=data.mats?.map(m=>({m,co2:Math.round(area*(CO2_MAT[m]||200)/1000*10)/10}))||[];
  const total=matCO2.reduce((s,x)=>s+x.co2,0);
  const trees=Math.ceil(Math.abs(total)*10/21);
  const offsetYears=Math.ceil(Math.abs(total)/2.1);
  const COLORS=["#ff7043","#ffa500","#ffd600","#4caf80","#26c6da","#7b68ee","#ff4081","#00e676","#ff6d00","#40c4ff","#b2ff59","#ea80fc"];
  const isNegative=total<0;
  return(<div>
    <div style={{display:"flex",gap:12,marginBottom:14,alignItems:"center",padding:14,background:isNegative?"#0a1a0a":"#1a0a0a",borderRadius:10,border:`1px solid ${isNegative?"#2a4a2a":"#4a2a2a"}`}}>
      <div style={{textAlign:"center",flexShrink:0}}>
        <div style={{color:isNegative?"#4caf80":"#ff7043",fontSize:22,fontWeight:900}}>{total>0?"+":""}{total.toFixed(1)}t</div>
        <div style={{color:sub,fontSize:9}}>CO₂ eqv.</div>
      </div>
      <div>
        <div style={{color:isNegative?"#4caf80":"#ff7043",fontWeight:700,fontSize:12,marginBottom:3}}>{isNegative?"🌿 Karbon Negatif Bina!":"⚠️ Karbon Emisyonu"}</div>
        <div style={{color:sub,fontSize:11}}>{isNegative?`${trees} ağaç değeri karbon bağlıyor`:`${trees} ağaç ${offsetYears} yılda dengeleyebilir`}</div>
      </div>
    </div>
    {matCO2.length>0&&<>
      <p style={{color:goldL,fontWeight:700,fontSize:11,marginBottom:8}}>🧱 Malzeme Bazında CO₂</p>
      {matCO2.map(({m,co2},i)=><div key={m} style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
        <span style={{color:txt,fontSize:11,width:80,flexShrink:0}}>{m}</span>
        <div style={{flex:1,height:8,background:"#0a0c14",borderRadius:4}}>
          <div style={{width:`${Math.min(100,Math.abs(co2)/Math.max(...matCO2.map(x=>Math.abs(x.co2)))*100)}%`,height:"100%",background:co2<0?"#4caf80":COLORS[i%COLORS.length],borderRadius:4}}/>
        </div>
        <span style={{color:co2<0?"#4caf80":"#ff7043",fontSize:11,fontWeight:700,width:50,textAlign:"right"}}>{co2>0?"+":""}{co2}t</span>
      </div>)}
      <div style={{height:120,marginTop:10}}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={matCO2.map(x=>({name:x.m.slice(0,5),co2:x.co2}))}>
            <XAxis dataKey="name" tick={{fill:sub,fontSize:8}}/><YAxis tick={{fill:sub,fontSize:8}}/>
            <Tooltip contentStyle={{background:"#10121c",border:`1px solid ${brd}`,color:txt,fontSize:10}} formatter={v=>`${v}t CO₂`}/>
            <Bar dataKey="co2" radius={[3,3,0,0]}>{matCO2.map((x,i)=><Cell key={i} fill={x.co2<0?"#4caf80":"#ff7043"}/>)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>}
    <div style={{marginTop:10,padding:12,background:"#0a0c14",borderRadius:8,border:`1px solid ${brd}`}}>
      <p style={{color:goldL,fontSize:11,fontWeight:700,marginBottom:8}}>🌿 Karbon Azaltma Önerileri</p>
      {[["Ahşap veya Bambu","-200 ila -400t"],["Güneş Paneli","Operasyonel sıfırlanma"],["Sürd. Malzeme","+80% daha az emisyon"],["Yeşil Çatı","Kentsel ısı adası azaltma"]].map(([l,v])=><div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:5,fontSize:11}}><span style={{color:txt}}>{l}</span><span style={{color:"#4caf80",fontWeight:700}}>{v}</span></div>)}
    </div>
  </div>);
}

// ── BIM LITE ──
function BIMLite({data}){
  const rooms=parseInt(data.rooms)||4,area=parseInt(data.area)||100,floors=parseInt(data.floors)||3;
  const W=500,H=340,M=30,cols=Math.ceil(Math.sqrt(rooms)),rW=(W-M*2)/cols,rH=(H-M*2)/Math.ceil(rooms/cols);
  const axisSpan=Math.round(rW/50)*50||200;
  const colPositions=[];
  for(let c=0;c<=cols;c++)for(let r=0;r<=Math.ceil(rooms/cols);r++)colPositions.push({x:M+c*rW,y:M+r*rH});
  return(<div>
    <p style={{color:sub,fontSize:11,marginBottom:8}}>🏗️ BIM Lite — Yapısal Aks & Kolon Sistemi</p>
    <svg width="100%" viewBox={`0 0 ${W} ${H+40}`} style={{background:"#050810",borderRadius:10,border:`1px solid ${brd}`}}>
      {/* Grid aks lines */}
      {Array.from({length:cols+1},(_,i)=><g key={`v${i}`}><line x1={M+i*rW} y1={M-20} x2={M+i*rW} y2={H-M+10} stroke="#1a2a4a" strokeWidth={1} strokeDasharray="4,4"/><text x={M+i*rW} y={M-8} textAnchor="middle" fill="#4a9aff" fontSize={9} fontWeight="700">{String.fromCharCode(65+i)}</text></g>)}
      {Array.from({length:Math.ceil(rooms/cols)+1},(_,i)=><g key={`h${i}`}><line x1={M-20} y1={M+i*rH} x2={W-M+10} y2={M+i*rH} stroke="#1a2a4a" strokeWidth={1} strokeDasharray="4,4"/><text x={M-8} y={M+i*rH+4} textAnchor="middle" fill="#4a9aff" fontSize={9} fontWeight="700">{i+1}</text></g>)}
      {/* Rooms */}
      {Array.from({length:rooms},(_,i)=>{const rx=M+(i%cols)*rW,ry=M+Math.floor(i/cols)*rH;const rList=(RMAP[data.type]||[]);return(<g key={i}><rect x={rx+1} y={ry+1} width={rW-2} height={rH-2} fill="#0a0e1a" stroke="#2a3a5a" strokeWidth={.8}/><text x={rx+rW/2} y={ry+rH/2-5} textAnchor="middle" fill="#6a8ab0" fontSize={9}>{rList[i]||`Oda ${i+1}`}</text><text x={rx+rW/2} y={ry+rH/2+8} textAnchor="middle" fill={sub} fontSize={8}>{Math.round(area/rooms)}m²</text></g>);})}
      {/* Columns */}
      {colPositions.map((p,i)=><g key={i}><rect x={p.x-6} y={p.y-6} width={12} height={12} fill="#4a9aff" opacity={.9} rx={1}/><rect x={p.x-5} y={p.y-5} width={10} height={10} fill="none" stroke="#fff" strokeWidth={.5} rx={1}/></g>)}
      {/* Beams */}
      {Array.from({length:cols+1},(_,c)=>Array.from({length:Math.ceil(rooms/cols)},(_,r)=><line key={`b${c}${r}`} x1={M+c*rW} y1={M+r*rH} x2={M+c*rW} y2={M+(r+1)*rH} stroke="#2a5a8a" strokeWidth={2} opacity={.6}/>)).flat()}
      {Array.from({length:Math.ceil(rooms/cols)+1},(_,r)=>Array.from({length:cols},(_,c)=><line key={`kb${r}${c}`} x1={M+c*rW} y1={M+r*rH} x2={M+(c+1)*rW} y2={M+r*rH} stroke="#2a5a8a" strokeWidth={2} opacity={.6}/>)).flat()}
      {/* Legend */}
      <g transform={`translate(10,${H-4})`}><rect x={0} y={-8} width={10} height={10} fill="#4a9aff" rx={1}/><text x={13} y={2} fill={sub} fontSize={8}>Kolon</text><line x1={60} y1={-3} x2={90} y2={-3} stroke="#2a5a8a" strokeWidth={2}/><text x={93} y={2} fill={sub} fontSize={8}>Kiriş</text><line x1={140} y1={-3} x2={170} y2={-3} stroke="#1a2a4a" strokeWidth={1} strokeDasharray="3,2"/><text x={173} y={2} fill={sub} fontSize={8}>Aks</text></g>
      <text x={W/2} y={H+22} textAnchor="middle" fill={sub} fontSize={8}>Aks Aralığı: ~{axisSpan}cm · {colPositions.length} Kolon · {floors} Kat</text>
    </svg>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7,marginTop:10}}>
      {[{l:"Kolon",v:`${colPositions.length} adet`},{l:"Aks Aralığı",v:`~${Math.round(rW/10*0.4)}m`},{l:"Sistem",v:floors>6?"Perdeli B.A.":"Çerçeve B.A."},{l:"Döşeme",v:"Asmolen"}].map(({l,v})=><div key={l} style={{textAlign:"center",padding:8,background:"#0a0c14",borderRadius:8,border:`1px solid ${brd}`}}><div style={{color:goldL,fontWeight:700,fontSize:11}}>{v}</div><div style={{color:sub,fontSize:9,marginTop:2}}>{l}</div></div>)}
    </div>
  </div>);
}

// ── URBAN PLANNING ──
function UrbanPlanning({data}){
  const [blocks,setBlocks]=useState(()=>Array.from({length:12},(_,i)=>({id:i,type:["konut","ofis","yeşil","ticari","park","okul"][i%6],x:60+(i%4)*110,y:60+Math.floor(i/4)*100,w:80+Math.random()*40|0,h:60+Math.random()*30|0})));
  const [sel,setSel]=useState(null);
  const typeColors={konut:"#4a6aaa",ofis:"#7a5aaa",yeşil:"#2a6a2a",ticari:"#aa6a2a",park:"#2a8a4a",okul:"#aa4a4a"};
  const area=parseInt(data.area)||1000;
  const density=Math.round(area*0.6/5000);
  return(<div>
    <p style={{color:sub,fontSize:11,marginBottom:8}}>🌆 Şehir Ölçeği Planlama · Tıkla → Blok seç</p>
    <svg width="100%" viewBox="0 0 500 370" style={{background:"#050a05",borderRadius:10,border:`1px solid ${brd}`,cursor:"default"}}>
      {/* Roads */}
      {[110,220,330].map(x=><rect key={`vr${x}`} x={x} y={0} width={12} height={370} fill="#101418"/>)}
      {[100,200,300].map(y=><rect key={`hr${y}`} x={0} y={y} width={500} height={12} fill="#101418"/>)}
      {/* Blocks */}
      {blocks.map(b=><g key={b.id} onClick={()=>setSel(s=>s===b.id?null:b.id)} style={{cursor:"pointer"}}>
        <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={typeColors[b.type]} opacity={sel===b.id?.9:.6} rx={3} stroke={sel===b.id?gold:"none"} strokeWidth={sel===b.id?2:0}/>
        <text x={b.x+b.w/2} y={b.y+b.h/2+4} textAnchor="middle" fill="#fff" fontSize={8} fontWeight="600">{b.type}</text>
      </g>)}
      {/* Project building */}
      <rect x={195} y={95} width={90} height={80} fill={gold} opacity={.8} rx={4} stroke={goldL} strokeWidth={2}/>
      <text x={240} y={132} textAnchor="middle" fill="#080810" fontSize={10} fontWeight="900">Proje</text>
      <text x={240} y={146} textAnchor="middle" fill="#080810" fontSize={8}>{data.area}m²</text>
      {/* Stats */}
      <rect x={10} y={10} width={120} height={72} fill="#07080d" opacity={.9} rx={5}/>
      <text x={18} y={26} fill={goldL} fontSize={9} fontWeight="700">Yoğunluk: {density} kat</text>
      <text x={18} y={40} fill={sub} fontSize={8}>Konut: %40</text>
      <text x={18} y={52} fill={sub} fontSize={8}>Yeşil: %25</text>
      <text x={18} y={64} fill={sub} fontSize={8}>Ticari: %20</text>
      <text x={18} y={76} fill={sub} fontSize={8}>Diğer: %15</text>
      {/* Legend */}
      <g transform="translate(10,330)">{Object.entries(typeColors).map(([k,c],i)=><g key={k} transform={`translate(${i*80},0)`}><rect x={0} y={-8} width={10} height={10} fill={c} rx={1}/><text x={13} y={2} fill={sub} fontSize={7}>{k}</text></g>)}</g>
    </svg>
    {sel!==null&&<div style={{marginTop:8,padding:10,background:"#0a0c14",borderRadius:8,border:`1px solid ${brd}`}}><span style={{color:goldL,fontSize:11,fontWeight:700}}>Seçili: </span><span style={{color:txt,fontSize:11}}>{blocks[sel]?.type} bloğu — {blocks[sel]?.w}×{blocks[sel]?.h}m ≈ {Math.round(blocks[sel]?.w*blocks[sel]?.h/100)*100}m²</span></div>}
  </div>);
}

// ── COMPETITION GENERATOR ──
function CompetitionGen({data}){
  const [theme,setTheme]=useState(""),[r,setR]=useState(null),[load,setLoad]=useState(false);
  const themes=["Sürdürülebilir Gelecek","Akıllı Şehir","Doğa ile Uyum","Kültürel Miras","Sıfır Karbon","İnsan Ölçeği"];
  const [err,setErr]=useState<string|null>(null);
  const gen=async()=>{
    if(!theme)return;setLoad(true);setErr(null);
    const out=await anthropicChat([{role:"user",content:`Mimari yarışma projesi. Tema: "${theme}". Proje: ${data.type} ${data.area}m² ${data.style}. SADECE JSON: {"baslik":"etkileyici yarışma projesi başlığı","slogan":"güçlü bir slogan","konsept":"250 kelime Türkçe yarışma konsepti","inovasyon":["yenilik1","yenilik2","yenilik3"],"juri":"200 kelime jüriye hitap eden özet","mjPrompt":"100 kelime İngilizce competition architectural render prompt","puan":92}`}],{max_tokens:900});
    if(out.ok) setR(parseJsonSafe(out.data,{})); else setErr(out.error);
    setLoad(false);
  };
  return(<div>
    <p style={{color:sub,fontSize:11,marginBottom:12}}>🏆 Mimari Yarışma Projesi Üretici</p>
    <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:12}}>{themes.map(t=><button key={t} onClick={()=>setTheme(s=>s===t?"":t)} style={{padding:"7px 13px",borderRadius:20,fontSize:11,fontWeight:600,cursor:"pointer",background:theme===t?`linear-gradient(135deg,${gold},#b8892a)`:card,color:theme===t?"#080810":sub,border:`1px solid ${theme===t?gold:brd}`}}>{t}</button>)}</div>
    <input value={theme} onChange={e=>setTheme(e.target.value)} placeholder="Ya da kendi temanızı yazın..." style={{width:"100%",background:"#0a0c14",border:`1px solid ${brd}`,borderRadius:8,color:txt,padding:"9px 12px",fontSize:12,outline:"none",marginBottom:12}}/>
    {err&&<div style={{padding:10,borderRadius:8,background:"#1a0808",border:"1px solid #ff4444",color:"#ff8888",fontSize:12,marginBottom:10}}>{err}</div>}
    <button onClick={gen} disabled={!theme||load} style={{width:"100%",padding:12,borderRadius:10,background:!theme||load?"#1c1f33":`linear-gradient(135deg,${gold},#b8892a)`,color:!theme||load?sub:"#080810",fontWeight:700,fontSize:13,border:"none",cursor:!theme||load?"not-allowed":"pointer",marginBottom:14}}>{load?"⏳ Yarışma projesi üretiliyor...":"🏆 Yarışma Projesi Üret"}</button>
    {r&&<div>
      <div style={{padding:16,background:"linear-gradient(135deg,#1a1408,#0a0c14)",borderRadius:12,border:`2px solid ${gold}`,marginBottom:12,textAlign:"center"}}>
        <div style={{color:goldL,fontSize:20,fontWeight:900,marginBottom:4}}>{r.baslik}</div>
        <div style={{color:gold,fontSize:13,fontStyle:"italic"}}>"{r.slogan}"</div>
        <div style={{display:"inline-block",marginTop:8,padding:"4px 14px",borderRadius:20,background:"#4caf8022",color:"#4caf80",border:"1px solid #4caf8044",fontSize:11,fontWeight:700}}>Tahmini Puan: {r.puan}/100</div>
      </div>
      <div style={{padding:12,background:"#0a0c14",borderRadius:10,border:`1px solid ${brd}`,marginBottom:10}}><p style={{color:goldL,fontWeight:700,fontSize:11,marginBottom:7}}>📐 Konsept</p><p style={{color:txt,fontSize:12,lineHeight:1.8,margin:0}}>{r.konsept}</p></div>
      <div style={{padding:12,background:"#0a0c14",borderRadius:10,border:`1px solid ${brd}`,marginBottom:10}}><p style={{color:"#7b68ee",fontWeight:700,fontSize:11,marginBottom:7}}>⚡ İnovasyon Unsurları</p>{r.inovasyon?.map((x,i)=><div key={i} style={{color:txt,fontSize:11,marginBottom:5}}>→ {x}</div>)}</div>
      <div style={{padding:12,background:"#0a0c14",borderRadius:10,border:`1px solid ${brd}`,marginBottom:10}}><p style={{color:"#4caf80",fontWeight:700,fontSize:11,marginBottom:7}}>🎯 Jüri Özeti</p><p style={{color:txt,fontSize:12,lineHeight:1.8,margin:0}}>{r.juri}</p></div>
      <div style={{background:"#07080d",borderRadius:8,padding:12,border:`1px solid ${brd}`}}><p style={{color:gold,fontSize:10,fontWeight:700,marginBottom:5}}>🖼️ MIDJOURNEY PROMPT</p><p style={{color:txt,fontSize:11,lineHeight:1.7,margin:0}}>{r.mjPrompt}</p></div>
    </div>}
  </div>);
}

// ── CLIMATE ANALYSIS ──
function ClimateAnalysis({data}){
  const [city,setCity]=useState(()=>Object.keys(CLIMATE_CITIES).find(c=>(data.loc||"").toLowerCase().includes(c.toLowerCase()))||"İstanbul");
  const cl=CLIMATE_CITIES[city];
  const monthSun=[5,6,8,10,12,14,14,13,10,7,5,4].map((h,i)=>({ay:["O","Ş","M","N","M","H","T","A","E","E","K","A"][i],güneş:h,yağış:[70,60,65,45,35,15,10,8,40,70,90,110][i]}));
  const radarData=[{k:"Güneş",v:Math.round(cl.sun/35)},{k:"Yağış",v:Math.round(cl.rain/10)},{k:"Sıcaklık",v:Math.round(cl.hot*2)},{k:"Rüzgar",v:cl.wind*3},{k:"Nem",v:cl.humid}];
  const recs=[
    {l:"Bina Yönü",v:cl.sun>2800?"Kuzey-güney ekseninde":"Güneye yönelik"},
    {l:"Güneş Koruması",v:cl.sun>2700?"Saçak & güneş kırıcı zorunlu":"Önerilir"},
    {l:"Havalandırma",v:cl.wind>15?"Çapraz havalandırma ideal":"Mekanik destekli"},
    {l:"Yalıtım",v:cl.cold<0?"Güçlü ısı yalıtımı zorunlu":"Standart yeterli"},
    {l:"Nem Kontrolü",v:cl.humid>65?"Buhar kesici + havalandırma":"Standart"},
  ];
  return(<div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
      <div><label style={{color:sub,fontSize:11,display:"block",marginBottom:4}}>📍 Şehir</label><select value={city} onChange={e=>setCity(e.target.value)} style={{width:"100%",background:"#0a0c14",border:`1px solid ${brd}`,borderRadius:8,color:txt,padding:"9px 12px",fontSize:12,outline:"none"}}>{Object.keys(CLIMATE_CITIES).map(c=><option key={c}>{c}</option>)}</select></div>
      <div style={{padding:10,background:"#0a0c14",borderRadius:8,border:`1px solid ${brd}`}}><div style={{color:goldL,fontWeight:700,fontSize:11}}>{cl.zone}</div><div style={{color:sub,fontSize:10,marginTop:2}}>İklim Bölgesi</div></div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7,marginBottom:14}}>
      {[{l:"Güneş",v:`${cl.sun}sa/yıl`,i:"☀️"},{l:"Yağış",v:`${cl.rain}mm`,i:"🌧️"},{l:"Max Sıcak",v:`${cl.hot}°C`,i:"🌡️"},{l:"Min Soğuk",v:`${cl.cold}°C`,i:"❄️"}].map(({l,v,i})=><div key={l} style={{textAlign:"center",padding:9,background:"#0a0c14",borderRadius:8,border:`1px solid ${brd}`}}><div style={{fontSize:16,marginBottom:3}}>{i}</div><div style={{color:goldL,fontWeight:700,fontSize:12}}>{v}</div><div style={{color:sub,fontSize:9,marginTop:2}}>{l}</div></div>)}
    </div>
    <div style={{height:110,marginBottom:12}}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={monthSun}><XAxis dataKey="ay" tick={{fill:sub,fontSize:8}}/><YAxis yAxisId="s" tick={{fill:"#ffd600",fontSize:7}} orientation="left"/><YAxis yAxisId="r" tick={{fill:"#4a9aff",fontSize:7}} orientation="right"/><Tooltip contentStyle={{background:"#10121c",border:`1px solid ${brd}`,color:txt,fontSize:9}}/><Bar yAxisId="s" dataKey="güneş" fill="#ffd600" name="Güneş (sa)" radius={[2,2,0,0]} opacity={.7}/><Bar yAxisId="r" dataKey="yağış" fill="#4a9aff" name="Yağış (mm)" radius={[2,2,0,0]} opacity={.6}/></BarChart>
      </ResponsiveContainer>
    </div>
    <div style={{background:"#0a0c14",borderRadius:10,border:`1px solid ${brd}`,overflow:"hidden"}}>
      {recs.map(({l,v},i)=><div key={l} style={{display:"grid",gridTemplateColumns:"130px 1fr",padding:"8px 12px",borderBottom:i<recs.length-1?`1px solid ${brd}`:"none"}}><span style={{color:sub,fontSize:11}}>{l}</span><span style={{color:txt,fontSize:11}}>{v}</span></div>)}
    </div>
  </div>);
}

// ── PARAMETRIC FORMS ──
function ParametricForms({data}){
  const [forms,setForms]=useState(null),[load,setLoad]=useState(false);
  const pal=PALETTES[data.style]?.c||["#c4b89a","#888"];
  const FORM_SHAPES=["L","U","T","C","O","H","Z","S","X","Y","cross","linear","radial","cluster","spiral","tower"];
  const genSVG=(shape,i)=>{
    const c1=pal[0],c2=pal[1]||pal[0],W=90,H=70;
    const shapes={
      "L":`<rect x="10" y="10" width="45" height="10" fill="${c1}" opacity=".8"/><rect x="10" y="10" width="10" height="50" fill="${c2}" opacity=".8"/>`,
      "U":`<rect x="10" y="10" width="10" height="50" fill="${c1}" opacity=".8"/><rect x="10" y="50" width="65" height="10" fill="${c2}" opacity=".7"/><rect x="65" y="10" width="10" height="50" fill="${c1}" opacity=".8"/>`,
      "T":`<rect x="10" y="10" width="65" height="10" fill="${c1}" opacity=".8"/><rect x="35" y="10" width="10" height="50" fill="${c2}" opacity=".8"/>`,
      "H":`<rect x="10" y="10" width="10" height="50" fill="${c1}" opacity=".8"/><rect x="65" y="10" width="10" height="50" fill="${c1}" opacity=".8"/><rect x="10" y="30" width="65" height="10" fill="${c2}" opacity=".7"/>`,
      "O":`<rect x="10" y="10" width="65" height="50" fill="none" stroke="${c1}" strokeWidth="10" opacity=".8"/>`,
      "tower":`<rect x="30" y="5" width="25" height="60" fill="${c1}" opacity=".9"/><rect x="20" y="40" width="45" height="25" fill="${c2}" opacity=".7"/>`,
      "radial":`<circle cx="42" cy="35" r="10" fill="${c1}" opacity=".9"/>${Array.from({length:6},(_,i)=>`<rect x="${42+Math.cos(i*60*Math.PI/180)*18-3}" y="${35+Math.sin(i*60*Math.PI/180)*18-12}" width="8" height="20" fill="${c2}" opacity=".7" transform="rotate(${i*60},${42+Math.cos(i*60*Math.PI/180)*18},${35+Math.sin(i*60*Math.PI/180)*18})"/>`).join("")}`,
    };
    return shapes[shape]||`<rect x="${10+i*3}" y="${10+i*2}" width="${55-i*3}" height="${45-i*2}" fill="${c1}" opacity=".8" rx="${i%3*3}"/>`;
  };
  const [err,setErr]=useState<string|null>(null);
  const gen=async()=>{
    setLoad(true);setErr(null);
    const out=await anthropicChat([{role:"user",content:`${data.type} ${data.area}m² ${data.style} stili için 6 farklı parametrik form alternatifi. SADECE JSON: {"formlar":[{"isim":"form adı","sekil":"${FORM_SHAPES.slice(0,8).join("|")} bunlardan biri","avantaj":"tek cümle","maliyet":"düşük|orta|yüksek"},{"isim":"","sekil":"","avantaj":"","maliyet":""},{"isim":"","sekil":"","avantaj":"","maliyet":""},{"isim":"","sekil":"","avantaj":"","maliyet":""},{"isim":"","sekil":"","avantaj":"","maliyet":""},{"isim":"","sekil":"","avantaj":"","maliyet":""}]}`}],{max_tokens:700});
    if(out.ok){const parsed=parseJsonSafe(out.data,{formlar:[]});setForms(parsed.formlar||FORM_SHAPES.slice(0,6).map((s,i)=>({isim:`Form ${i+1}`,sekil:s,avantaj:"Yapısal verimlilik",maliyet:["düşük","orta","yüksek"][i%3]})));}else{setErr(out.error);setForms(FORM_SHAPES.slice(0,6).map((s,i)=>({isim:`Form ${i+1}`,sekil:s,avantaj:"Yapısal verimlilik",maliyet:["düşük","orta","yüksek"][i%3]})));}
    setLoad(false);
  };
  const maliyet_c={"düşük":"#4caf80","orta":"#ffa500","yüksek":"#ff7043"};
  return(<div>
    <p style={{color:sub,fontSize:11,marginBottom:12}}>📐 AI 6 parametrik form alternatifi üretir</p>
    {err&&<div style={{padding:10,borderRadius:8,background:"#1a0808",border:"1px solid #ff4444",color:"#ff8888",fontSize:12,marginBottom:10}}>{err}</div>}
    {!forms&&<button onClick={gen} disabled={load} style={{width:"100%",padding:12,borderRadius:10,background:load?"#1c1f33":`linear-gradient(135deg,${gold},#b8892a)`,color:load?sub:"#080810",fontWeight:700,fontSize:13,border:"none",cursor:"pointer",marginBottom:14}}>{load?"⏳ Formlar üretiliyor...":"📐 Parametrik Formlar Üret"}</button>}
    {forms&&<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
      {forms.map((f,i)=><div key={i} style={{background:"#0a0c14",border:`1px solid ${brd}`,borderRadius:11,padding:12}}>
        <svg width="100%" viewBox="0 0 90 70" style={{background:"#050810",borderRadius:6,marginBottom:8}} dangerouslySetInnerHTML={{__html:genSVG(f.sekil,i)}}/>
        <div style={{color:goldL,fontWeight:700,fontSize:11,marginBottom:2}}>{f.isim}</div>
        <div style={{color:sub,fontSize:9,marginBottom:5,textTransform:"capitalize"}}>Plan: {f.sekil}</div>
        <div style={{color:txt,fontSize:10,marginBottom:5}}>{f.avantaj}</div>
        <span style={{padding:"2px 8px",borderRadius:10,fontSize:9,fontWeight:700,background:maliyet_c[f.maliyet]+"22",color:maliyet_c[f.maliyet],border:`1px solid ${maliyet_c[f.maliyet]}44`}}>Maliyet: {f.maliyet}</span>
      </div>)}
    </div>}
    {forms&&<button onClick={()=>{setForms(null);gen();}} style={{width:"100%",marginTop:10,padding:9,borderRadius:8,background:card,color:sub,border:`1px solid ${brd}`,fontSize:12,cursor:"pointer"}}>🔄 Yeni Formlar Üret</button>}
  </div>);
}

// ── NLP WIZARD ──
function NLPWizard({onFill,onClose}){
  const [txt2,setTxt2]=useState(""),[load,setLoad]=useState(false);
  const examples=["İstanbul'da 300m² minimalist 3+1 villa, güneş panelli, cam cephe","Ankara'da 500m² modern ofis, açık plan, çelik-cam, 4 kat","Bodrum'da 2000m² Akdeniz oteli, mermer, 5 kat, yeşil çatı"];
  const [err,setErr]=useState<string|null>(null);
  const parse=async()=>{
    if(!txt2.trim())return;setLoad(true);setErr(null);
    const out=await anthropicChat([{role:"user",content:`Bu metinden mimari proje parametrelerini çıkar. SADECE JSON ver:\n"${txt2}"\n{"type":"daire|villa|apartman|ofis|restoran|kafe|otel|hastane|okul|avm|kultur|spor|ic|peyzaj|diger","area":"sayı","plot":"sayı","floors":"sayı","rooms":"sayı","loc":"şehir","budget":"metin","style":"modern|minimalist|brutalist|parametric|futuristic|japanese|scandinavian|mediterranean|ottoman|organic|industrial|cyberpunk","mats":["Beton","Cam","Ahşap","Taş","Çelik","Bambu","Alüminyum","Mermer","Tuğla","Seramik","Kompozit","Sürd. Malzeme"],"sus":["Güneş Paneli","Yeşil Çatı","Doğal Havalandırma","Yağmur Suyu","Yüksek Yalıtım","Akıllı Ev","EV Şarj","Biyofilik Tasarım"]}`}],{max_tokens:400});
    if(out.ok){const p=parseJsonSafe(out.data,{});onFill({...p,custom:"",lights:["Doğal Işık"],master:""});onClose();}else setErr(out.error);
    setLoad(false);
  };
  return(<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,.85)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center"}}>
    <div style={{background:card,border:`1px solid ${brd}`,borderRadius:16,padding:24,maxWidth:540,width:"90%"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h3 style={{color:goldL,fontWeight:800,fontSize:16,margin:0}}>🗣️ Doğal Dil ile Proje Oluştur</h3>
        <button onClick={onClose} style={{background:"transparent",border:"none",color:sub,cursor:"pointer",fontSize:18}}>✕</button>
      </div>
      {err&&<div style={{padding:10,borderRadius:8,background:"#1a0808",border:"1px solid #ff4444",color:"#ff8888",fontSize:12,marginBottom:10}}>{err}</div>}
      <textarea value={txt2} onChange={e=>setTxt2(e.target.value)} placeholder="Projenizi Türkçe olarak tanımlayın..." rows={4} style={{width:"100%",background:"#0a0c14",border:`1px solid ${brd}`,borderRadius:10,color:txt,padding:"12px",fontSize:13,outline:"none",resize:"vertical",marginBottom:12}}/>
      <p style={{color:sub,fontSize:10,marginBottom:10}}>Örnek:</p>
      {examples.map((e,i)=><button key={i} onClick={()=>setTxt2(e)} style={{display:"block",width:"100%",padding:"7px 12px",marginBottom:5,background:"#0a0c14",border:`1px solid ${brd}`,borderRadius:7,color:sub,fontSize:10,cursor:"pointer",textAlign:"left"}}>{e}</button>)}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:12}}>
        <button onClick={onClose} style={{padding:"10px",borderRadius:8,background:"transparent",color:sub,border:`1px solid ${brd}`,cursor:"pointer"}}>İptal</button>
        <button onClick={parse} disabled={!txt2.trim()||load} style={{padding:"10px",borderRadius:8,background:!txt2.trim()||load?"#1c1f33":`linear-gradient(135deg,${gold},#b8892a)`,color:!txt2.trim()||load?sub:"#080810",fontWeight:700,border:"none",cursor:"pointer"}}>{load?"⏳ Analiz ediliyor...":"🚀 Wizard'ı Doldur"}</button>
      </div>
    </div>
  </div>);
}

// ── FLOOR PLAN ──
function FloorPlan({data,res,bp}){
  const rooms=parseInt(data.rooms)||4,area=parseInt(data.area)||100;
  const rList=(RMAP[data.type]||Array.from({length:rooms},(_,i)=>`Alan ${i+1}`));
  const W=500,H=360,M=28,cols=Math.ceil(Math.sqrt(rooms)),rW=(W-M*2)/cols,rH=(H-M*2)/Math.ceil(rooms/cols);
  const fc=bp?"#001428":card,rc=bp?"#002040":"#1a2535",lc=bp?"#4a9aff":gold;
  return(<div>
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{background:bp?"#001020":"#07080d",borderRadius:10,border:`1px solid ${bp?"#1a3a5c":brd}`}}>
      <rect x={M-5} y={M-5} width={W-M*2+10} height={H-M*2+10} fill="none" stroke={lc} strokeWidth={bp?1.5:2} rx={4}/>
      {Array.from({length:rooms},(_,i)=>{const rx=M+(i%cols)*rW,ry=M+Math.floor(i/cols)*rH;return(<g key={i}>
        <rect x={rx+2} y={ry+2} width={rW-8} height={rH-8} fill={rc} stroke={lc} strokeWidth={bp?.6:1} rx={3}/>
        <line x1={rx+rW*.3} y1={ry+6} x2={rx+rW*.7} y2={ry+6} stroke={bp?"#4a9aff":"#4a9aff"} strokeWidth={3} opacity={.8}/>
        <path d={`M${rx+rW/2-10},${ry+rH-10} Q${rx+rW/2},${ry+rH-22} ${rx+rW/2+10},${ry+rH-10}`} fill="none" stroke={lc} strokeWidth={1} opacity={.7}/>
        <text x={rx+rW/2} y={ry+rH/2-4} textAnchor="middle" fill={bp?"#90c0ff":goldL} fontSize={10} fontWeight="700">{rList[i]||`Oda ${i+1}`}</text>
        <text x={rx+rW/2} y={ry+rH/2+10} textAnchor="middle" fill={bp?"#4a7aaa":sub} fontSize={9}>{Math.round(area/rooms)}m²</text>
      </g>);})}
      <g transform={`translate(${W-44},${H-44})`}><circle cx={0} cy={0} r={16} fill={bp?"#001428":"#0a0c14"} stroke={bp?"#1a3a5c":brd}/><text x={0} y={-4} textAnchor="middle" fill={lc} fontSize={10} fontWeight="900">N</text><line x1={0} y1={-12} x2={0} y2={12} stroke={lc} strokeWidth={1} opacity={.5}/><line x1={-12} y1={0} x2={12} y2={0} stroke={lc} strokeWidth={1} opacity={.5}/></g>
    </svg>
    {res?.odaYerlesimi&&<div style={{marginTop:8,padding:12,background:"#0a0c14",borderRadius:8,border:`1px solid ${brd}`}}><p style={{color:sub,fontSize:11,lineHeight:1.8,margin:0}}>{res.odaYerlesimi}</p></div>}
  </div>);
}

// ── MINI COMPONENTS (condensed) ──
function Moodboard({data}){
  const pal=PALETTES[data.style]||PALETTES.modern;
  const tx={"Beton":"██","Ahşap":"▓▓","Taş":"▒▒","Cam":"░░","Çelik":"══","Bambu":"╫╫","Mermer":"≋≋","Tuğla":"▦▦"};
  return(<div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
      <div style={{background:"#0a0c14",borderRadius:10,padding:12,border:`1px solid ${brd}`}}><p style={{color:goldL,fontSize:11,fontWeight:700,marginBottom:8}}>🎨 Renk Paleti</p><div style={{display:"flex",gap:4,marginBottom:6}}>{pal.c.map((c,i)=><div key={i} style={{flex:1,height:52,borderRadius:6,background:c}}/>)}</div><p style={{color:sub,fontSize:10,margin:0}}>{pal.d}</p></div>
      <div style={{background:"#0a0c14",borderRadius:10,padding:12,border:`1px solid ${brd}`}}><p style={{color:goldL,fontSize:11,fontWeight:700,marginBottom:8}}>🏛️ Atmosfer</p><div style={{height:52,borderRadius:6,background:`linear-gradient(135deg,${pal.c[0]},${pal.c[2]||pal.c[0]})`,marginBottom:6}}/><p style={{color:txt,fontSize:13,fontWeight:700,margin:0}}>{STYLES.find(s=>s.id===data.style)?.l}</p></div>
    </div>
    {data.mats?.length>0&&<div style={{background:"#0a0c14",borderRadius:10,padding:12,border:`1px solid ${brd}`}}><p style={{color:goldL,fontSize:11,fontWeight:700,marginBottom:8}}>🧱 Dokular</p><div style={{display:"flex",flexWrap:"wrap",gap:7}}>{data.mats.map((m,i)=><div key={i} style={{padding:"7px 12px",background:pal.c[i%pal.c.length]+"33",border:`1px solid ${pal.c[i%pal.c.length]}55`,borderRadius:8,textAlign:"center"}}><div style={{fontFamily:"monospace",fontSize:14,color:pal.c[i%pal.c.length]}}>{tx[m]||"◼◼"}</div><div style={{color:txt,fontSize:10,marginTop:2,fontWeight:600}}>{m}</div></div>)}</div></div>}
  </div>);
}

function Building3D({data}){
  const mRef=useRef(null);
  useEffect(()=>{
    const el=mRef.current;if(!el)return;
    const W=el.clientWidth||520,H=280,scene=new THREE.Scene();scene.background=new THREE.Color(0x07080d);
    const cam=new THREE.PerspectiveCamera(45,W/H,.1,1000);cam.position.set(9,6,11);cam.lookAt(0,0,0);
    const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(W,H);renderer.shadowMap.enabled=true;el.appendChild(renderer.domElement);
    scene.add(new THREE.AmbientLight(0xffffff,.4));const dl=new THREE.DirectionalLight(0xffd480,1.2);dl.position.set(5,10,5);dl.castShadow=true;scene.add(dl);
    const gr=new THREE.Mesh(new THREE.PlaneGeometry(20,20),new THREE.MeshLambertMaterial({color:0x0f1018}));gr.rotation.x=-Math.PI/2;gr.receiveShadow=true;scene.add(gr);scene.add(new THREE.GridHelper(20,20,0x1c1f33,0x1c1f33));
    const floors=Math.max(1,parseInt(data.floors)||3),pal=(PALETTES[data.master]?.c||PALETTES[data.style]?.c)||["#c4b89a","#8a8a8a"];
    for(let f=0;f<floors;f++){const m=new THREE.Mesh(new THREE.BoxGeometry(4,.88,3),new THREE.MeshLambertMaterial({color:new THREE.Color(pal[f%pal.length])}));m.position.set(0,f*.88+.44,0);m.castShadow=true;scene.add(m);for(let w=-1;w<=1;w++){const win=new THREE.Mesh(new THREE.BoxGeometry(.5,.38,.05),new THREE.MeshLambertMaterial({color:0x4a9aff,transparent:true,opacity:.8}));win.position.set(w*1.2,f*.88+.44,1.52);scene.add(win);}}
    const roof=new THREE.Mesh(new THREE.BoxGeometry(4.2,.14,3.2),new THREE.MeshLambertMaterial({color:new THREE.Color(pal[0])}));roof.position.set(0,floors*.88+.07,0);scene.add(roof);
    let rotY=.3,drag=false,lastX=0;
    const onD=e=>{drag=true;lastX=e.clientX||(e.touches?.[0]?.clientX)||0;};const onU=()=>{drag=false;};const onM=e=>{if(!drag)return;const x=e.clientX||(e.touches?.[0]?.clientX)||0;rotY+=(x-lastX)*.012;lastX=x;};
    el.addEventListener('mousedown',onD);el.addEventListener('mouseup',onU);el.addEventListener('mousemove',onM);
    let id;const anim=()=>{id=requestAnimationFrame(anim);if(!drag)rotY+=.005;cam.position.x=Math.sin(rotY)*13;cam.position.z=Math.cos(rotY)*13;cam.lookAt(0,floors*.44,0);renderer.render(scene,cam);};anim();
    return()=>{cancelAnimationFrame(id);renderer.dispose();if(el.contains(renderer.domElement))el.removeChild(renderer.domElement);};
  },[]);
  return(<div ref={mRef} style={{width:"100%",height:280,borderRadius:10,overflow:"hidden",border:`1px solid ${brd}`,cursor:"grab"}}/>);
}

function AnimBuilding({data}){
  const mRef=useRef(null),sRef=useRef({floors:[],targets:[],rotY:.3,drag:false,lastX:0,anim:false,id:null});
  const [done,setDone]=useState(false);
  useEffect(()=>{
    const el=mRef.current;if(!el)return;
    const W=el.clientWidth||520,H=270,scene=new THREE.Scene();scene.background=new THREE.Color(0x07080d);
    const cam=new THREE.PerspectiveCamera(45,W/H,.1,1000);cam.position.set(9,6,11);cam.lookAt(0,0,0);
    const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(W,H);renderer.shadowMap.enabled=true;el.appendChild(renderer.domElement);
    scene.add(new THREE.AmbientLight(0xffffff,.4));const dl=new THREE.DirectionalLight(0xffd480,1.2);dl.position.set(5,10,5);scene.add(dl);
    const gr=new THREE.Mesh(new THREE.PlaneGeometry(20,20),new THREE.MeshLambertMaterial({color:0x0f1018}));gr.rotation.x=-Math.PI/2;scene.add(gr);scene.add(new THREE.GridHelper(20,20,0x1c1f33,0x1c1f33));
    const fCount=Math.max(1,parseInt(data.floors)||3),pal=(PALETTES[data.master]?.c||PALETTES[data.style]?.c)||["#c4b89a"];
    const s=sRef.current;s.floors=[];s.targets=[];
    for(let f=0;f<fCount;f++){const m=new THREE.Mesh(new THREE.BoxGeometry(4,.88,3),new THREE.MeshLambertMaterial({color:new THREE.Color(pal[f%pal.length])}));m.position.set(0,-8,0);scene.add(m);s.floors.push(m);s.targets.push(f*.88+.44);}
    const roof=new THREE.Mesh(new THREE.BoxGeometry(4.2,.14,3.2),new THREE.MeshLambertMaterial({color:new THREE.Color(pal[0])}));roof.position.set(0,-8,0);scene.add(roof);s.floors.push(roof);s.targets.push(fCount*.88+.07);
    const onD=e=>{s.drag=true;s.lastX=e.clientX||(e.touches?.[0]?.clientX)||0;};const onU=()=>{s.drag=false;};const onM=e=>{if(!s.drag)return;const x=e.clientX||(e.touches?.[0]?.clientX)||0;s.rotY+=(x-s.lastX)*.012;s.lastX=x;};
    el.addEventListener('mousedown',onD);el.addEventListener('mouseup',onU);el.addEventListener('mousemove',onM);
    const loop=()=>{s.id=requestAnimationFrame(loop);if(!s.drag)s.rotY+=.004;cam.position.x=Math.sin(s.rotY)*13;cam.position.z=Math.cos(s.rotY)*13;cam.lookAt(0,fCount*.44,0);if(s.anim){let all=true;s.floors.forEach((f,i)=>{const t=s.targets[i];if(Math.abs(f.position.y-t)>.01){f.position.y+=(t-f.position.y)*.12;all=false;}else f.position.y=t;});if(all){s.anim=false;setDone(true);}}renderer.render(scene,cam);};loop();
    return()=>{cancelAnimationFrame(s.id);renderer.dispose();if(el.contains(renderer.domElement))el.removeChild(renderer.domElement);};
  },[]);
  const start=()=>{const s=sRef.current;s.floors.forEach(f=>f.position.y=-8);s.anim=true;setDone(false);};
  return(<div><div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}><p style={{color:sub,fontSize:11,margin:0}}>🎬 İnşaat Animasyonu</p><button onClick={start} style={{marginLeft:"auto",padding:"6px 14px",borderRadius:7,background:`linear-gradient(135deg,${gold},#b8892a)`,color:"#080810",fontWeight:700,fontSize:11,border:"none",cursor:"pointer"}}>{done?"🔄 Tekrar":"▶ Başlat"}</button></div><div ref={mRef} style={{width:"100%",height:270,borderRadius:10,overflow:"hidden",border:`1px solid ${brd}`,cursor:"grab"}}/></div>);
}

function FacadeDesign({data}){
  const f=Math.max(1,parseInt(data.floors)||3),pal=PALETTES[data.master]?.c||PALETTES[data.style]?.c||["#c4b89a","#888"];
  const W=500,FH=62,M=28,H=f*FH+M*2;
  const wp={modern:{ww:28,wh:32,n:4},minimalist:{ww:40,wh:36,n:3},brutalist:{ww:18,wh:22,n:5},futuristic:{ww:60,wh:42,n:3},mediterranean:{ww:22,wh:30,n:4},ottoman:{ww:20,wh:34,n:4},japanese:{ww:14,wh:42,n:3},zahahadid:{ww:55,wh:40,n:3},tadaoando:{ww:30,wh:38,n:2}}[data.master||data.style]||{ww:24,wh:28,n:4};
  return(<svg width="100%" viewBox={`0 0 ${W} ${H+10}`} style={{background:"#05060a",borderRadius:10,border:`1px solid ${brd}`}}>
    <defs><linearGradient id="fg2" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={pal[0]+"cc"}/><stop offset="100%" stopColor={(pal[1]||pal[0])+"cc"}/></linearGradient></defs>
    <rect x={0} y={H-10} width={W} height={20} fill="#0f1218"/>
    {Array.from({length:f},(_,i)=>{const y=M+(f-1-i)*FH;return(<g key={i}>
      <rect x={48} y={y} width={W-96} height={FH} fill="url(#fg2)" stroke={pal[1]||pal[0]} strokeWidth={.6} opacity={.92}/>
      {Array.from({length:wp.n},(_,wi)=>{const sp=(W-96)/wp.n,wx=48+sp*(wi+.5)-wp.ww/2,wy=y+(FH-wp.wh)/2;return(<g key={wi}><rect x={wx} y={wy} width={wp.ww} height={wp.wh} fill="#4a9aff" opacity={.65} rx={data.style==="ottoman"?5:2}/>{data.style==="ottoman"&&<path d={`M${wx},${wy} Q${wx+wp.ww/2},${wy-9} ${wx+wp.ww},${wy}`} fill="none" stroke={gold} strokeWidth={1.2}/>}</g>);})}
      <text x={88} y={y+FH/2+4} textAnchor="end" fill={sub} fontSize={8}>K{i+1}</text>
    </g>);})}
    {data.sus?.includes("Yeşil Çatı")&&<rect x={50} y={M-18} width={W-100} height={10} fill="#2d6a2d" rx={3} opacity={.9}/>}
    {data.sus?.includes("Güneş Paneli")&&Array.from({length:5},(_,i)=><rect key={i} x={60+i*72} y={M-16} width={55} height={7} fill="#1a3a5c" stroke="#4a9aff" strokeWidth={.6} rx={1}/>)}
    <rect x={W/2-15} y={H-10-36} width={30} height={36} fill={gold} opacity={.8} rx={2}/>
  </svg>);
}

function SectionDraw({data}){
  const f=Math.max(1,parseInt(data.floors)||3),pal=PALETTES[data.master]?.c||PALETTES[data.style]?.c||["#c4b89a","#888"];
  const W=500,FH=55,M=30,H=f*FH+60+M*2;
  return(<svg width="100%" viewBox={`0 0 ${W} ${H+20}`} style={{background:"#05060a",borderRadius:10,border:`1px solid ${brd}`}}>
    <rect x={0} y={H-20} width={W} height={30} fill="#0c0e14"/>
    <rect x={90} y={H-20} width={W-180} height={20} fill="#2a2820" stroke="#4a4840" strokeWidth={1}/>
    {Array.from({length:f},(_,i)=>{const y=H-20-60-(f-i)*FH;return(<g key={i}>
      <rect x={100} y={y} width={W-200} height={FH} fill={pal[i%pal.length]+"30"} stroke={pal[i%pal.length]} strokeWidth={.8}/>
      <rect x={100} y={y} width={18} height={FH} fill={pal[0]+"55"} stroke={pal[0]} strokeWidth={.5}/>
      <rect x={W-118} y={y} width={18} height={FH} fill={pal[0]+"55"} stroke={pal[0]} strokeWidth={.5}/>
      <rect x={118} y={y+5} width={8} height={FH-10} fill="#ff8c0033" stroke="#ff8c00" strokeWidth={.4} strokeDasharray="2,2"/>
      {[.3,.55,.75].map((p2,wi)=><rect key={wi} x={100+(W-200)*p2-14} y={y+10} width={28} height={28} fill="#4a9aff" opacity={.5} rx={1}/>)}
      <text x={88} y={y+FH/2+4} textAnchor="end" fill={sub} fontSize={8}>K{i+1}</text>
      <text x={92} y={y+FH/2-2} textAnchor="end" fill={sub} fontSize={7}>3.2m</text>
    </g>);})}
    <rect x={95} y={H-20-60-f*FH-10} width={W-190} height={10} fill={pal[0]} stroke={pal[1]||pal[0]} strokeWidth={.8}/>
    {data.sus?.includes("Yeşil Çatı")&&<rect x={97} y={H-20-60-f*FH-20} width={W-194} height={10} fill="#2d6a2d" rx={2}/>}
    <text x={W/2} y={H+14} textAnchor="middle" fill={sub} fontSize={8}>Toplam Bina Yüksekliği: {(f*3.2+3.5).toFixed(1)}m</text>
  </svg>);
}

function LandscapePlan({data}){
  const plot=parseInt(data.plot)||500,area=parseInt(data.area)||150,ratio=Math.sqrt(area/plot);
  const W=500,H=370,bw=Math.round(W*ratio*.7),bh=Math.round(H*ratio*.7),bx=(W-bw)/2,by=(H-bh)/2;
  return(<svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{background:"#0a120a",borderRadius:10,border:`1px solid ${brd}`}}>
    <rect x={10} y={10} width={W-20} height={H-20} fill="#0d1a0d" stroke="#2a4a2a" strokeWidth={1.5} rx={4}/>
    <rect x={14} y={H-80} width={80} height={68} fill="#151820" stroke="#2a3040" strokeWidth={1} rx={2}/>
    <text x={54} y={H-10} textAnchor="middle" fill={sub} fontSize={8}>Otopark</text>
    {[[bx-40,by-20,35,H/2+40],[bx+bw+5,by-20,35,H/2+40]].map(([x,y,w,h],i)=><rect key={i} x={x} y={y} width={w} height={h} fill="#1a3020" stroke="#2a4a2a" strokeWidth={.5} rx={3}/>)}
    {[[40,40],[460,40],[40,330],[460,330],[40,190],[460,190]].map(([x,y],i)=><g key={i}><circle cx={x} cy={y} r={13} fill="#1a3018" stroke="#2d5a24" strokeWidth={1}/><circle cx={x} cy={y} r={7} fill="#2d5a24" opacity={.8}/></g>)}
    <rect x={bx} y={by} width={bw} height={bh} fill={PALETTES[data.master]?.c[0]||PALETTES[data.style]?.c[0]||"#c4b89a"} opacity={.5} stroke={gold} strokeWidth={1.5} rx={3}/>
    <text x={bx+bw/2} y={by+bh/2-6} textAnchor="middle" fill={goldL} fontSize={11} fontWeight="700">{TYPES.find(t=>t.id===data.type)?.l||"Bina"}</text>
    <text x={bx+bw/2} y={by+bh/2+8} textAnchor="middle" fill={sub} fontSize={9}>{area}m²</text>
    <g transform={`translate(${W-30},30)`}><circle cx={0} cy={0} r={14} fill="#0a0c14" stroke={brd}/><text x={0} y={-4} textAnchor="middle" fill={gold} fontSize={10} fontWeight="900">N</text><line x1={0} y1={-10} x2={0} y2={10} stroke={gold} strokeWidth={1} opacity={.5}/><line x1={-10} y1={0} x2={10} y2={0} stroke={gold} strokeWidth={1} opacity={.5}/></g>
    <rect x={10} y={10} width={110} height={52} fill="#07080d" opacity={.9} rx={4}/>
    <text x={18} y={26} fill={goldL} fontSize={9} fontWeight="700">Arsa: {plot}m²</text>
    <text x={18} y={38} fill={sub} fontSize={9}>TAKS: {(area/plot*.35).toFixed(2)}</text>
    <text x={18} y={50} fill={sub} fontSize={9}>Yeşil: {Math.round((plot-area)*.4)}m²</text>
  </svg>);
}

function FireEscape({data}){
  const rooms=parseInt(data.rooms)||4,rList=(RMAP[data.type]||Array.from({length:rooms},(_,i)=>`Oda ${i+1}`));
  const W=500,H=330,M=28,cols=Math.ceil(Math.sqrt(rooms)),rW=(W-M*2)/cols,rH=(H-M*2)/Math.ceil(rooms/cols);
  return(<svg width="100%" viewBox={`0 0 ${W} ${H+30}`} style={{background:"#0a0604",borderRadius:10,border:`1px solid ${brd}`}}>
    <rect x={M-5} y={M-5} width={W-M*2+10} height={H-M*2+10} fill="none" stroke="#ff4444" strokeWidth={2} rx={4}/>
    {Array.from({length:rooms},(_,i)=>{const rx=M+(i%cols)*rW,ry=M+Math.floor(i/cols)*rH;return(<g key={i}><rect x={rx+2} y={ry+2} width={rW-8} height={rH-8} fill="#180a0a" stroke="#3a1a1a" strokeWidth={1} rx={3}/><text x={rx+rW/2} y={ry+rH/2} textAnchor="middle" fill="#cc8888" fontSize={10}>{rList[i]||`Oda ${i+1}`}</text><text x={rx+rW-16} y={ry+16} fontSize={14}>🧯</text></g>);})}
    {[{x:W/2,y:M-4,l:"ÇIKIŞ"},{x:M-4,y:H/2,l:"ACİL"}].map(({x,y,l},i)=><g key={i}><rect x={x-22} y={y-14} width={44} height={20} fill="#ff4444" rx={4}/><text x={x} y={y+1} textAnchor="middle" fill="#fff" fontSize={9} fontWeight="700">{l}</text></g>)}
    <line x1={W/2} y1={H/2} x2={W/2} y2={M+6} stroke="#ff6644" strokeWidth={2} strokeDasharray="6,4"/>
    <line x1={W/2} y1={H/2} x2={M+6} y2={H/2} stroke="#ff6644" strokeWidth={2} strokeDasharray="6,4"/>
    {[{x:M+10,y:M+10},{x:W-M-10,y:M+10},{x:M+10,y:H-M-10},{x:W-M-10,y:H-M-10}].map((p,i)=><text key={i} x={p.x} y={p.y} textAnchor="middle" fontSize={12}>🔔</text>)}
    <text x={W/2} y={H+14} textAnchor="middle" fill={sub} fontSize={8}>Tahliye Süresi: ~{Math.ceil(rooms*8)}sn · Toplantı Noktası: 🟢</text>
  </svg>);
}

function TechDraw({data}){
  const rooms=parseInt(data.rooms)||4,area=parseInt(data.area)||100,rList=(RMAP[data.type]||Array.from({length:rooms},(_,i)=>`Oda ${i+1}`));
  const W=500,H=330,M=40,cols=Math.ceil(Math.sqrt(rooms)),rW=(W-M*2)/cols,rH=(H-M*2)/Math.ceil(rooms/cols),scale=Math.round(Math.sqrt(area)/10)*50||100;
  return(<svg width="100%" viewBox={`0 0 ${W} ${H+45}`} style={{background:"#05080d",borderRadius:10,border:`1px solid ${brd}`}}>
    {Array.from({length:10},(_,i)=><g key={i}><line x1={M+i*(W-M*2)/9} y1={M-8} x2={M+i*(W-M*2)/9} y2={H-M+8} stroke="#0e1020" strokeWidth={.5}/><line x1={M-8} y1={M+i*(H-M*2)/9} x2={W-M+8} y2={M+i*(H-M*2)/9} stroke="#0e1020" strokeWidth={.5}/></g>)}
    {["A","B","C","D","E"].map((l,i)=><text key={l} x={M+i*(W-M*2)/4} y={M-10} textAnchor="middle" fill={sub} fontSize={8}>{l}</text>)}
    <rect x={M} y={M} width={W-M*2} height={H-M*2} fill="none" stroke="#7a9aff" strokeWidth={3}/>
    {Array.from({length:rooms},(_,i)=>{const rx=M+(i%cols)*rW,ry=M+Math.floor(i/cols)*rH;return(<g key={i}><rect x={rx+1} y={ry+1} width={rW-6} height={rH-6} fill="none" stroke="#4a6aaa" strokeWidth={1}/><text x={rx+rW/2} y={ry+rH/2-5} textAnchor="middle" fill="#9ab8f0" fontSize={9} fontWeight="700">{rList[i]||`Oda ${i+1}`}</text><text x={rx+rW/2} y={ry+rH/2+8} textAnchor="middle" fill={sub} fontSize={8}>{Math.round(area/rooms)}m²</text></g>);})}
    <rect x={0} y={H+2} width={W} height={40} fill="#0a0d14" stroke={brd} strokeWidth={.5}/>
    <text x={20} y={H+18} fill={sub} fontSize={8}>PROJE</text><text x={20} y={H+36} fill={goldL} fontSize={11} fontWeight="700">{TYPES.find(t=>t.id===data.type)?.l||"-"}</text>
    <text x={200} y={H+18} fill={sub} fontSize={8}>STİL</text><text x={200} y={H+36} fill={goldL} fontSize={11} fontWeight="700">{STYLES.find(s=>s.id===data.style)?.l||"-"}</text>
    <text x={360} y={H+18} fill={sub} fontSize={8}>ÖLÇEK</text><text x={360} y={H+36} fill={goldL} fontSize={11} fontWeight="700">1:{scale}</text>
  </svg>);
}

function SunSim({data}){
  const [hour,setHour]=useState(12),pal=PALETTES[data.master]?.c||PALETTES[data.style]?.c||["#c4b89a","#888"];
  const floors=Math.max(1,parseInt(data.floors)||3),ang=(hour-6)/12*Math.PI,isDay=hour>=6&&hour<=18,lux=isDay?Math.round(Math.sin(ang)*95000):0;
  const skyC=["#0a0a1a","#1a1020","#2a2018","#1a2030","#0e1828","#081020","#0a1828","#101828","#1a2030","#28201a","#301818","#20100a","#0a0a1a"][Math.max(0,Math.min(12,hour-6))];
  return(<div><p style={{color:sub,fontSize:11,marginBottom:8}}>☀️ {hour}:00 — {lux.toLocaleString()} lux</p>
    <svg width="100%" viewBox="0 0 500 230" style={{background:skyC,borderRadius:10,border:`1px solid ${brd}`,transition:"background .4s"}}>
      <defs><radialGradient id="sg2"><stop offset="0%" stopColor="#fff8e0"/><stop offset="100%" stopColor="#ffa500" stopOpacity="0"/></radialGradient></defs>
      <rect x={0} y={200} width={500} height={30} fill="#0f1218"/>
      {isDay&&<><circle cx={250-Math.cos(ang)*160} cy={200-Math.sin(ang)*130} r={28} fill="url(#sg2)" opacity={.9}/><circle cx={250-Math.cos(ang)*160} cy={200-Math.sin(ang)*130} r={9} fill="#fff8e0"/></>}
      {Array.from({length:floors},(_,f)=>{const y=200-50-f*42;return(<g key={f}><rect x={170} y={y} width={120} height={42} fill={pal[0]+"44"} stroke={pal[1]||pal[0]} strokeWidth={1}/><rect x={183} y={y+8} width={22} height={17} fill={isDay&&hour<14?"#ffd480":"#4a9aff"} opacity={.7} rx={2}/><rect x={245} y={y+8} width={22} height={17} fill={isDay&&hour>11?"#ffd480":"#4a9aff"} opacity={.7} rx={2}/></g>);})}
      <rect x={168} y={200-50-floors*42-7} width={124} height={7} fill={pal[0]} stroke={pal[1]||pal[0]} strokeWidth={1}/>
    </svg>
    <input type="range" min={6} max={18} step={1} value={hour} onChange={e=>setHour(+e.target.value)} style={{width:"100%",accentColor:gold,margin:"8px 0"}}/>
    <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:sub,fontSize:10}}>🌅 06</span><span style={{color:goldL,fontWeight:700,fontSize:11}}>{hour}:00 — {lux>60000?"Tam Güneş":lux>30000?"Aydınlık":lux>5000?"Alacakaranlık":"Gece"}</span><span style={{color:sub,fontSize:10}}>🌆 18</span></div>
  </div>);
}

function FurnPlan({data}){
  const [sel,setSel]=useState(null),[placed,setPlaced]=useState({});
  const GW=16,GH=11,CS=27,rooms=parseInt(data.rooms)||4,rList=(RMAP[data.type]||[]).slice(0,rooms),cols=Math.ceil(Math.sqrt(rooms)),rW=Math.floor(GW/cols),rH=Math.floor(GH/Math.ceil(rooms/cols));
  const isWall=(gx,gy)=>gx%rW===0||gy%rH===0;
  const tog2=(gx,gy)=>{if(isWall(gx,gy))return;const k=`${gx}_${gy}`;if(placed[k]){setPlaced(p=>{const n={...p};delete n[k];return n;});}else if(sel)setPlaced(p=>({...p,[k]:sel}));};
  return(<div><div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>{FURN.map(f=><button key={f.id} onClick={()=>setSel(s=>s===f.id?null:f.id)} style={{padding:"4px 8px",borderRadius:7,fontSize:10,cursor:"pointer",background:sel===f.id?`linear-gradient(135deg,${gold},#b8892a)`:card,color:sel===f.id?"#080810":txt,border:`1px solid ${sel===f.id?gold:brd}`}}>{f.i} {f.l}</button>)}{Object.keys(placed).length>0&&<button onClick={()=>setPlaced({})} style={{padding:"4px 8px",borderRadius:7,fontSize:10,cursor:"pointer",background:"#1a0808",color:"#ff6b6b",border:"1px solid #3a1010"}}>🗑️</button>}</div>
  <div style={{overflowX:"auto"}}><div style={{display:"inline-grid",gridTemplateColumns:`repeat(${GW},${CS}px)`,border:`2px solid ${gold}`,borderRadius:5,overflow:"hidden"}}>{Array.from({length:GH},(_,gy)=>Array.from({length:GW},(_,gx)=>{const k=`${gx}_${gy}`,item=placed[k],wall=isWall(gx,gy),ri=Math.floor(gx/rW)+Math.floor(gy/rH)*cols,isCorner=gx%rW===0&&gy%rH===0&&gx>0&&gy>0;return(<div key={k} onClick={()=>tog2(gx,gy)} style={{width:CS,height:CS,background:wall?"#0c0e18":item?"#1a2d1a":"#07080d",border:`0.5px solid ${wall?"#1c1f33":"#0e0f18"}`,cursor:!wall&&sel?"crosshair":"default",display:"flex",alignItems:"center",justifyContent:"center",fontSize:wall?5:14,userSelect:"none"}}>{isCorner&&rList[ri]&&!item?<span style={{fontSize:5,color:sub,textAlign:"center"}}>{rList[ri]}</span>:item?FURN.find(f=>f.id===item)?.i:null}</div>);}))}</div></div>
  <p style={{color:sub,fontSize:10,marginTop:5}}>Doluluk: {Math.round(Object.keys(placed).length/((GW-cols)*(GH-Math.ceil(rooms/cols)))*100)}%</p></div>);
}

function Earthquake({data}){
  const [city,setCity]=useState(()=>Object.keys(EQZ).find(c=>(data.loc||"").toLowerCase().includes(c.toLowerCase()))||"İstanbul");
  const [soil,setSoil]=useState("B");const info=EQZ[city]||{z:2,r:"Yüksek",c:"#ffcc00"};
  const score=Math.max(20,100-(info.z-1)*22-(["D","E"].includes(soil)?18:0)-(parseInt(data.floors)>10?10:0));
  return(<div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
    <div><label style={{color:sub,fontSize:11,display:"block",marginBottom:4}}>📍 Şehir</label><select value={city} onChange={e=>setCity(e.target.value)} style={{width:"100%",background:"#0a0c14",border:`1px solid ${brd}`,borderRadius:8,color:txt,padding:"9px 12px",fontSize:12,outline:"none"}}>{Object.keys(EQZ).map(c=><option key={c}>{c}</option>)}</select></div>
    <div><label style={{color:sub,fontSize:11,display:"block",marginBottom:4}}>🌍 Zemin</label><select value={soil} onChange={e=>setSoil(e.target.value)} style={{width:"100%",background:"#0a0c14",border:`1px solid ${brd}`,borderRadius:8,color:txt,padding:"9px 12px",fontSize:12,outline:"none"}}><option value="A">A — Kaya</option><option value="B">B — Sıkı</option><option value="C">C — Orta</option><option value="D">D — Gevşek</option><option value="E">E — Risk!</option></select></div>
  </div>
  <div style={{padding:12,borderRadius:10,border:`2px solid ${info.c}`,background:info.c+"18",marginBottom:10,textAlign:"center"}}><div style={{color:info.c,fontWeight:800,fontSize:15}}>{info.r} Deprem Riski · Bölge {info.z}</div></div>
  <div style={{padding:12,background:"#0a0c14",borderRadius:10,border:`1px solid ${brd}`}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{color:sub,fontSize:12}}>Yapısal Güvenlik Skoru</span><span style={{color:score>70?"#4caf80":"#ffa500",fontWeight:700}}>{score}/100</span></div><div style={{height:7,background:"#151728",borderRadius:4}}><div style={{width:`${score}%`,height:"100%",background:score>70?"#4caf80":"#ffa500",borderRadius:4,transition:"width .5s"}}/></div></div>
  </div>);
}

function AIReview({data}){
  const [r,setR]=useState(null),[load,setLoad]=useState(false),[err,setErr]=useState<string|null>(null);
  const gen=async()=>{setLoad(true);setErr(null);const out=await anthropicChat([{role:"user",content:`Mimar olarak eleştir. SADECE JSON: {"guclu":["g1","g2","g3"],"zayif":["z1","z2"],"oneriler":["o1","o2","o3"],"not":78,"yorum":"3 cümle değerlendirme Türkçe"} Proje: ${data.type} ${data.area}m² ${data.floors} kat ${data.style} malzeme:${data.mats?.join(",")}`}],{max_tokens:700});if(out.ok)setR(parseJsonSafe(out.data,{}));else setErr(out.error);setLoad(false);};
  if(!r)return(<div style={{textAlign:"center",padding:28}}>{err&&<div style={{padding:10,borderRadius:8,background:"#1a0808",border:"1px solid #ff4444",color:"#ff8888",fontSize:12,marginBottom:14}}>{err}</div>}<p style={{color:sub,fontSize:12,marginBottom:14}}>AI projeyi profesyonel mimar gözüyle değerlendirir.</p><button onClick={gen} disabled={load} style={{padding:"11px 24px",borderRadius:9,background:load?"#1c1f33":`linear-gradient(135deg,${gold},#b8892a)`,color:load?sub:"#080810",fontWeight:700,border:"none",cursor:"pointer"}}>{load?"⏳ Analiz ediliyor...":"🔍 AI Değerlendirme"}</button></div>);
  return(<div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
      <div style={{padding:12,background:"#0a1a0a",borderRadius:10,border:"1px solid #2a4a2a"}}><p style={{color:"#4caf80",fontWeight:700,fontSize:11,marginBottom:7}}>✅ Güçlü</p>{r.guclu?.map((g,i)=><div key={i} style={{color:txt,fontSize:11,marginBottom:4}}>• {g}</div>)}</div>
      <div style={{padding:12,background:"#1a0a0a",borderRadius:10,border:"1px solid #4a2a2a"}}><p style={{color:"#ff7043",fontWeight:700,fontSize:11,marginBottom:7}}>⚠️ Zayıf</p>{r.zayif?.map((z,i)=><div key={i} style={{color:txt,fontSize:11,marginBottom:4}}>• {z}</div>)}</div>
    </div>
    <div style={{padding:12,background:"#0a0c14",borderRadius:10,border:`1px solid ${brd}`,marginBottom:10}}><p style={{color:goldL,fontWeight:700,fontSize:11,marginBottom:7}}>💡 Öneriler</p>{r.oneriler?.map((o,i)=><div key={i} style={{color:txt,fontSize:11,marginBottom:4}}>→ {o}</div>)}</div>
    <div style={{display:"flex",gap:12,alignItems:"center",padding:12,background:"#0a0c14",borderRadius:10,border:`1px solid ${brd}`}}>
      <div style={{width:50,height:50,borderRadius:"50%",background:`conic-gradient(${r.not>=70?"#4caf80":"#ffa500"} ${r.not*3.6}deg,#151728 0)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <div style={{width:38,height:38,borderRadius:"50%",background:"#0a0c14",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}><span style={{color:goldL,fontWeight:900,fontSize:14}}>{r.not}</span></div>
      </div>
      <p style={{color:txt,fontSize:12,lineHeight:1.7,margin:0}}>{r.yorum}</p>
    </div>
  </div>);
}

function Timeline({data}){
  const f=Math.max(1,parseInt(data.floors)||3),area=parseInt(data.area)||100;
  const phases=[{l:"Proje & Ruhsat",d:2+Math.floor(f/3),c:"#4a9aff"},{l:"Hafriyat & Temel",d:2+Math.floor(area/600),c:gold},{l:"Kaba İnşaat",d:3+f,c:"#4caf80"},{l:"Çatı & Cephe",d:2+Math.floor(f/2),c:"#7b68ee"},{l:"Tesisat",d:2+Math.floor(f/2),c:"#ff7043"},{l:"İnce İşler",d:3+Math.floor(area/350),c:"#26c6da"},{l:"Denetim & Teslim",d:1,c:"#4caf80"}];
  const total=phases.reduce((s,p)=>s+p.d,0);let cum=0;const bw=440;
  return(<div><p style={{color:sub,fontSize:11,marginBottom:8}}>📅 Toplam ~{total} ay ({Math.ceil(total/12)} yıl)</p>
    <div style={{overflowX:"auto"}}>
      <svg width={520} height={phases.length*32+50} style={{background:"#07080d",borderRadius:10,border:`1px solid ${brd}`}}>
        {Array.from({length:total+1},(_,i)=><g key={i}><line x1={50+i*bw/total} y1={18} x2={50+i*bw/total} y2={phases.length*32+40} stroke={brd} strokeWidth={.5}/><text x={50+i*bw/total} y={12} textAnchor="middle" fill={sub} fontSize={7}>A{i+1}</text></g>)}
        {phases.map((p,i)=>{const x=50+cum*bw/total,w=p.d*bw/total;cum+=p.d;return(<g key={i}><text x={46} y={34+i*32} textAnchor="end" fill={sub} fontSize={9}>{p.l}</text><rect x={x} y={22+i*32} width={w-2} height={20} fill={p.c} rx={3} opacity={.85}/>{w>28&&<text x={x+w/2-1} y={36+i*32} textAnchor="middle" fill="#fff" fontSize={8} fontWeight="700">{p.d}a</text>}</g>);})}
        <line x1={50} y1={18} x2={50} y2={phases.length*32+40} stroke={gold} strokeWidth={1}/>
      </svg>
    </div>
  </div>);
}

function ROICalc({data}){
  const {min,max}=calcCost(parseInt(data.area)||100,data.mats||[],data.loc||"");
  const [inv,setInv]=useState(Math.round((min+max)/2)),[rent,setRent]=useState(Math.round(min*.0045)),[occ,setOcc]=useState(85),[maint,setMaint]=useState(Math.round(min*.015));
  const netIncome=rent*12*(occ/100)-maint,roi=netIncome/inv*100,payback=netIncome>0?inv/netIncome:0;
  const yearData=Array.from({length:10},(_,i)=>({yıl:`Y${i+1}`,gelir:Math.round(rent*12*(occ/100)*(1.03**i)/1000),net:Math.round(netIncome*(1.025**i)/1000)}));
  return(<div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
      {[{l:"Yatırım (₺)",v:inv,s:setInv,step:100000},{l:"Aylık Kira (₺)",v:rent,s:setRent,step:1000},{l:"Doluluk (%)",v:occ,s:setOcc,step:5},{l:"Yıllık Bakım (₺)",v:maint,s:setMaint,step:50000}].map(({l,v,s,step})=><div key={l}><label style={{color:sub,fontSize:11,display:"block",marginBottom:3}}>{l}</label><input type="number" value={v} onChange={e=>s(+e.target.value)} step={step} style={{width:"100%",background:"#0a0c14",border:`1px solid ${brd}`,borderRadius:7,color:txt,padding:"8px 10px",fontSize:12,outline:"none"}}/></div>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7,marginBottom:12}}>
      {[{l:"Yıllık Net",v:`₺${(netIncome/1000).toFixed(0)}K`,c:netIncome>0?"#4caf80":"#ff4444"},{l:"ROI",v:`%${roi.toFixed(1)}`,c:roi>8?"#4caf80":"#ffa500"},{l:"Geri Dönüş",v:`${payback.toFixed(1)}y`,c:goldL},{l:"20Y Değer",v:`₺${(inv*(1+roi/100)**20/1e6).toFixed(1)}M`,c:"#7b68ee"}].map(({l,v,c})=><div key={l} style={{textAlign:"center",padding:9,background:"#0a0c14",borderRadius:8,border:`1px solid ${brd}`}}><div style={{color:c,fontWeight:800,fontSize:12}}>{v}</div><div style={{color:sub,fontSize:9,marginTop:2}}>{l}</div></div>)}
    </div>
    <div style={{height:120}}><ResponsiveContainer width="100%" height="100%"><LineChart data={yearData}><XAxis dataKey="yıl" tick={{fill:sub,fontSize:9}}/><YAxis tick={{fill:sub,fontSize:9}}/><Tooltip contentStyle={{background:"#10121c",border:`1px solid ${brd}`,color:txt,fontSize:10}} formatter={v=>`₺${v}K`}/><Line type="monotone" dataKey="gelir" stroke="#4caf80" strokeWidth={2} dot={false}/><Line type="monotone" dataKey="net" stroke={gold} strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer></div>
  </div>);
}

function CostNeg({data}){
  const {min,max}=calcCost(parseInt(data.area)||100,data.mats||[],data.loc||"");
  const [msgs,setMsgs]=useState([{r:"a",t:`Proje maliyeti ₺${(min/1e6).toFixed(1)}M-₺${(max/1e6).toFixed(1)}M. Optimizasyon için sorularınızı yanıtlayayım.`}]);
  const [inp,setInp]=useState(""),[load,setLoad]=useState(false);const eRef=useRef(null);
  useEffect(()=>{eRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);
  const send=async()=>{if(!inp.trim()||load)return;const q=inp.trim();setInp("");setMsgs(p=>[...p,{r:"u",t:q}]);setLoad(true);
    const out=await anthropicChat([...msgs.slice(-4).map(m=>({role:m.r==="u"?"user":"assistant",content:m.t})),{role:"user",content:q}],{system:`Mimari maliyet danışmanı. Proje: ${data.type} ${data.area}m² ${data.style} ₺${(min/1e6).toFixed(1)}M-₺${(max/1e6).toFixed(1)}M. Kısa Türkçe.`,max_tokens:400});
    setMsgs(p=>[...p,{r:"a",t:out.ok?out.data:out.error}]);
    setLoad(false);
  };
  return(<div style={{display:"flex",flexDirection:"column",height:340}}>
    <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:6,marginBottom:6}}>{msgs.map((m,i)=><div key={i} style={{display:"flex",justifyContent:m.r==="u"?"flex-end":"flex-start"}}><div style={{maxWidth:"82%",padding:"8px 12px",fontSize:12,lineHeight:1.7,borderRadius:m.r==="u"?"12px 12px 2px 12px":"12px 12px 12px 2px",background:m.r==="u"?`linear-gradient(135deg,${gold},#b8892a)`:"#0f1120",color:m.r==="u"?"#080810":txt,border:`1px solid ${m.r==="u"?gold:brd}`}}>{m.r==="a"&&<span style={{color:"#4caf80",fontSize:9,fontWeight:700,display:"block",marginBottom:2}}>💰 Maliyet Danışmanı</span>}{m.t}</div></div>)}{load&&<div style={{display:"flex"}}><div style={{padding:"8px 12px",borderRadius:"12px 12px 12px 2px",background:"#0f1120",border:`1px solid ${brd}`,color:gold,fontSize:11}}>⏳</div></div>}<div ref={eRef}/></div>
    <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:6}}>{["Tasarruf önerileri?","Alternatif malzeme?","Kat azaltma etkisi?","İkinci el uygun mu?"].map(s=><button key={s} onClick={()=>setInp(s)} style={{padding:"3px 7px",borderRadius:20,fontSize:9,cursor:"pointer",background:"#0a0c14",color:sub,border:`1px solid ${brd}`}}>{s}</button>)}</div>
    <div style={{display:"flex",gap:6}}><input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Maliyet sorun..." style={{flex:1,background:"#0a0c14",border:`1px solid ${brd}`,borderRadius:8,color:txt,padding:"8px 12px",fontSize:12,outline:"none"}}/><button onClick={send} disabled={!inp.trim()||load} style={{padding:"8px 14px",borderRadius:8,background:"linear-gradient(135deg,#4caf80,#2e7d52)",color:"#fff",fontWeight:700,border:"none",cursor:"pointer"}}>Sor</button></div>
  </div>);
}

function AIChat({data,res}){
  const [msgs,setMsgs]=useState([{r:"a",t:`Merhaba! ${TYPES.find(t=>t.id===data.type)?.l||"Proje"} danışmanınızım.`}]);
  const [inp,setInp]=useState(""),[load,setLoad]=useState(false);const eRef=useRef(null);
  useEffect(()=>{eRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);
  const send=async()=>{if(!inp.trim()||load)return;const q=inp.trim();setInp("");setMsgs(p=>[...p,{r:"u",t:q}]);setLoad(true);
    const out=await anthropicChat([...msgs.slice(-4).map(m=>({role:m.r==="u"?"user":"assistant",content:m.t})),{role:"user",content:q}],{system:`Mimari danışman. Proje: ${data.type} ${data.area}m² ${data.floors}k ${data.style}. Kısa Türkçe.${res?` Özet: ${res.ozet?.slice(0,100)}`:""}`,max_tokens:400});
    setMsgs(p=>[...p,{r:"a",t:out.ok?out.data:out.error}]);
    setLoad(false);
  };
  return(<div style={{display:"flex",flexDirection:"column",height:340}}>
    <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:6,marginBottom:6}}>{msgs.map((m,i)=><div key={i} style={{display:"flex",justifyContent:m.r==="u"?"flex-end":"flex-start"}}><div style={{maxWidth:"82%",padding:"8px 12px",fontSize:12,lineHeight:1.7,borderRadius:m.r==="u"?"12px 12px 2px 12px":"12px 12px 12px 2px",background:m.r==="u"?`linear-gradient(135deg,${gold},#b8892a)`:"#0f1120",color:m.r==="u"?"#080810":txt,border:`1px solid ${m.r==="u"?gold:brd}`}}>{m.r==="a"&&<span style={{color:gold,fontSize:9,fontWeight:700,display:"block",marginBottom:2}}>🤖 AI Mimar</span>}{m.t}</div></div>)}{load&&<div style={{display:"flex"}}><div style={{padding:"8px 12px",borderRadius:"12px 12px 12px 2px",background:"#0f1120",border:`1px solid ${brd}`,color:gold,fontSize:11}}>⏳</div></div>}<div ref={eRef}/></div>
    <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:6}}>{["Bütçe?","Malzeme?","Enerji?","Cephe?"].map(s=><button key={s} onClick={()=>setInp(s)} style={{padding:"3px 7px",borderRadius:20,fontSize:9,cursor:"pointer",background:"#0a0c14",color:sub,border:`1px solid ${brd}`}}>{s}</button>)}</div>
    <div style={{display:"flex",gap:6}}><input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Soru sorun..." style={{flex:1,background:"#0a0c14",border:`1px solid ${brd}`,borderRadius:8,color:txt,padding:"8px 12px",fontSize:12,outline:"none"}}/><button onClick={send} disabled={!inp.trim()||load} style={{padding:"8px 14px",borderRadius:8,background:`linear-gradient(135deg,${gold},#b8892a)`,color:"#080810",fontWeight:700,border:"none",cursor:"pointer"}}>Sor</button></div>
  </div>);
}

function CostCalcFull({data}){
  const {min,max,per}=calcCost(parseInt(data.area)||100,data.mats||[],data.loc||"");
  return(<div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7,marginBottom:10}}>{[{l:"Min.",v:`₺${(min/1000).toFixed(0)}K`},{l:"Max.",v:`₺${(max/1000).toFixed(0)}K`},{l:"m²",v:`₺${per.toLocaleString()}`}].map(({l,v})=><div key={l} style={{textAlign:"center",padding:9,background:"#0a0c14",borderRadius:9,border:`1px solid ${brd}`}}><div style={{color:goldL,fontSize:15,fontWeight:800}}>{v}</div><div style={{color:sub,fontSize:9,marginTop:2}}>{l}</div></div>)}</div>
    <div style={{background:"#0a0c14",borderRadius:10,padding:12,border:`1px solid ${brd}`}}>{[{l:"Yapı İşçiliği",p:35,c:gold},{l:"Malzeme",p:30,c:"#7b68ee"},{l:"Tesisat",p:15,c:"#4caf80"},{l:"Proje",p:10,c:"#ff7043"},{l:"Diğer",p:10,c:"#78909c"}].map(({l,p,c})=><div key={l} style={{marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{color:txt,fontSize:11}}>{l}</span><span style={{color:c,fontSize:11,fontWeight:700}}>{p}%</span></div><div style={{height:5,background:"#151728",borderRadius:3}}><div style={{width:`${p}%`,height:"100%",background:c,borderRadius:3}}/></div></div>)}</div>
  </div>);
}

function AIAlts({data}){
  const [load,setLoad]=useState(null),[results,setResults]=useState({});
  const variants=[{id:"luxury",l:"💎 Lüks",mod:"Çok daha lüks, premium."},{id:"eco",l:"🌿 Eko",mod:"Maksimum yeşil."},{id:"minimal",l:"✦ Minimal",mod:"Radikal minimalist."},{id:"budget",l:"💰 Bütçe",mod:"Bütçeyi yarıya indir."}];
  const gen=async(v)=>{setLoad(v.id);const out=await anthropicChat([{role:"user",content:`${data.type} ${data.area}m² ${data.style}. ${v.mod} SADECE JSON: {"ozet":"2 cümle","degisiklikler":["d1","d2","d3"],"maliyet":"₺X-Y"}`}],{max_tokens:400});if(out.ok)setResults(p=>({...p,[v.id]:parseJsonSafe(out.data,{ozet:"",degisiklikler:[],maliyet:""})}));setLoad(null);};
  return(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>{variants.map(v=><div key={v.id} style={{background:"#0a0c14",border:`1px solid ${results[v.id]?gold:brd}`,borderRadius:11,padding:12}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}><div style={{color:txt,fontWeight:700,fontSize:12}}>{v.l}</div><button onClick={()=>gen(v)} disabled={load===v.id} style={{padding:"4px 10px",borderRadius:7,fontSize:10,fontWeight:700,cursor:"pointer",border:"none",background:load===v.id?"#1c1f33":`linear-gradient(135deg,${gold},#b8892a)`,color:load===v.id?sub:"#080810"}}>{load===v.id?"⏳":"🚀"}</button></div>{results[v.id]&&<><p style={{color:txt,fontSize:10,lineHeight:1.6,marginBottom:5}}>{results[v.id].ozet}</p>{results[v.id].degisiklikler?.map((d,i)=><div key={i} style={{color:goldL,fontSize:10,marginBottom:2}}>• {d}</div>)}<div style={{marginTop:5,padding:"3px 8px",background:"#07080d",borderRadius:5,color:gold,fontSize:10,fontWeight:700}}>{results[v.id].maliyet}</div></>}</div>)}</div>);
}

function Accessibility({data}){
  const f=parseInt(data.floors)||1;
  const checks=[{l:"Giriş rampası ≤1:12",ok:true,w:15},{l:"Kapı genişliği ≥90cm",ok:true,w:15},{l:`Asansör ${f>2?"zorunlu":"önerilir"}`,ok:f<=2,w:20},{l:"Engelli otopark",ok:true,w:10},{l:"WC engelli kabini",ok:data.type!=="daire",w:15},{l:"Uyarıcı yüzey",ok:true,w:10},{l:"Braille yönlendirme",ok:data.type==="otel"||data.type==="avm",w:10},{l:"Tekerlekli sandalye ≥150cm",ok:true,w:5}];
  const score=Math.round(checks.reduce((s,c)=>s+(c.ok?c.w:0),0));
  return(<div>
    <div style={{display:"flex",gap:12,alignItems:"center",padding:12,background:"#0a0c14",borderRadius:10,border:`1px solid ${brd}`,marginBottom:12}}>
      <div style={{width:54,height:54,borderRadius:"50%",background:`conic-gradient(${score>=70?"#4caf80":"#ffa500"} ${score*3.6}deg,#151728 0)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <div style={{width:42,height:42,borderRadius:"50%",background:"#0a0c14",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}><span style={{color:score>=70?"#4caf80":"#ffa500",fontWeight:900,fontSize:14}}>{score}</span></div>
      </div>
      <div><div style={{color:goldL,fontWeight:700,fontSize:12}}>Erişilebilirlik Skoru</div><div style={{color:sub,fontSize:11,marginTop:2}}>{score>=70?"Yeterli":"İyileştirme önerilir"}</div></div>
    </div>
    <div style={{background:"#0a0c14",borderRadius:10,border:`1px solid ${brd}`,overflow:"hidden"}}>{checks.map((c,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderBottom:i<checks.length-1?`1px solid ${brd}`:"none"}}><span style={{fontSize:14}}>{c.ok?"✅":"⚠️"}</span><span style={{color:txt,fontSize:11}}>{c.l}</span></div>)}</div>
  </div>);
}

// ── ERROR BOUNDARY ──
class TabErrorBoundary extends Component<{children:React.ReactNode;fallback?:React.ReactNode},{hasError:boolean}>{
  state={hasError:false};
  static getDerivedStateFromError(){return{hasError:true};}
  render(){if(this.state.hasError) return this.props.fallback??<div style={{padding:24,background:"#1a0a0a",borderRadius:12,border:"1px solid #ff4444",color:"#ff8888"}}>Bu sekme yüklenirken hata oluştu. Sayfayı yenileyin veya başka sekmeye geçin.</div>;return this.props.children;}
}

// ── MAIN APP ──
const defaultData={type:"villa",area:"200",plot:"400",floors:"2",rooms:"4",loc:"İstanbul",budget:"5M TL",style:"modern",mats:["Beton","Cam"],lights:["Doğal Işık"],sus:[],master:"",custom:"",locDetail:""};
function App(){
  const [data,setData]=useState(defaultData);
  const [res,setRes]=useState(null);
  const [step,setStep]=useState(0);
  const [groupIdx,setGroupIdx]=useState(0);
  const [tabInGroupIdx,setTabInGroupIdx]=useState(0);
  const tabIdx=TAB_GROUPS[groupIdx]?.tabs[tabInGroupIdx]??0;
  const setTabIdx=(idx:number)=>{for(let g=0;g<TAB_GROUPS.length;g++){const i=TAB_GROUPS[g].tabs.indexOf(idx);if(i>=0){setGroupIdx(g);setTabInGroupIdx(i);return;}}};
  const [bp,setBp]=useState(false);
  const [lang,setLang]=useState("TR");
  const [load,setLoad]=useState(false);
  const [showNLP,setShowNLP]=useState(false);
  const [showSaveModal,setShowSaveModal]=useState(false);
  const [showLoadModal,setShowLoadModal]=useState(false);
  const [showApiKeyModal,setShowApiKeyModal]=useState(false);
  const [saveName,setSaveName]=useState("");
  const [projectsList,setProjectsList]=useState(listProjects());
  const [apiKeyInput,setApiKeyInput]=useState("");
  const [,forceRefresh]=useState(0);
  const [generatedImageUrl,setGeneratedImageUrl]=useState<string|null>(null);
  const [imageLoad,setImageLoad]=useState(false);
  const [imageError,setImageError]=useState<string|null>(null);
  const t=I18N[lang]||I18N.TR;
  const updateData=(k,v)=>setData(prev=>({...prev,[k]:v}));
  const handleSave=()=>{if(saveName.trim()){saveProject(saveName.trim(),data,res);setProjectsList(listProjects());setShowSaveModal(false);setSaveName("");}};
  const handleLoad=(id:string)=>{const p=loadProject(id);if(p){setData(p.data as typeof defaultData);setRes(p.res);setShowLoadModal(false);}};
  const handlePrint=()=>{window.print();};
  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{if(document.activeElement?.tagName==="INPUT"||document.activeElement?.tagName==="TEXTAREA")return;if(e.key==="ArrowLeft")setStep(s=>Math.max(0,s-1));if(e.key==="ArrowRight")setStep(s=>Math.min(5,s+1));};
    window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey);
  },[]);
  const genAI=useCallback(async()=>{
    setLoad(true);
    const prompt=`Mimari proje özeti ve görsel prompt. Tip: ${data.type}, Alan: ${data.area}m², Kat: ${data.floors}, Stil: ${data.style}, Malzeme: ${data.mats?.join(", ")}. SADECE JSON: {"ozet":"150 kelime Türkçe proje özeti","odaYerlesimi":"100 kelime oda yerleşimi","oneri":"kısa öneri","mjPrompt":"Single detailed English sentence for DALL-E: architectural visualization, ${data.style} style, ${data.type}, ${data.area} sqm, ${data.floors} floors, materials ${(data.mats||[]).join(" and ")}, photorealistic, professional render, exterior view"}`;
    const out=await anthropicChat([{role:"user",content:prompt}],{max_tokens:1200});
    if(out.ok){const parsed=parseJsonSafe(out.data,{ozet:"",odaYerlesimi:"",oneri:"",mjPrompt:""});setRes(parsed);}
    else setRes({ozet:out.error,odaYerlesimi:"",oneri:"",mjPrompt:""});
    setLoad(false);
  },[data]);
  const renderTab=()=>{
    const d=data;const r=res;
    switch(tabIdx){
      case 0: return res?<div><div style={{padding:12,background:"#0a0c14",borderRadius:10,border:`1px solid ${brd}`,marginBottom:12}}><p style={{color:txt,fontSize:12,lineHeight:1.8}}>{r.ozet}</p></div>{generatedImageUrl&&<div style={{marginBottom:12}}><img src={generatedImageUrl} alt="AI görsel" style={{width:"100%",maxWidth:600,borderRadius:12,border:`1px solid ${brd}`}}/></div>}{!hasApiKey()?<p style={{color:sub,fontSize:11,marginBottom:8}}>🖼️ Görsel için 🔑 menüsünden API anahtarını girin (Claude).</p>:<><button onClick={async()=>{const prompt=r.mjPrompt||r.ozet||"";if(!prompt)return;setImageLoad(true);setImageError(null);const out=await generateImage(prompt);setImageLoad(false);if(out.ok){setGeneratedImageUrl(out.url);}else setImageError(out.error);}} disabled={imageLoad} style={{padding:"10px 20px",borderRadius:10,background:imageLoad?"#1c1f33":`linear-gradient(135deg,#10a37f,#0d8a6a)`,color:imageLoad?sub:"#fff",fontWeight:700,border:"none",cursor:"pointer",marginBottom:8}}>{imageLoad?"⏳ Görsel üretiliyor (Claude)...":"🖼️ Görsel üret (Claude)"}</button>{imageError&&<p style={{color:"#ff8888",fontSize:12,marginTop:8}}>{imageError}</p>}</>}</div>:<div style={{textAlign:"center",padding:24}}><p style={{color:sub,marginBottom:12}}>Önce &quot;AI ile Üret&quot; ile konsept oluşturun.</p><button onClick={genAI} disabled={load} style={{padding:"12px 24px",borderRadius:10,background:load?"#1c1f33":`linear-gradient(135deg,${gold},#b8892a)`,color:load?sub:"#080810",fontWeight:700,border:"none",cursor:"pointer"}}>{load?t.generating:t.generate}</button></div>;
      case 1: return <FloorPlan data={d} res={r} bp={bp}/>;
      case 2: return <Moodboard data={d}/>;
      case 3: return <Building3D data={d}/>;
      case 4: return <AnimBuilding data={d}/>;
      case 5: return <FacadeDesign data={d}/>;
      case 6: return <SectionDraw data={d}/>;
      case 7: return <LandscapePlan data={d}/>;
      case 8: return <FireEscape data={d}/>;
      case 9: return <TechDraw data={d}/>;
      case 10: return <Accessibility data={d}/>;
      case 11: return res?<div style={{padding:12}}><p style={{color:goldL,fontSize:11,marginBottom:8}}>🖼️ Görsel prompt (Claude SVG)</p><p style={{color:txt,fontSize:12,marginBottom:12}}>{r.mjPrompt||r.ozet}</p>{!hasApiKey()?<p style={{color:sub,fontSize:11}}>Görsel için 🔑 menüsünden API anahtarını girin (Claude).</p>:<><button onClick={async()=>{const prompt=r.mjPrompt||r.ozet||"";if(!prompt)return;setImageLoad(true);setImageError(null);const out=await generateImage(prompt);setImageLoad(false);if(out.ok){setGeneratedImageUrl(out.url);}else setImageError(out.error);}} disabled={imageLoad} style={{padding:"10px 20px",borderRadius:10,background:imageLoad?"#1c1f33":"linear-gradient(135deg,#10a37f,#0d8a6a)",color:imageLoad?sub:"#fff",fontWeight:700,border:"none",cursor:"pointer",marginBottom:8}}>{imageLoad?"⏳ Üretiliyor (Claude)...":"🖼️ Görsel üret (Claude)"}</button>{imageError&&<p style={{color:"#ff8888",fontSize:12,marginTop:8}}>{imageError}</p>}{generatedImageUrl&&<div style={{marginTop:12}}><img src={generatedImageUrl} alt="Mimari görsel" style={{width:"100%",maxWidth:640,borderRadius:12,border:`1px solid ${brd}`}}/></div>}</>}</div>:null;
      case 12: return <CostCalcFull data={d}/>;
      case 13: return <AIAlts data={d}/>;
      case 14: return <SunSim data={d}/>;
      case 15: return <FurnPlan data={d}/>;
      case 16: return <Earthquake data={d}/>;
      case 17: return <AIAlts data={d}/>;
      case 18: return <AIReview data={d}/>;
      case 19: return <Timeline data={d}/>;
      case 20: return <ROICalc data={d}/>;
      case 21: return <CostNeg data={d}/>;
      case 22: return <ArchMasterEngine data={d} res={r}/>;
      case 23: return <EnergySimulation data={d}/>;
      case 24: return <CarbonCalc data={d}/>;
      case 25: return <BIMLite data={d}/>;
      case 26: return <UrbanPlanning data={d}/>;
      case 27: return <CompetitionGen data={d}/>;
      case 28: return <ClimateAnalysis data={d}/>;
      case 29: return <ParametricForms data={d}/>;
      case 30: return <AIChat data={d} res={r}/>;
      default: return null;
    }
  };
  return(<div style={{minHeight:"100vh",background:bg,color:txt,fontFamily:"system-ui,-apple-system,Segoe UI,Roboto,sans-serif"}} className="architect-app">
    {!hasApiKey()&&<div style={{padding:"10px 20px",background:"#0a0c14",borderBottom:`1px solid ${brd}`,display:"flex",alignItems:"center",justifyContent:"center",gap:10,flexWrap:"wrap"}} className="no-print">
      <span style={{color:goldL,fontSize:12}}>🔑 Anthropic API anahtarınızı girin (bir kez kaydedilir):</span>
      <input type="password" value={apiKeyInput} onChange={e=>setApiKeyInput(e.target.value)} placeholder="sk-ant-..." style={{width:"min(280px,100%)",padding:"8px 12px",borderRadius:8,border:`1px solid ${brd}`,background:"#07080d",color:txt,fontSize:12,outline:"none"}} />
      <button onClick={()=>{const v=apiKeyInput.trim();if(v){setApiKey(v);setApiKeyInput("");forceRefresh(n=>n+1);}}} disabled={!apiKeyInput.trim()} style={{padding:"8px 16px",borderRadius:8,background:apiKeyInput.trim()?gold:card,border:`1px solid ${apiKeyInput.trim()?gold:brd}`,color:apiKeyInput.trim()?"#080810":sub,fontWeight:700,fontSize:12,cursor:apiKeyInput.trim()?"pointer":"not-allowed"}}>Kaydet</button>
    </div>}
    <header style={{padding:"14px 20px",borderBottom:`1px solid ${brd}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}} className="no-print">
      <div><h1 style={{margin:0,fontSize:20,fontWeight:800,color:goldL}}>{t.title}</h1><p style={{margin:"2px 0 0",fontSize:11,color:sub}}>{t.sub}</p></div>
      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        <button onClick={()=>setShowSaveModal(true)} style={{padding:"6px 12px",borderRadius:8,background:card,border:`1px solid ${brd}`,color:goldL,fontSize:12,cursor:"pointer"}}>💾 Kaydet</button>
        <button onClick={()=>{setProjectsList(listProjects());setShowLoadModal(true);}} style={{padding:"6px 12px",borderRadius:8,background:card,border:`1px solid ${brd}`,color:goldL,fontSize:12,cursor:"pointer"}}>📂 Yükle</button>
        <button onClick={handlePrint} style={{padding:"6px 12px",borderRadius:8,background:card,border:`1px solid ${brd}`,color:goldL,fontSize:12,cursor:"pointer"}}>🖨️ Yazdır</button>
        <button onClick={()=>setShowNLP(true)} style={{padding:"6px 12px",borderRadius:8,background:card,border:`1px solid ${brd}`,color:goldL,fontSize:12,cursor:"pointer"}}>🗣️ NLP</button>
        <button onClick={()=>setBp(b=>!b)} style={{padding:"6px 12px",borderRadius:8,background:bp?gold:card,border:`1px solid ${bp?gold:brd}`,color:bp?"#080810":txt,fontSize:12,cursor:"pointer"}}>{t.blueprintMode}</button>
        {hasApiKey()&&<button onClick={()=>setShowApiKeyModal(true)} title="API anahtarını değiştir" style={{padding:"6px 10px",borderRadius:8,background:card,border:`1px solid ${brd}`,color:goldL,fontSize:12,cursor:"pointer"}}>🔑</button>}
        <select value={lang} onChange={e=>setLang(e.target.value)} style={{background:card,border:`1px solid ${brd}`,borderRadius:8,color:txt,padding:"6px 10px",fontSize:12}}><option value="TR">TR</option><option value="EN">EN</option><option value="RU">RU</option></select>
      </div>
    </header>
    <div className="app-layout" style={{display:"grid",gridTemplateColumns:"320px 1fr",gap:0,minHeight:"calc(100vh - 60px)"}}>
      <aside style={{borderRight:`1px solid ${brd}`,overflowY:"auto",padding:16}} className="no-print">
        <p style={{color:goldL,fontWeight:700,fontSize:12,marginBottom:12}}>{STEPS[step]}</p>
        {step===0&&(<><p style={{color:goldL,fontSize:10,fontWeight:700,marginBottom:6}}>Şablon</p><div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>{TMPLS.map(t=><div key={t.id} onClick={()=>{setData({...t.data,custom:"",locDetail:""});setRes(null);}} style={{padding:8,borderRadius:8,background:card,border:`1px solid ${brd}`,cursor:"pointer",textAlign:"center",minWidth:78}}><span style={{fontSize:18}}>{t.i}</span><div style={{fontSize:9,color:txt,fontWeight:600}}>{t.n}</div><div style={{fontSize:8,color:sub}}>{t.d}</div></div>)}</div><p style={{color:sub,fontSize:11,marginBottom:8}}>Tip</p><div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>{TYPES.slice(0,10).map(x=><div key={x.id} onClick={()=>updateData("type",x.id)} style={{padding:8,borderRadius:8,background:data.type===x.id?gold+"33":card,border:`1px solid ${data.type===x.id?gold:brd}`,cursor:"pointer",textAlign:"center",minWidth:70}}><span style={{fontSize:18}}>{x.i}</span><div style={{fontSize:10,color:txt}}>{x.l}</div></div>)}</div></>)}
        {step===1&&(<><label style={{color:sub,fontSize:11}}>Alan (m²)</label><input type="number" value={data.area} onChange={e=>updateData("area",e.target.value)} style={{width:"100%",background:"#0a0c14",border:`1px solid ${brd}`,borderRadius:8,color:txt,padding:8,marginBottom:8}}/><label style={{color:sub,fontSize:11}}>Arsa (m²)</label><input type="number" value={data.plot} onChange={e=>updateData("plot",e.target.value)} style={{width:"100%",background:"#0a0c14",border:`1px solid ${brd}`,borderRadius:8,color:txt,padding:8,marginBottom:8}}/><label style={{color:sub,fontSize:11}}>Kat / Oda</label><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><input type="number" value={data.floors} onChange={e=>updateData("floors",e.target.value)} placeholder="Kat" style={{background:"#0a0c14",border:`1px solid ${brd}`,borderRadius:8,color:txt,padding:8}}/><input type="number" value={data.rooms} onChange={e=>updateData("rooms",e.target.value)} placeholder="Oda" style={{background:"#0a0c14",border:`1px solid ${brd}`,borderRadius:8,color:txt,padding:8}}/></div><label style={{color:sub,fontSize:11,marginTop:8,display:"block"}}>Lokasyon</label><input value={data.loc} onChange={e=>updateData("loc",e.target.value)} style={{width:"100%",background:"#0a0c14",border:`1px solid ${brd}`,borderRadius:8,color:txt,padding:8}}/><label style={{color:sub,fontSize:11,marginTop:8,display:"block"}}>Bütçe</label><input value={data.budget} onChange={e=>updateData("budget",e.target.value)} style={{width:"100%",background:"#0a0c14",border:`1px solid ${brd}`,borderRadius:8,color:txt,padding:8}}/></>)}
        {step===2&&(<><p style={{color:sub,fontSize:11,marginBottom:8}}>Stil</p><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{STYLES.map(s=><button key={s.id} onClick={()=>updateData("style",s.id)} style={{padding:"6px 12px",borderRadius:8,fontSize:11,background:data.style===s.id?gold:card,color:data.style===s.id?"#080810":txt,border:`1px solid ${data.style===s.id?gold:brd}`,cursor:"pointer"}}>{s.l}</button>)}</div></>)}
        {step===3&&(<><p style={{color:sub,fontSize:11,marginBottom:8}}>Malzeme</p><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{MATS.map(m=><button key={m} onClick={()=>{const arr=data.mats?.includes(m)?(data.mats.filter(x=>x!==m)):(data.mats||[]).concat(m);updateData("mats",arr);}} style={{padding:"6px 10px",borderRadius:8,fontSize:10,background:(data.mats||[]).includes(m)?gold+"44":card,color:txt,border:`1px solid ${(data.mats||[]).includes(m)?gold:brd}`,cursor:"pointer"}}>{m}</button>)}</div></>)}
        {step===4&&(<><p style={{color:sub,fontSize:11,marginBottom:8}}>Yeşil / Sürdürülebilir</p><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{SUSTAIN.map(x=><button key={x.l} onClick={()=>{const arr=data.sus?.includes(x.l)?(data.sus.filter(s=>s!==x.l)):(data.sus||[]).concat(x.l);updateData("sus",arr);}} style={{padding:"6px 10px",borderRadius:8,fontSize:10,background:(data.sus||[]).includes(x.l)?"#4caf8044":card,color:txt,border:`1px solid ${(data.sus||[]).includes(x.l)?"#4caf80":brd}`,cursor:"pointer"}}>{x.i} {x.l}</button>)}</div></>)}
        {step===5&&(<><CostCalcFull data={data}/><button onClick={genAI} disabled={load} style={{width:"100%",marginTop:12,padding:12,borderRadius:10,background:load?"#1c1f33":`linear-gradient(135deg,${gold},#b8892a)`,color:load?sub:"#080810",fontWeight:700,border:"none",cursor:"pointer"}}>{load?t.generating:t.generate}</button></>)}
        <div style={{display:"flex",gap:8,marginTop:16}}><button onClick={()=>setStep(s=>Math.max(0,s-1))} style={{padding:8,borderRadius:8,background:card,border:`1px solid ${brd}`,color:txt,cursor:"pointer"}}>{t.back}</button><button onClick={()=>setStep(s=>Math.min(5,s+1))} style={{padding:8,borderRadius:8,background:`linear-gradient(135deg,${gold},#b8892a)`,color:"#080810",fontWeight:700,border:"none",cursor:"pointer"}}>{t.next}</button></div>
      </aside>
      <main style={{padding:16,overflowY:"auto"}}>
        <div style={{marginBottom:14,position:"sticky",top:0,background:bg,zIndex:5,paddingBottom:8}} className="no-print">
          <div style={{display:"flex",gap:6,marginBottom:6,flexWrap:"wrap"}}>{TAB_GROUPS.map((g,i)=><button key={i} onClick={()=>{setGroupIdx(i);setTabInGroupIdx(0);}} style={{padding:"6px 14px",borderRadius:8,fontSize:12,fontWeight:600,background:groupIdx===i?gold:card,color:groupIdx===i?"#080810":sub,border:`1px solid ${groupIdx===i?gold:brd}`,cursor:"pointer"}}>{g.name}</button>)}</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{(TAB_GROUPS[groupIdx]?.tabs??[]).map((globalIdx,i)=><button key={globalIdx} onClick={()=>setTabInGroupIdx(i)} style={{padding:"6px 12px",borderRadius:8,fontSize:11,whiteSpace:"nowrap",background:tabInGroupIdx===i?gold:card,color:tabInGroupIdx===i?"#080810":sub,border:`1px solid ${tabInGroupIdx===i?gold:brd}`,cursor:"pointer"}}>{RTABS[globalIdx]}</button>)}</div>
        </div>
        <div style={{minHeight:360}}><TabErrorBoundary>{renderTab()}</TabErrorBoundary></div>
      </main>
    </div>
    {showNLP&&<NLPWizard onFill={setData} onClose={()=>setShowNLP(false)}/>}
    {showSaveModal&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setShowSaveModal(false)}><div style={{background:card,border:`1px solid ${brd}`,borderRadius:12,padding:20,minWidth:320}} onClick={e=>e.stopPropagation()}><h3 style={{margin:"0 0 12px",color:goldL,fontSize:14}}>Projeyi kaydet</h3><input value={saveName} onChange={e=>setSaveName(e.target.value)} placeholder="Proje adı" style={{width:"100%",padding:10,borderRadius:8,border:`1px solid ${brd}`,background:"#0a0c14",color:txt,marginBottom:12,fontSize:13}}/><div style={{display:"flex",gap:8}}><button onClick={()=>setShowSaveModal(false)} style={{padding:"8px 16px",borderRadius:8,background:card,border:`1px solid ${brd}`,color:txt,cursor:"pointer"}}>İptal</button><button onClick={handleSave} disabled={!saveName.trim()} style={{padding:"8px 16px",borderRadius:8,background:gold,color:"#080810",fontWeight:700,border:"none",cursor:saveName.trim()?"pointer":"not-allowed"}}>Kaydet</button></div></div></div>}
    {showLoadModal&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setShowLoadModal(false)}><div style={{background:card,border:`1px solid ${brd}`,borderRadius:12,padding:20,minWidth:360,maxHeight:"70vh",overflow:"auto"}} onClick={e=>e.stopPropagation()}><h3 style={{margin:"0 0 12px",color:goldL,fontSize:14}}>Proje yükle</h3>{projectsList.length===0?<p style={{color:sub,fontSize:12}}>Kayıtlı proje yok. Önce Kaydet ile kaydedin.</p>:<ul style={{listStyle:"none",padding:0,margin:0}}>{projectsList.map(p=><li key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${brd}`}}><button onClick={()=>handleLoad(p.id)} style={{flex:1,textAlign:"left",background:"none",border:"none",color:txt,cursor:"pointer",fontSize:13}}>{p.name}</button><span style={{color:sub,fontSize:10}}>{new Date(p.date).toLocaleDateString("tr-TR")}</span><button onClick={e=>{e.stopPropagation();deleteProject(p.id);setProjectsList(listProjects());}} style={{padding:"4px 8px",background:"#1a0808",border:"1px solid #3a1010",color:"#ff6b6b",borderRadius:6,cursor:"pointer",fontSize:11}}>Sil</button></li>)}</ul>}<button onClick={()=>setShowLoadModal(false)} style={{marginTop:12,padding:"8px 16px",borderRadius:8,background:card,border:`1px solid ${brd}`,color:txt,cursor:"pointer"}}>Kapat</button></div></div>}
    {showApiKeyModal&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setShowApiKeyModal(false)}><div style={{background:card,border:`1px solid ${brd}`,borderRadius:12,padding:20,minWidth:340}} onClick={e=>e.stopPropagation()}>
      <h3 style={{margin:"0 0 12px",color:goldL,fontSize:14}}>🔑 API anahtarı</h3>
      <p style={{color:sub,fontSize:11,marginBottom:10}}>Anthropic (Claude) — metin ve görsel üretimi için tek anahtar. Tarayıcıda saklanır.</p>
      <input type="password" value={apiKeyInput} onChange={e=>setApiKeyInput(e.target.value)} placeholder="sk-ant-..." style={{width:"100%",padding:"9px 12px",borderRadius:8,border:`1px solid ${brd}`,background:"#0a0c14",color:txt,fontSize:12,outline:"none",marginBottom:12}} />
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <button onClick={()=>{if(apiKeyInput.trim()){setApiKey(apiKeyInput.trim());setApiKeyInput("");setShowApiKeyModal(false);forceRefresh(n=>n+1);}}} style={{padding:"8px 16px",borderRadius:8,background:gold,color:"#080810",fontWeight:700,border:"none",cursor:"pointer"}}>Kaydet</button>
        <button onClick={()=>{clearApiKey();setApiKeyInput("");setShowApiKeyModal(false);forceRefresh(n=>n+1);}} style={{padding:"8px 16px",borderRadius:8,background:"#1a0808",border:"1px solid #3a1010",color:"#ff8888",cursor:"pointer"}}>Anahtarı kaldır</button>
        <button onClick={()=>setShowApiKeyModal(false)} style={{padding:"8px 16px",borderRadius:8,background:card,border:`1px solid ${brd}`,color:txt,cursor:"pointer"}}>Kapat</button>
      </div>
    </div></div>}
  </div>);
}

export default App;