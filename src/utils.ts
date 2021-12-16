import fs from 'fs'
import path from 'path'

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
  if (dirPath.indexOf('/') !== -1) {
    const dirs = dirPath.split('/')
    dirs.pop()
    dirs.reduce((prev, next) => {
      const dir = `${prev}/${next}`
      if (!fs.existsSync(path.join(__dirname, `../${dir}`))) {
        fs.mkdirSync(path.join(__dirname, `../${dir}`))
      }
      return dir
    }, 'tmp')
  }
  fs.writeFileSync(path.join(__dirname, `../tmp/${dirPath}`), source)
}

export function getFilename(pathname: string = '') {
  return pathname.split('/').pop() || ''
}
