module.exports = {
  printWidth: 80,
  trailingComma: 'es5',
  tabWidth: 2,
  proseWrap: 'preserve',
  semi: true,
  arrowParens: 'always',
  singleQuote: true,
  endOfLine: 'auto',
  overrides: [
    {
      files: '*.json',
      options: {
        parser: 'json',
      },
    },
    {
      files: '*.js',
      options: {
        parser: 'espree',
      },
    },
    {
      files: '*.ts?x',
      options: {
        parser: 'typescript',
      },
    },
  ],
}
