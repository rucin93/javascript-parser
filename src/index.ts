import { createCharDec } from './utils'

function textParser(code: string): string {
    let _ = ';' + code.replace(/(\r\n|\n|\r)/gm, '\\n');
    const length = _.length
    length % 3 !== 0 ? _ += ' '.repeat(3 - length % 3) : '';

    const test = _.match(/.../g).map(chars => {
        let result = 0
        chars.split('').reverse().forEach(char => {
            result *= 97
            result += char.charCodeAt(0) - 31
        })
        return result
    }).map(e => String.fromCodePoint(e)).join('')
    return `t=0;for(c of\`${test}\`)for(v=c.codePointAt();v|0;v/=97)t+=String.fromCharCode(v%97+31);eval(t)`
}

function numbersParser(code: string): string {
    const spreadSize = 6;
    let _ = code;
    const length = _.length
    const rest = length % spreadSize;
    rest !== 0 ? _ += '0'.repeat(rest) : '';

    const test = _.match(new RegExp(`.{${spreadSize}}`,'g')).map(num => createCharDec(num)).join(``)

    return `m='';for(x of\`${test}\`)m+=\`\${x.codePointAt()}\`.padStart(${spreadSize},0)`
}

export default function parseCode(code: string, type: string): string {
    let result = '';
    if (type.toUpperCase() === 'NUMBERS') {
        result = numbersParser(code);
    } else {
        result = textParser(code);
    }

    return result;
}