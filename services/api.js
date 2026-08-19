import http from '@/utils/request.js';
const baseURL = import.meta.env.VITE_APP_BASE_API || ''
const uploadURL = import.meta.env.VITE_APP_UPLOAD_API || ''
const msgPrefix = import.meta.env.VITE_APP_MSG_URL_PREFIX || ''

console.log("环境变量",import.meta.env);

/**
 * 获取电子围栏、打卡类型
 * @param {string} agentCode
 * @param {string} lon
 * @param {string} lat
 * @returns 
 */
export const getFenceAndCheckType = (params) => {
  return http({
    url: `${baseURL}/api/clockIn/getClockIn`,
    params
  });
};
/**
 * 计算距离
 * @param {string} lon
 * @param {string} lat
 * @param {string} pointCode
 */
export const calculateDistance = (params) => {
  return http({ url: `${baseURL}/api/clockIn/checkDistance`, params });
};

/**
 * 校验是否打卡
 * @param {string} agentCode
 * @param {string} atndTyp
 * @returns 
 */
export const checkClock = (params) => {
  return http({ url: `${baseURL}/api/clockIn/checkClock`, params });
};

/**
 * 打卡
 * @param {string} agentCode
 * @param {string} pointCode
 * @param {string} atndTyp
 * @param {string} lon
 * @param {string} lat
 * @param {string} imageUrl
 * 
 * @returns 
 */
export const checkIn = (data) => {
  return http({ url: `${baseURL}/api/clockIn/clockIn`, params: data });
};

/**
 * 照片上传
 * @param {string} image
 * @returns 
 */
export const uploadImage = (data) => {
  return http({ url: `${uploadURL}/api/file/upload`, data, method: 'post', headers: { 'Content-Type': 'multipart/form-data', "Need-Sign": "true" } });
};

/**
 * 查询明细
 * @param {string} agentCode
 * @returns 
 */
export const queryDetails = (params) => {
  return http({ url: `${baseURL}/api/query/details`, params });
};
/**
 * 查询当月的打卡记录
 * @param {string} agentCode
 * @param {string} date
 * @returns 
 */
export const queryClockIn = (params) => {
  return http({ url: `${baseURL}/api/clockIn/getClock`, params });
};
/**
 * 获取豁免卡
 * @param {string} agentCode
 * @returns 
 */
export const getExemptionCard = (params) => {
  return http({
    url: `${baseURL}/api/clockIn/getExemptionCard`,
    method: 'get',
    params
  });
};
/**
 * 请假
 * 
 * @param {string} agentCode // 营销员编码
 * @param {string} leaveType // 假期类型：05-病假
 * @param {string} startTime // 开始日期
 * @param {string} endTime // 结束日期
 * @param {string} reason // 请假原因
 * @param {string} agentLevel // 可选 营销员等级
 * @param {string} leaveId // 请假ID 可选
 * @param {string} exemptionId // 模板ID 可选
 * @param {string} exLeaveId 
 */
export const creatLeave = (params) => {
  console.log(params);
  
  return http({
    url: `${baseURL}/api/clockIn/creatLeave`,
    method: 'get',
    params
  });
};


// 获取uuid
export const getUuidApi = () => {
  return http({ url: `${baseURL}/api/clockIn/getUUid`, method: 'get' });
};

// 上传图片关联请假，请假专用
/**
 * 
 * @param {*} LeaveId   
 * @param {*} agentCode
 * @param {*} files
 * @returns 
 */
export const uploadFileApi = (data) => {
  return http({ url: `${baseURL}/api/clockIn/uploadFile`, data, method: 'post', headers: { 'Content-Type': 'multipart/form-data'} } );
};
// 获取中宏id
export function getZhonghongID (params) {
  return http({
    url: `${msgPrefix}/ama-sub-insurance/api/v1/getZhonghongId`,
    params
  })
}