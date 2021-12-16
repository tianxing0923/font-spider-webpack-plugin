/// <reference types="node" />
/**
 * 清空目录
 *
 * @export
 * @param {string} dirPath - 目录地址
 */
export declare function emptyDir(dirPath: string): void
/**
 * 写入临时文件
 *
 * @export
 * @param {string} dirPath - 文件地址
 * @param {(string | Buffer)} source - 内容
 */
export declare function writeTmp(dirPath: string, source: string | Buffer): void
export declare function getFilename(pathname?: string): string
