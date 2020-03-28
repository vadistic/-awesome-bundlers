module.exports = {
  watcher: ['src'],
  files: {
    javascripts: {
      joinTo: {
        'bundle.js': /\.(ts|js|tsx+jsx)$/, // matches all JavaScript files
      },
    },
  },
}
