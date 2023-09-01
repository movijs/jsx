 
module.exports = {
  presets: [
    '@babel/preset-env',
  ],
  plugins: [ 
    [require('./dist/index.js'), { optimize: true, isCustomElement: (tag) => /^x-/.test(tag) }],
  ],
};
