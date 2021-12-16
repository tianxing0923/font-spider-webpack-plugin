import { Compilation, Compiler, sources } from 'webpack'
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
  resourceRequestHeaders(file: string): {
    [k: string]: string
  }
}
export interface FontSpiderWebpackPluginOptions {
  fonts?: string[]
  fontSpiderOptions?: FontSpiderOptions
}
declare class FontSpiderWebpackPlugin {
  options: FontSpiderWebpackPluginOptions
  manifest: Map<any, any>
  manifest2: Map<any, any>
  constructor(options?: FontSpiderWebpackPluginOptions)
  apply(compiler: Compiler): void
  /**
   * 处理资源
   *
   * @param {{ [index: string]: sources.Source }} assets - 资源列表
   * @param {Compilation} compilation - Compilation模块
   * @memberof FontSpiderWebpackPlugin
   */
  optimize(
    assets: {
      [index: string]: sources.Source
    },
    compilation: Compilation
  ): Promise<void>
  /**
   * 压缩字体
   *
   * @param {string[]} htmls - 页面路径列表
   * @param {Compilation} compilation - Compilation模块
   * @memberof FontSpiderWebpackPlugin
   */
  compression(htmls: string[], compilation: Compilation): Promise<void>
}
export default FontSpiderWebpackPlugin
