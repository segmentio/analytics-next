module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          ie: '11', // target es5 -- for example, react-native's QuickJS does not support class
        },
      },
    ],
  ],
}
