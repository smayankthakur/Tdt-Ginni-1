// Rough Roman(Hinglish) -> Devanagari transliterator. Converts [a-z] runs only.
const OVERRIDES = {
  aap:"आप",aapki:"आपकी",aapko:"आपको",aapke:"आपके",aapka:"आपका",apki:"आपकी",apke:"आपके",apko:"आपको",apka:"आपका",apni:"अपनी",apne:"अपने",apna:"अपना",
  ki:"की",ka:"का",ke:"के",ko:"को",se:"से",me:"में",mein:"में",par:"पर",hai:"है",hain:"हैं",ho:"हो",hoga:"होगा",hogi:"होगी",hogaa:"होगा",hone:"होने",hona:"होना",
  raha:"रहा",rahi:"रही",rahe:"रहे",rha:"रहा",tha:"था",thi:"थी",the:"थे",kab:"कब",kya:"क्या",kyun:"क्यों",kyunki:"क्योंकि",aur:"और",ya:"या",ye:"ये",yeh:"ये",
  woh:"वो",wo:"वो",jab:"जब",tab:"तब",bhi:"भी",hi:"ही",na:"ना",nahi:"नहीं",nahin:"नहीं",abhi:"अभी",ab:"अब",sab:"सब",kuch:"कुछ",kuchh:"कुछ",naya:"नया",nayi:"नई",naye:"नए",
  samay:"समय",shaadi:"शादी",shadi:"शादी",dil:"दिल",pyaar:"प्यार",pyar:"प्यार",rishta:"रिश्ता",rishte:"रिश्ते",zindagi:"ज़िंदगी",milega:"मिलेगा",milegi:"मिलेगी",milne:"मिलने",
  karna:"करना",karne:"करने",karo:"करो",kar:"कर",karte:"करते",karta:"करता",karti:"करती",lekin:"लेकिन",magar:"मगर",toh:"तो",to:"तो",jaisa:"जैसा",jaise:"जैसे",jaisi:"जैसी",
  bilkul:"बिल्कुल",thoda:"थोड़ा",thodi:"थोड़ी",jaldi:"जल्दी",dheere:"धीरे",bharosa:"भरोसा",vishwas:"विश्वास",mann:"मन",andar:"अंदर",bahar:"बाहर",saath:"साथ",din:"दिन",
  waqt:"वक़्त",baat:"बात",baatein:"बातें",baar:"बार",log:"लोग",insaan:"इंसान",zaroor:"ज़रूर",zaroori:"ज़रूरी",shayad:"शायद",sirf:"सिर्फ़",khud:"खुद",unke:"उनके",unki:"उनकी",
  unka:"उनका","unhe":"उन्हें",iska:"इसका",iski:"इसकी",iske:"इसके",ek:"एक",do:"दो",teen:"तीन",aane:"आने",wala:"वाला",wali:"वाली",wale:"वाले",hokar:"होकर",
  // common english loanwords (match existing Hindi data style)
  energy:"एनर्जी",partner:"पार्टनर",feel:"फील",feeling:"फीलिंग",feelings:"फीलिंग्स",strong:"स्ट्रॉन्ग",month:"महीना",life:"लाइफ",love:"लव",baby:"बेबी",time:"टाइम",
  timing:"टाइमिंग",future:"फ्यूचर",situation:"सिचुएशन",clarity:"क्लैरिटी",change:"चेंज",connection:"कनेक्शन",soulmate:"सोलमेट",union:"यूनियन",career:"करियर",
  marriage:"मैरिज",relationship:"रिलेशनशिप",positive:"पॉज़िटिव",chapter:"चैप्टर",spark:"स्पार्क",excitement:"एक्साइटमेंट",new:"न्यू",
};
Object.assign(OVERRIDES,{sakta:"सकता",sakti:"सकती",sakte:"सकते",hota:"होता",hoti:"होती",hote:"होते",chahiye:"चाहिए",chahte:"चाहते",chahti:"चाहती",chahta:"चाहता",milta:"मिलता",milti:"मिलती",dekho:"देखो",dekhein:"देखें",socho:"सोचो",samajh:"समझ",soch:"सोच",kaafi:"काफ़ी",zyada:"ज़्यादा",kam:"कम",accha:"अच्छा",achha:"अच्छा",sahi:"सही",galat:"ग़लत",raasta:"रास्ता",rasta:"रास्ता",disha:"दिशा",ummeed:"उम्मीद",umeed:"उम्मीद",khushi:"खुशी",dukh:"दुख",pareshan:"परेशान",mehsoos:"महसूस",rakhein:"रखें",rakho:"रखो",rakhna:"रखना",aage:"आगे",peeche:"पीछे",saamne:"सामने"});
const CONS = {
  chh:"छ", shh:"श", sh:"श", ch:"च", th:"थ", dh:"ध", kh:"ख", gh:"घ", jh:"झ", ph:"फ", bh:"भ", ng:"ंग", ny:"ञ",
  k:"क", g:"ग", j:"ज", t:"ट", d:"ड", n:"न", p:"प", f:"फ़", b:"ब", m:"म", y:"य", r:"र", l:"ल", v:"व", w:"व", s:"स", h:"ह", z:"ज़", c:"क", x:"क्स", q:"क",
};
const VS = { aa:"ा", ai:"ै", au:"ौ", ee:"ी", ii:"ी", oo:"ू", uu:"ू", a:"", i:"ि", u:"ु", e:"े", o:"ो" };
const VI = { aa:"आ", ai:"ऐ", au:"औ", ee:"ई", ii:"ई", oo:"ऊ", uu:"ऊ", a:"अ", i:"इ", u:"उ", e:"ए", o:"ओ" };
const CK = Object.keys(CONS).sort((a, b) => b.length - a.length);
const VK = ["aa", "ai", "au", "ee", "ii", "oo", "uu", "a", "i", "u", "e", "o"];
const at = (w, i, keys) => keys.find((k) => w.startsWith(k, i)) || null;

function word(wRaw) {
  const lw = wRaw.toLowerCase();
  if (OVERRIDES[lw]) return OVERRIDES[lw];
  const w = lw, n = w.length;
  let out = "", i = 0;
  while (i < n) {
    const c = at(w, i, CK);
    if (c) {
      out += CONS[c]; i += c.length;
      const v = at(w, i, VK);
      if (v) {
        i += v.length;
        if (v === "a") out += i >= n ? "ा" : "";
        else if (v === "i") out += i >= n ? "ी" : "ि";   // final i -> long
        else if (v === "u") out += i >= n ? "ू" : "ु";   // final u -> long
        else out += VS[v];
      } else if (i < n) out += "्";
      continue;
    }
    const v = at(w, i, VK);
    if (v) { out += VI[v]; i += v.length; continue; }
    out += w[i]; i++;
  }
  return out;
}
const translit = (str) => String(str || "").replace(/[A-Za-z]+/g, (m) => word(m));
module.exports = { translit };

if (require.main === module) {
  [
    "Aapki shaadi kab hogi",
    "Abhi apke partner ke dil mein strong excitement aur naya spark feel ho raha hai.",
    "Ye month bilkul naya chapter jaisa hoga. Career mein naya opportunity aa sakta hai.",
  ].forEach((s) => console.log(s, "\n→", translit(s), "\n"));
}
