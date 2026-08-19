/**
 * 将 base64 字符串转换为 File 对象
 * @param {string} base64 - base64 字符串（可以带或不带 data:image/jpeg;base64, 前缀）
 * @param {string} fileName - 文件名，默认 'photo.jpg'
 * @returns {File|null} File 对象，如果转换失败返回 null
 */
export const base64ToFile = (base64, fileName = 'photo.jpg') => {
  // 检查输入是否有效
  if (!base64 || typeof base64 !== 'string') {
    console.error('base64 数据无效:', base64);
    return null;
  }

  let base64Data = base64;
  let mime = 'image/jpeg'; // 默认 MIME 类型

  // 判断是否包含 data URI 前缀
  if (base64.startsWith('data:')) {
    // 标准格式：data:image/jpeg;base64,xxxxx
    const commaIndex = base64.indexOf(',');
    if (commaIndex === -1) {
      console.error('base64 格式错误，缺少逗号分隔符');
      return null;
    }
    
    const header = base64.substring(0, commaIndex);
    const mimeMatch = header.match(/:(.*?);/);
    
    if (mimeMatch && mimeMatch[1]) {
      mime = mimeMatch[1];
    }
    
    base64Data = base64.substring(commaIndex + 1);
  }
  // 否则就是纯 base64 数据，直接使用

  // 验证 base64 数据是否有效
  if (!base64Data || base64Data.length === 0) {
    console.error('base64 数据为空');
    return null;
  }

  try {
    const bstr = atob(base64Data);
    const n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    for (let i = 0; i < n; i++) {
      u8arr[i] = bstr.charCodeAt(i);
    }
    
    return new File([u8arr], fileName, { type: mime });
  } catch (error) {
    console.error('base64 解码失败:', error);
    console.error('原始数据长度:', base64Data.length);
    console.error('原始数据前50字符:', base64Data.substring(0, 50));
    return null;
  }
};