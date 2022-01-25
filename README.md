# font-spider-webpack-plugin

[![npm][npm]][npm-url]
[![node][node]][node-url]
[![tests][tests]][tests-url]

基于 [font-spider](https://github.com/aui/font-spider) 的 webpack 插件，支持 webpack v4 和 v5。

## 安装

```shell
npm install font-spider-webpack-plugin --save-dev
```

## 使用

```javascript
const FontSpiderPlugin = require('font-spider-webpack-plugin')

// 默认处理所有字体
module.exports = {
  plugins: [
    // ...
    new FontSpiderPlugin(),
  ],
}

// 只设置需要处理的字体
module.exports = {
  plugins: [
    // ...
    new FontSpiderPlugin({
      fonts: [],
      fontSpiderOptions: {},
    }),
  ],
}
```

## Options

|                     Name                      |      Type       | Default | Description         |
| :-------------------------------------------: | :-------------: | :-----: | :------------------ |
|             **[`fonts`](#fonts)**             | `Array<String>` |  `[]`   | 声明的`font-family` |
| **[`fontSpiderOptions`](#fontSpiderOptions)** |    `Object`     |  `{}`   | `font-spider`配置项 |

## License

[MIT](./LICENSE)

[npm]: https://img.shields.io/npm/v/font-spider-webpack-plugin.svg
[npm-url]: https://npmjs.com/package/font-spider-webpack-plugin
[node]: https://img.shields.io/node/v/font-spider-webpack-plugin.svg
[node-url]: https://nodejs.org
[tests]: https://github.com/tianxing0923/font-spider-webpack-plugin/actions/workflows/npm-publish.yml/badge.svg
[tests-url]: https://github.com/tianxing0923/font-spider-webpack-plugin/actions
