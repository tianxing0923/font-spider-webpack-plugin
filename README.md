# font-spider-webpack-plugin

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
