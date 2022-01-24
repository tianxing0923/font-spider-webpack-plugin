import fs from 'fs'
import path from 'path'

/**
 * 字体文件正则
 */
export const regxFont = /\.(woff2|woff|eot|ttf|svg)$/i

/**
 * @font-face正则
 */
export const regxFace = /@font-face[\s]*\{(.+?)\}/gi

/**
 * 临时文件目录
 */
export const tmpPath = path.resolve(__dirname, '../../tmp')

/**
 * 清空目录
 *
 * @export
 * @param {string} dirPath - 目录地址
 */
export function emptyDir(dirPath: string) {
  if (fs.existsSync(dirPath)) {
    let files: string[] = []
    files = fs.readdirSync(dirPath)
    files.forEach(function (file) {
      const curPath = `${dirPath}/${file}`
      if (fs.statSync(curPath).isDirectory()) {
        emptyDir(curPath)
      } else {
        fs.unlinkSync(curPath)
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
export function writeTmp(dirPath: string, source: string | Buffer) {
  if (!fs.existsSync(tmpPath)) {
    fs.mkdirSync(tmpPath)
  }
  if (dirPath.indexOf('/') !== -1) {
    const dirs = dirPath.split('/')
    dirs.pop()
    dirs.reduce((prev, next) => {
      const dir = `${prev}/${next}`
      if (!fs.existsSync(path.resolve(__dirname, `../${dir}`))) {
        fs.mkdirSync(path.resolve(__dirname, `../${dir}`))
      }
      return dir
    }, 'tmp')
  }
  fs.writeFileSync(path.join(tmpPath, dirPath), source)
}

/**
 * 获取路径中的文件名
 *
 * @export
 * @param {string} [pathname='']
 * @returns
 */
export function getFilename(pathname: string = '') {
  return pathname.split('/').pop() || pathname
}
