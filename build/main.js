'use strict'

var webpack = require('webpack')
var schemaUtils = require('schema-utils')
var fs = require('fs')
var path = require('path')
var fontSpider = require('font-spider')
var chalk = require('chalk')
var cheerio = require('cheerio')

function _interopDefaultLegacy(e) {
  return e && typeof e === 'object' && 'default' in e ? e : { default: e }
}

var fs__default = /*#__PURE__*/ _interopDefaultLegacy(fs)
var path__default = /*#__PURE__*/ _interopDefaultLegacy(path)
var fontSpider__default = /*#__PURE__*/ _interopDefaultLegacy(fontSpider)
var chalk__default = /*#__PURE__*/ _interopDefaultLegacy(chalk)
var cheerio__default = /*#__PURE__*/ _interopDefaultLegacy(cheerio)

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P
      ? value
      : new P(function (resolve) {
          resolve(value)
        })
  }
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value))
      } catch (e) {
        reject(e)
      }
    }
    function rejected(value) {
      try {
        step(generator['throw'](value))
      } catch (e) {
        reject(e)
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected)
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next())
  })
}

/**
 * 清空目录
 *
 * @export
 * @param {string} dirPath - 目录地址
 */
function emptyDir(dirPath) {
  if (fs__default['default'].existsSync(dirPath)) {
    let files = []
    files = fs__default['default'].readdirSync(dirPath)
    files.forEach(function (file) {
      const curPath = `${dirPath}/${file}`
      if (fs__default['default'].statSync(curPath).isDirectory()) {
        emptyDir(curPath)
      } else {
        fs__default['default'].unlinkSync(curPath)
      }
    })
  }
}
/**
 * 写入临时文件
 *
 * @export
 * @param {string} dirPath - 文件地址
 * @param {(string | Buffer)} source - 内容
 */
function writeTmp(dirPath, source) {
  if (dirPath.indexOf('/') !== -1) {
    const dirs = dirPath.split('/')
    dirs.pop()
    dirs.reduce((prev, next) => {
      const dir = `${prev}/${next}`
      if (!fs__default['default'].existsSync(path__default['default'].join(__dirname, `../${dir}`))) {
        fs__default['default'].mkdirSync(path__default['default'].join(__dirname, `../${dir}`))
      }
      return dir
    }, 'tmp')
  }
  fs__default['default'].writeFileSync(path__default['default'].join(__dirname, `../tmp/${dirPath}`), source)
}
function getFilename(pathname = '') {
  return pathname.split('/').pop() || ''
}

// 选项对象的 schema
const schema = {
  type: 'object',
  properties: {
    fonts: {
      type: 'array',
    },
    fontSpiderOptions: {
      type: 'object',
    },
  },
}
/**
 * 字体文件正则
 */
const regxFont = /\.(woff2|woff|eot|ttf|svg)$/i
/**
 * @font-face正则
 */
