import typescript from '@rollup/plugin-typescript'
import { terser } from "rollup-plugin-terser"

export default {
    input: 'src/index.ts',
    output: [
        {
            file: 'dist/javascript-parser.esm.js',
            format: 'es'
        },
        {
            file: 'dist/javascript-parser.cjs.js',
            format: 'cjs',
            exports: 'default'
        },
        {
            file: 'dist/javascript-parser.min.js',
            format: 'iife',
            name: 'jsParser'
        }
    ],
    plugins: [typescript(), terser()]
}