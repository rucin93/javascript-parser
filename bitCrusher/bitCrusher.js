var bitCrusher=function(){"use strict";class t{constructor(t){const n=[..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",..."0123456789",..."+-*/()[]{}^%$!@.,_<>?:;",..."αβγδεζηθικλμνξοπρστυφχψωΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ",..."абвгдеёжзийклмнопрстуфхцчшщыэюяАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩъЫьЭЮЯ"];this.availableChars=n.filter(n=>!t.includes(n)),this.index=0}getNextChar(){const t=this.availableChars[this.index]||String.fromCharCode(192+this.index);return this.index++,t}}function n(t,n){var e;return`O=${n=(e=n).includes("\n")?"`"+e.replace(/`/g,"\\`")+"`":e.split('"').length>=e.split("'").length?`'${e.replace(/'/g,"\\'")}'`:`"${e.replace(/"/g,'\\"')}"`};for(o of'${t.map(t=>t.to).reverse().join("")}')with(O.split(o))O=join(pop());eval(O)`}var e;function r(t,n){let r=[],s=0,o=!1;for(let l=2;!o;l++){let c=!1;for(let o=0;o<t.length-l;o++){const h=t.substring(o,o+l),a=(i=h,t.split(i).length-1);if(a>1){c=!0,r=r.filter(t=>-1===h.indexOf(t.word)||t.wordOccurences>a);const t=a*l-(a+l+2);t>0&&t>=s*(n===e.NONE?1:.8)&&r.push({word:h,wordOccurences:a,savings:t}),s=Math.max(s,t)}}c||(o=!0)}var i;return r.sort((t,n)=>n.savings-t.savings)}return function(t){t[t.NONE=0]="NONE",t[t.MAX=1]="MAX",t[t.MIN=2]="MIN"}(e||(e={})),function(s){return[e.NONE,e.MAX,e.MIN].map(o=>function(s,o){const i=new t(s);let l=[],c=s,h=null,a=!1;for(;!a;){const t=i.getNextChar(),s=r(c,o);if(0===s.length)break;const g=s[0].savings,u=s.filter(t=>t.savings>=.8*g);let f;if(o===e.NONE&&(f=0),o===e.MAX){let t=0;u.forEach((n,e)=>{n.word.length>t&&(f=e,t=n.word.length)})}if(o===e.MIN){let t=1/0;u.forEach((n,e)=>{n.word.length<t&&(f=e,t=n.word.length)})}const d=s[f].word,N=c.split(d).join(t)+t+d,p=[...l];p.push({from:d,to:t});const v=n(p,N);null===h||h.length>v.length?(h=v,c=N,l=p):a=!0}const g=n(l,c);return s.length<g.length?s:g}(s,o)).sort((t,n)=>t.length-n.length)[0]}}();