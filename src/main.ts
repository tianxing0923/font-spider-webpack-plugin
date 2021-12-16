import { Compilation, Compiler, sources } from 'webpack'
import { validate } from 'schema-utils'
import { Schema } from 'schema-utils/declarations/validate'
import fs from 'fs'
import path from 'path'
import fontSpider from 'font-spider'
import chalk from 'chalk'
import cheerio from 'cheerio'
import { emptyDir, getFilename, writeTmp } from './utils'

// 选项对象的 schema
const schema: Schema = {
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
 * font-spider配置选项
 *
 * @interface FontSpiderOptions
 */
interface FontSpiderOptions {
  /**
   * 忽略加载的文件规则（支持正则） - 与 `resourceIgnore` 参数互斥
   * @type    {Array<String>}
   */
  ignore: string[]

  /**
   * 映射的文件规则（支持正则） - 与 `resourceMap` 参数互斥 - 可以将远程字体文件映射到本地来
   * @type    {Array<Array<String>>}
   * @example [['http://font-spider.org/font', __dirname + '/font'], ...]
   */
  map: string[][]

  /**
   * 是否支持备份原字体
   * @type    {Boolean}
   */
  backup: boolean

  /**
   * 是否对查询到的文本进行去重处理
   * @type    {Boolean}
   */
  unique: boolean

  /**
   * 是否排序查找到的文本
   * @type    {Boolean}
   */
  sort: boolean

  /**
   * 是否开启调试模式
   * @type    {Boolean}
   */
  debug: boolean

  /**
   * 是否支持加载外部 CSS 文件
   */
  loadCssFile: boolean

  /**
   * 是否忽略内部解析错误-关闭它有利于开发调试
   * @type    {Boolean}
   */
  silent: boolean

  /**
   * 请求超时限制
   * @type    {Number}    毫秒
   */
  resourceTimeout: number

  /**
   * 最大的文件加载数量限制
   * @type    {Number}    数量
   */
  resourceMaxNumber: number

  /**
   * 是否缓存请求成功的资源
   * @type    {Boolean}
   */
  resourceCache: boolean

  /**
   * 映射资源路径 - 与 `map` 参数互斥
   * @param   {String}    旧文件地址
   * @return  {String}    新文件地址
   */
  resourceMap(file: string): string

  /**
   * 忽略资源 - 与 `ignore` 参数互斥
   * @param   {String}    文件地址
   * @return  {Boolean}   如果返回 `true` 则忽略当当前文件的加载
   */
  resourceIgnore(file: string): boolean

  /**
   * 资源加载前的事件
   * @param   {String}    文件地址
   */
  resourceBeforeLoad(file: string): void

  /**
   * 加载远程资源的自定义请求头
   * @param   {String}    文件地址
   * @return  {Object}
   */
  resourceRequestHeaders(file: string): { [k: string]: string }
}

export interface FontSpiderWebpackPluginOptions {
  fonts?: string[]
  fontSpiderOptions?: FontSpiderOptions
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
  declare options: FontSpiderWebpackPluginOptions
  manifest = new Map()
  manifest2 = new Map()
  constructor(options: FontSpiderWebpackPluginOptions = {}) {
    validate(schema, options, {
      name: 'FontSpiderWebpackPlugin',
      baseDataPath: 'options',
    })
    this.options = options
  }

  apply(compiler: Compiler) {
    const pluginName = this.constructor.name
    compiler.hooks.compilation.tap(pluginName, (compilation) => {
      // Webpack 5
      if (compilation.hooks.processAssets) {
        compilation.hooks.processAssets.tapPromise(
          {
            name: pluginName,
            stage: Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
          },
          (assets) => this.optimize(assets, compilation)
        )
      } else if (compilation.hooks.afterOptimizeAssets) {
        // Webpack 4
        compilation.hooks.afterOptimizeAssets.tap(
          pluginName,
          async (assets) => await this.optimize(assets, compilation)
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
  async optimize(assets: { [index: string]: sources.Source }, compilation: Compilation) {
    if (Object.keys(assets).length === 0) {
      return
    }
    emptyDir(path.join(__dirname, '../tmp'))
    const scripts = new Map()
    const allFontFaces: string[] = []
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
        const filename = getFilename(assetInfo?.sourceFilename)
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
      const $ = cheerio.load('')
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

    const htmls: string[] = []
    files.forEach((value, key) => {
      const url = path.join(__dirname, `../tmp/${key}.html`)
      fs.writeFileSync(url, value)
      htmls.push(url)
    })

    try {
      await this.compression(htmls, compilation)
    } catch (e) {
      console.log(chalk.red('font spider字体提取压缩异常'))
      Promise.reject(e)
    }
  }

  /**
   * 压缩字体
   *
   * @param {string[]} htmls - 页面路径列表
   * @param {Compilation} compilation - Compilation模块
   * @memberof FontSpiderWebpackPlugin
   */
  async compression(htmls: string[], compilation: Compilation) {
    const originalFonts = await fontSpider.spider(htmls, {
      silent: true,
      backup: false,
    })
    if (!originalFonts || originalFonts.length === 0) {
      throw Error('没有提取出任何引用的字体包所要渲染的字符')
    }
    console.log('字体分析提取完毕，进行压缩...')
    const fonts = await fontSpider.compressor(originalFonts, { backup: false })
    fonts.forEach((font: { chars: string; family: string; files: { format: string; size: number; url: string }[] }) => {
      console.log('')
      console.log(
        chalk.green('已提取') +
          chalk.bgGreen.black(font.chars.length) +
          chalk.green('个') +
          chalk.bgGreen.black(font.family) +
          chalk.green('字体')
      )
      font.files.forEach((file: { format: string; size: number; url: string }) => {
        const filename = file.url.substring(file.url.lastIndexOf('tmp/') + 4)
        const source = new sources.RawSource(fs.readFileSync(file.url))
        const hashname = this.manifest.get(filename)
        compilation.updateAsset(hashname, source)
        console.log(
          chalk.white(`${file.format} 优化后的文件体积为 ${chalk.green(`${(file.size / 1024).toFixed(2)}KiB`)}`)
        )
      })
    })
  }
}

export default FontSpiderWebpackPlugin
