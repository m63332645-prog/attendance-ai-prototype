/**
 * 前端加签验签工具类
 *
 * 使用 JSEncrypt 库进行 RSA 签名
 * 安装：npm install jsencrypt
 */

import JSEncrypt from 'jsencrypt'

class SignUtil {

  /**
   * 私钥签名
   * @param {string} content - 待签名的内容
   * @param {string} privateKey - 私钥
   * @returns {string} Base64 编码的签名（自动进行 URL 编码处理）
   */
  static sign(content, privateKey) {
    try {
      const encryptor = new JSEncrypt()
      encryptor.setPrivateKey(privateKey)

      // 使用 JSEncrypt 内置的 SHA256 签名方法 (会自动对原始数据进行哈希和签名)
       const signature = encryptor.signSha256(content)
      
      if (!signature) {
        throw new Error('JSEncrypt.signSha256 返回 false 或 null')
      }
      
      // 返回标准 Base64，由 axios 自动进行 URL 编码
      return signature
    } catch (error) {
      console.error('签名失败:', error)
      throw new Error('签名失败：' + error.message)
    }
  }

  /**
   * 对对象进行签名（先排序再拼接）
   * @param {Object} params - 参数对象
   * @param {string} privateKey - 私钥
   * @returns {string} 签名
   */
  static signObject(params, privateKey) {
    const sortedContent = this.buildSortedContent(params)
    return this.sign(sortedContent, privateKey)
  }

  /**
   * 构建排序后的内容（用于签名）
   * @param {Object} params - 参数对象
   * @returns {string} 排序后的字符串
   */
  static buildSortedContent(params) {
    // 复制对象并移除 sign 字段
    const { ...rest } = params
    // 排序键名
    const sortedKeys = Object.keys(rest).sort()

    // 构建查询字符串
    const parts = sortedKeys
      .filter(key => rest[key] !== null && rest[key] !== undefined && rest[key] !== '')
      .map(key => `${key}=${rest[key]}`)

    return parts.join('&')
  }

  /**
   * 从对象中提取签名
   * @param {Object} params - 参数对象
   * @returns {string|null} 签名值
   */
  static extractSign(params) {
    return params.sign || null
  }
}

export default SignUtil