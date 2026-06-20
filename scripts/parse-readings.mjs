import fs from "node:fs";
const SRC="./combined.md";
const lines=fs.readFileSync(SRC,"utf8").split(/\r?\n/);
const MAJOR=["The Fool","The Magician","The High Priestess","The Empress","The Emperor","The Hierophant","The Lovers","The Chariot","Strength","The Hermit","Wheel of Fortune","Justice","The Hanged Man","Death","Temperance","The Devil","The Tower","The Star","The Moon","The Sun","Judgement","The World"];
const SUITS=["Wands","Cups","Swords","Pentacles"],RANKS=["Ace","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Page","Knight","Queen","King"];
const MINOR=SUITS.flatMap(s=>RANKS.map(r=>`${r} of ${s}`));
const DECK=[...MAJOR,...MINOR];
const keyOf=s=>s.toLowerCase().replace(/<[^>]+>/g,"").replace(/[*_#>]/g,"").replace(/[0-9]/g,"").replace(/\bthe\b/g,"").replace(/[^a-z]/g,"");
const CANON={};for(const c of DECK)CANON[keyOf(c)]=c;CANON[keyOf("Judgment")]="Judgement";CANON["sevenofpentaclest"]="Seven of Pentacles";
const KEYS=Object.keys(CANON);
function matchCard(s){const k=keyOf(s);if(!k)return null;if(CANON[k])return CANON[k];for(const ck of KEYS){if((k.startsWith(ck)||ck.startsWith(k))&&Math.abs(k.length-ck.length)<=2)return CANON[ck];}return null;}
function cardFromText(body){const cb=body.replace(/\*+/g," ").replace(/:/g," ");const fl=(cb.split("\n").find(x=>/[A-Za-z]/.test(x))||"").trim().replace(/^[^A-Za-z]+/,"");let name=null;let m=fl.match(/^([A-Za-z ]+?)\s+(?:card\s+)?ke hisaab/i)||fl.match(/^([A-Za-z ]+?)\s+(?:card\s+)?ki timing/i)||fl.match(/^([A-Za-z ]+?)\s+represents/i);if(m)name=m[1];let card=name?matchCard(name):null;if(card)return card;const words=fl.split(/\s+/);for(let w=1;w<=6&&w<=words.length;w++){const mc=matchCard(words.slice(0,w).join(" "));if(mc)card=mc;}return card;}
const secStarts=[];lines.forEach((l,i)=>{const m=l.match(/^#\s*(\d)\.\s+/);if(m)secStarts.push({n:+m[1],line:i});});
const SECTIONS={1:"third_party",2:"shaadi",3:"life_partner",4:"baby",5:"soulmate",6:"partner_feelings",7:"spiritual_journey",8:"this_month"};
function sectionLines(n){const s=secStarts.find(x=>x.n===n);if(!s)return[];const after=secStarts.filter(x=>x.line>s.line).map(x=>x.line);const end=after.length?Math.min(...after):lines.length;return lines.slice(s.line+1,end);}
const clean=t=>t.replace(/Top of Form/g,"").replace(/Bottom of Form/g,"").replace(/\(Latin Script\)/gi,"").replace(/<!--[\s\S]*?-->/g,"").replace(/<\/?[^>]+>/g,"").replace(/\n{3,}/g,"\n\n").trim();
const data={},coverage={},dups={};

function parseTiming(n){
  const type=SECTIONS[n];data[type]={};dups[type]=[];const ls=sectionLines(n);const text=ls.join("\n");
  // split on Hinglish markers (tolerant of "(Latin Script)")
  const hRe=/\*\*\s*Hinglish[^\n*]*\*\*/gi;
  const idx=[];let m;while((m=hRe.exec(text))){idx.push({start:m.index,after:m.index+m[0].length});}
  for(let k=0;k<idx.length;k++){
    const blockEnd=k+1<idx.length?idx[k+1].start:text.length;
    const body=text.slice(idx[k].after,blockEnd);
    const grab=(label,nexts)=>{let rest=body;if(label!=="Hinglish"){const r=new RegExp(`\\*\\*\\s*${label}[^\\n*]*\\*\\*`,"i");const mm=body.match(r);if(!mm)return"";rest=body.slice(mm.index+mm[0].length);}
      for(const nl of nexts){const r2=new RegExp(`\\*\\*\\s*${nl}[^\\n*]*\\*\\*`,"i");const m2=rest.match(r2);if(m2)rest=rest.slice(0,m2.index);}return clean(rest);};
    const hinglish=grab("Hinglish",["English","Hindi"]);
    const card=cardFromText(hinglish);
    if(!card)continue;
    if(data[type][card]){dups[type].push(card);continue;}
    data[type][card]={hinglish,english:grab("English",["Hindi"]),hindi:grab("Hindi",[])};
  }
  coverage[type]=Object.keys(data[type]).length;
}
[1,2,3,4,5].forEach(parseTiming);

// section 6 (hinglish only)
(function(){const type=SECTIONS[6];data[type]={};const ls=sectionLines(6);const mk=[];ls.forEach((l,i)=>{const m=l.match(/^#?\s*\*\*(.+?)\*\*\s*$/);if(m){const c=matchCard(m[1]);if(c)mk.push({c,i});}});for(let k=0;k<mk.length;k++){const s=mk[k].i+1,e=k+1<mk.length?mk[k+1].i:ls.length;const t=clean(ls.slice(s,e).join("\n"));if(!data[type][mk[k].c])data[type][mk[k].c]={hinglish:t,english:"",hindi:""};}coverage[type]=Object.keys(data[type]).length;})();
// section 7
(function(){const type=SECTIONS[7];data[type]={};const ls=sectionLines(7);ls.forEach(l=>{const m=l.match(/\*\*(.+?)\*\*\s*[–—-]\s*(.+)$/);if(m){const c=matchCard(m[1]);if(c&&!data[type][c]){const lab=clean(m[2]);data[type][c]={hinglish:lab,english:lab,hindi:lab};}}});coverage[type]=Object.keys(data[type]).length;})();
// section 8
(function(){const type=SECTIONS[8];data[type]={};const ls=sectionLines(8);const mk=[];ls.forEach((l,i)=>{const t=l.trim();if(!/^(#{2,3}\s|\*\*)/.test(t))return;if(/english|ह[िी]ंदी|hindi/i.test(t.replace(/<[^>]+>/g,"")))return;const c=matchCard(t.split(/[–—-]/)[0]);if(c)mk.push({c,i});});for(let k=0;k<mk.length;k++){const s=mk[k].i+1,e=k+1<mk.length?mk[k+1].i:ls.length;const block=ls.slice(s,e).join("\n");const eng=block.match(/\*\*\s*ENGLISH(?:\s+VERSION)?\s*\*\*|\*\*\s*English\s*\*\*/i);const hin=block.match(/\*\*\s*ह[िी]ंदी\s*\*\*|\*\*\s*Hindi\s*\*\*/i);let hi=block,en="",hd="";if(eng){hi=block.slice(0,eng.index);let af=block.slice(eng.index+eng[0].length);const h2=af.match(/\*\*\s*ह[िी]ंदी\s*\*\*|\*\*\s*Hindi\s*\*\*/i);if(h2){en=af.slice(0,h2.index);hd=af.slice(h2.index+h2[0].length);}else en=af;}else if(hin){hi=block.slice(0,hin.index);hd=block.slice(hin.index+hin[0].length);}if(!data[type][mk[k].c])data[type][mk[k].c]={hinglish:clean(hi),english:clean(en),hindi:clean(hd)};}coverage[type]=Object.keys(data[type]).length;})();

console.log("Coverage (cards/78):");
for(const [n,type] of Object.entries(SECTIONS)){const f=Object.keys(data[type]||{});const miss=DECK.filter(c=>!f.includes(c));console.log(`  ${n} ${type}: ${f.length}/78`+(miss.length?`  MISSING(${miss.length}): ${miss.join(", ")}`:"  OK")+(dups[type]&&dups[type].length?`  DUPS: ${dups[type].join(", ")}`:""));}
const out="// AUTO-GENERATED from combined.md — do not edit by hand.\nexport const READINGS = "+JSON.stringify(data)+";\n";
fs.writeFileSync(new URL("../app/src/data/readings.js", import.meta.url), out);
