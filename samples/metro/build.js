const Metro = require('metro')

Metro.loadConfig().then((config) => {
  Metro.runBuild(config, {
    entry: './src/index.tsx',
    out: './dist/bundle.js',
    onComplete: (blah) => {
      console.log('blahhh', blah)
    },
  })
})
