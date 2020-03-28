// rollup.config.js
import compiler from '@ampproject/rollup-plugin-closure-compiler'

export default {
  input: 'main.js',
  output: {
    file: 'dist/bundle.js',
    format: 'es',
  },
  plugins: [compiler()],
}
