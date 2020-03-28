module.exports = {
  transformer: {
    babelTransformerPath: require.resolve('react-native-typescript-transformer'),
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
      },
    }),
  },
  resolver: {
    sourceExts: ['.ts', '.tsx', '.js', '.jsx'],
  },
}