const regxFace = /@font-face[\s]*\{(.+?)\}/gi
class FontSpiderWebpackPlugin {
  constructor(options = {}) {
    Object.defineProperty(this, 'manifest', {
      enumerable: true,
      configurable: true,
      writable: true,
      value: new Map(),
    })
    Object.defineProperty(this, 'manifest2', {
      enumerable: true,
      configurable: true,
      writable: true,
      value: new Map(),
    })
    schemaUtils.validate(schema, options, {
      name: 'FontSpiderWebpackPlugin',
      baseDataPath: 'options',
    })
    this.options = options
  }
  apply(compiler) {
    const pluginName = this.constructor.name
    compiler.hooks.compilation.tap(pluginName, (compilation) => {
      // Webpack 5
      if (compilation.hooks.processAssets) {
        compilation.hooks.processAssets.tapPromise(
          {
            name: pluginName,
            stage: webpack.Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
          },
          (assets) => this.optimize(assets, compilation)
        )
      } else if (compilation.hooks.afterOptimizeAssets) {
        // Webpack 4
        compilation.hooks.afterOptimizeAssets.tap(pluginName, (assets) =>
          __awaiter(this, void 0, void 0, function* () {
            return yield this.optimize(assets, compilation)
          })
        )
      }
    })
  }
  /**
   * 处理资源
   *
   * @param {{ [index: string]: sources.Source }} assets - 资源列表
   * @param {Compilation} compilation - Compilation模块
   * @memberof FontSpiderWebpackPlugin
   */
  optimize(assets, compilation) {
    return __awaiter(this, void 0, void 0, function* () {
      if (Object.keys(assets).length === 0) {
        return
      }
      emptyDir(path__default['default'].join(__dirname, '../tmp'))
      const scripts = new Map()
      const allFontFaces = []
      Object.entries(assets).forEach(([pathname, source]) => {
        const content = source.source()
        if (pathname.endsWith('.js')) {
          scripts.set(pathname, content)
        } else if (pathname.endsWith('.css')) {
          const result = content.toString().match(regxFace)
          if (result) {
            allFontFaces.push(...result)
          }
        } else if (regxFont.test(pathname)) {
          const assetInfo = compilation.assetsInfo.get(pathname)
          const filename = getFilename(assetInfo === null || assetInfo === void 0 ? void 0 : assetInfo.sourceFilename)
          if (!filename) return
          this.manifest.set(filename, pathname)
          this.manifest2.set(pathname, filename)
          writeTmp(filename, content)
        }
      })
      if (scripts.size === 0) {
        return
      }
      const files = new Map()
      const fonts = this.options.fonts
      allFontFaces.forEach((value) => {
        const $ = cheerio__default['default'].load('')
        const family = value.match(/font-family:[\s]*['|"]*(.+?)['|"]*;/)
        if (!family || (fonts && !fonts.includes(family[1]))) {
          return
        }
        value = value.replace(/url\(['|"]*(.+?)['|"]*\)/g, ($0, $1) => {
          const hashname = getFilename($1)
          const filename = this.manifest2.get(hashname)
          if (filename) {
            return `url(./${filename})`
          }
          return $0
        })
        $('head').append(`<style>${value}body{${family[0]}}</style>`)
        scripts.forEach((scriptValue) => {
          $('body').append(scriptValue.replace(/</g, '&lt;').replace(/>/g, '&gt;'))
        })
        files.set(family[1], $.html())
      })
      const htmls = []
      files.forEach((value, key) => {
        const url = path__default['default'].join(__dirname, `../tmp/${key}.html`)
        fs__default['default'].writeFileSync(url, value)
        htmls.push(url)
      })
      try {
        yield this.compression(htmls, compilation)
      } catch (e) {
        console.log(chalk__default['default'].red('font spider字体提取压缩异常'))
        Promise.reject(e)
      }
    })
  }
  /**
   * 压缩字体
   *
   * @param {string[]} htmls - 页面路径列表
   * @param {Compilation} compilation - Compilation模块
   * @memberof FontSpiderWebpackPlugin
   */
  compression(htmls, compilation) {
    return __awaiter(this, void 0, void 0, function* () {
      const originalFonts = yield fontSpider__default['default'].spider(htmls, {
        silent: true,
        backup: false,
      })
      if (!originalFonts || originalFonts.length === 0) {
        throw Error('没有提取出任何引用的字体包所要渲染的字符')
      }
      console.log('字体分析提取完毕，进行压缩...')
      const fonts = yield fontSpider__default['default'].compressor(originalFonts, { backup: false })
      fonts.forEach((font) => {
        console.log('')
        console.log(
          chalk__default['default'].green('已提取') +
            chalk__default['default'].bgGreen.black(font.chars.length) +
            chalk__default['default'].green('个') +
            chalk__default['default'].bgGreen.black(font.family) +
            chalk__default['default'].green('字体')
        )
        font.files.forEach((file) => {
          const filename = file.url.substring(file.url.lastIndexOf('tmp/') + 4)
          const source = new webpack.sources.RawSource(fs__default['default'].readFileSync(file.url))
          const hashname = this.manifest.get(filename)
          compilation.updateAsset(hashname, source)
          console.log(
            chalk__default['default'].white(
              `${file.format} 优化后的文件体积为 ${chalk__default['default'].green(
                `${(file.size / 1024).toFixed(2)}KiB`
              )}`
            )
          )
        })
      })
    })
  }
}

module.exports = FontSpiderWebpackPlugin
