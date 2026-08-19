import http from '../services/http';
import { showToast } from 'vant';

/**
 * 文件上传
 * @param {File|File[]} files - 单个文件或文件数组
 * @param {string} url - 上传接口地址
 * @param {Object} options - 可选配置
 * @returns {Promise} 上传结果
 */
export async function upload(files, url = '/upload', options = {}) {
  const formData = new FormData();
  
  // 处理单个或多个文件
  if (Array.isArray(files)) {
    files.forEach((file, index) => {
      formData.append(options.fieldName || `files[${index}]`, file);
    });
  } else {
    formData.append(options.fieldName || 'file', files);
  }

  // 添加额外数据
  if (options.data) {
    Object.keys(options.data).forEach(key => {
      formData.append(key, options.data[key]);
    });
  }

  try {
    const response = await http.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: options.onProgress,
    });

    return response;
  } catch (error) {
    console.error('上传失败:', error);
    throw error;
  }
}

// 使用方式

// import { upload } from '../utils/upload';

// const handleFileChange = async (e) => {
//   const file = e.target.files[0];
  
//   try {
//     const result = await upload(file, '/upload/image');
//     console.log('上传成功:', result);
//   } catch (error) {
//     console.error('上传失败:', error);
//   }
// };
// const handleUpload = async () => {
//   const file = document.querySelector('input[type="file"]').files[0];
  
//   try {
//     const result = await upload(file, '/upload', {
//       fieldName: 'avatar',  // 自定义字段名
//       data: {               // 额外参数
//         userId: '123',
//         type: 'avatar'
//       },
//       onProgress: (progressEvent) => {
//         const percent = Math.round(
//           (progressEvent.loaded * 100) / progressEvent.total
//         );
//         console.log('上传进度:', percent + '%');
//       }
//     });
    
//     console.log('上传成功:', result);
//   } catch (error) {
//     console.error('上传失败:', error);
//   }
// };