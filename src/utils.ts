export function createCharDec(nr: string) : string {
    return eval(`'\\u{${parseInt(nr).toString(16)}}'`)
}