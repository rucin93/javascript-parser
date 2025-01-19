import { createCharDec } from './utils';

function enhancedTextParser(code: string): string {
  code = ';' + code;
  // code = ';' + code.replace(/(\r\n|\n|\r)/gm, '\\n');

  const s = code;
  let V = '';
  const W = [...new Set([...(';' + s)])].join('');

  let S = 0;
  let q = '';
  for (let i = 0; (q = s[i]) || i % 4; ++i) {
    S += q ? W.indexOf(q) << ((i % 2) * 5) : 0;
    i % 2
      ? ((V += String.fromCharCode(((i % 4 == 1 ? 54 : 55) << 10) + S)),
        (S = 0))
      : 0;
  }
  // build the output string
  //     `for(I=O="";I<1e5;)O+=\`;print(${W})\`["${V}".charCodeAt(I/2)>>I++%2*5&31]
  // eval(O)`
  return `for(I=O="";I<1e5;)O+=\`${W.replace(
    /`/g,
    '`'
  )}\`["${V}".charCodeAt(I/2)>>I++%2*5&31];eval(O)`;
}

function anotherTextParser(code: string): string {
  let u = '';
  const m = 95;
  const r = 32;
  const mod = (n, m) => ((n % m) + m) % m;
  code = ';' + code.replace(/(\r\n|\n|\r)/gm, '\\n');
  code += '//';
  code += ' '.repeat((code.length * 2) % 3);
  const step = code.length / 3;
  for (let i = 0; i < step; i++) {
    const [a, b, c] = [code[i + 2 * step], code[i + step], code[i]].map(
      (c) => c.charCodeAt(0) - r
    );
    const x = mod(a - b, m + 1) * m + a;
    let y = mod(((m + 1) / 2) * (x - c), m + 2) * m * (m + 1) + x;
    if (y >= 0xd800 && y <= 0xdfff) y += m * (m + 1) * (m + 2);
    u += String.fromCodePoint(y);
  }

  return `for(_=i=98;i--;)for(c of\`${u}\`)_+=String.fromCharCode(c.codePointAt()%i+32);eval(_)`;
}

function chineseMarks(code: string): string {
  const compressAscii = (code) => {
    let c = '';
    if (code.length % 2) code += ' ';
    const f = String.fromCharCode;
    const e = 'charCodeAt';
    for (let a = 0; code.length > a; a += 2)
      c += f(55296 + code[e](a)) + f(56320 + code[e](a + 1));
    return c;
  };

  return (
    'eval(unescape(escape`' + compressAscii(code) + "`.replace(/u../g,'')))"
  );
}

// function textParser(code: string): string {
//     let _ = ';' + code.replace(/(\r\n|\n|\r)/gm, '\\n');
//     const length = _.length
//     length % 3 !== 0 ? _ += ' '.repeat(3 - length % 3) : '';
//
//     const test = _.match(/.../g).map(chars => {
//         let result = 0
//         chars.split('').reverse().forEach(char => {
//             result *= 97
//             result += char.charCodeAt(0) - 31
//         })
//         return result
//     }).map(e => String.fromCodePoint(e)).join('')
//     return `t=0;for(c of\`${test}\`)for(v=c.codePointAt();v|0;v/=97)t+=String.fromCharCode(v%97+31);eval(t)`
// }

function numbersParser(code: string): string {
  const spreadSize = 6;
  let _ = code;
  const length = _.length;
  const rest = length % spreadSize;
  rest !== 0 ? (_ += '0'.repeat(spreadSize - rest)) : '';

  const test = _.match(new RegExp(`.{${spreadSize}}`, 'g'))
    .map((num) => createCharDec(num))
    .join(``);
  let result = `m='';for(x of\`${test}\`)m+=\`\${x.codePointAt()}\`.padStart(${spreadSize},0)`;
  return rest !== 0 ? result + `;m=m.slice(0,-${spreadSize - rest})` : result;
}

function numbersV2(code: string): string {
  let n = BigInt(code);
  const f = 1n << 20n;
  let s = [];
  for (; n; n = (n / f) | 0n) s.unshift(String.fromCodePoint(Number(n % f)));
  return `n=0n
for(a of"${s.join(``)}")n=n<<20n|BigInt(a.codePointAt())
print(n)`;
}

export default function parseCode(code: string, type: string): string {
  let result = '';
  if (type.toUpperCase() === 'NUMBERS') {
    result = numbersParser(code);
  } else if (type.toUpperCase() === 'TWO-ONE') {
    result = chineseMarks(code);
  } else if (type.toUpperCase() === 'FOUR-ONE') {
    result = enhancedTextParser(code);
  } else if (type.toUpperCase() === 'NUMBERSV2') {
    result = numbersV2(code);
  } else {
    result = anotherTextParser(code);
  }

  return result;
}
