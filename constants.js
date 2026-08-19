export const CheckType = {
  IN: 'IN',
  OUT: 'OUT'
};

export const ActivityType = {
  MORNING: '晨会',
  SECOND_MORNING: '二早',
  VISIT: '外勤拜访',
  TRAINING: '培训',
  OTHER: '其他'
};

/**
 * 考勤状态枚举
 */
export const AttendanceStatus = {
  /** 正常 */
  NORMAL: 'NORMAL',
  /** 迟到 */
  LATE: 'LATE',
  /** 异常（如缺卡等） */
  ABNORMAL: 'ABNORMAL',
  /** 待打卡/即将开始 */
  UPCOMING: 'UPCOMING',
  /** 已过期/已结束 */
  EXPIRED: 'EXPIRED',
  /** 请假中 */
  LEAVE: 'LEAVE',
  /** 豁免（如计勤豁免） */
  EXEMPTED: 'EXEMPTED'
};

export const JobLevel = {
  FC: 'FC 营销员',
  UM: 'UM 业务经理',
  SUM: 'SUM 高级业务经理',
  BM: 'BM 营业部经理',
  SBM: 'SBM 高级营业部经理'
};

export const CheckMethod = {
  GEOLOCATION: 'GEOLOCATION',
  FACIAL: 'FACIAL',
  BLUETOOTH: 'BLUETOOTH',
  PHOTO: 'PHOTO'
};

/**
 * 审批状态枚举
 */
export const ApprovalStatus = {
  /** 无需审批 */
  NOT_REQUIRED: 'NOT_REQUIRED',
  /** 待审批 */
  PENDING: 'PENDING',
  /** 已通过 */
  APPROVED: 'APPROVED',
  /** 已拒绝 */
  REJECTED: 'REJECTED'
};
export const AppealStatus = {
  NONE: 'NONE',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

export const LeaveType = {
  "16": '结婚',
  "17": '生育',
  "03": '流产',
  "04": '陪产',
  "05": '生病',
  "06": '丧事',
  "07": '子女中、高考',
};
// 是否为请假状态
export const IsLeaveStatus  = (type) =>{
  return {
    bool: type in LeaveType,
    name: LeaveType[type] || ""
  }
}

export const HMLeaveType = {
  "08": '星钻豁免',
  "09": '奖励豁免',
  "10": '特殊情况',
  "11": '业务活动/培训',
  "12": '一早申诉',
  "13": '二早申诉',
  "14": '一早豁免',
  "15": '二早豁免'
}
// 是否显示为正常考勤状态
export const IsNormalAttendance = (type) =>{
  return  type in HMLeaveType
}

export const LeaveRules = {
  '16': { maxDays: 7, deadlineDays: 180, description: '结婚者享有计勤豁免期7天（自然日），豁免申请最晚应于婚姻注册登记次日起180天内提出，并附结婚登记材料。' },
  '17': { maxDays: 120, deadlineDays: 60, description: '女性营销员分娩，享有计勤豁免期120天（自然日），豁免申请最晚应于分娩次日起两个月内提出，并附医院（二级以上）就诊及检查证明或出生证。如当地政府有更长产假的明文规定，以当地政府规定为准。' },
  '03': {
    maxDays: 40, // 默认40，实际逻辑中根据怀孕时长判断
    deadlineDays: 14,
    description: '女性营销员流产，怀孕不满四月流产者，可享有计勤豁免期20天（自然日），怀孕满四个月流产者，可享有计勤豁免期40天（自然日）。豁免申请最晚应于流产次日起两周内提出，并附医院（二级以上）就诊及检查证明。'
  },
  '04': { maxDays: 5, deadlineDays: 7, description: '男性营销员在配偶生育时享有计勤豁免期5天（自然日），豁免申请最晚应于配偶分娩次日起一周内提出，并附医院（二级以上）就诊及检查证明或出生证。' },
  '05': { maxDays: 999, deadlineDays: 3, description: '营销员因病确不能参加晨会的，享有计勤豁免，豁免申请最晚应于确诊后3天内提出，并附医院（二级以上）就诊及检查证明及病假单。' },
  '06': {
    maxDays: 7, // 默认7，实际逻辑中根据亲属关系判断
    deadlineDays: 7,
    description: '父母、配偶父母、配偶、子女身故，享有计勤豁免期7天（自然日），祖父母、外祖父母、兄弟姐妹身故，享有计勤豁免期3天（自然日），豁免申请最晚应于亲属死亡次日起1周内提出，并提供相关证明文件。'
  },
  '07': { maxDays: 3, deadlineDays: 0, description: '若营销员的直系子女参加中、高考，中、高考的考试日期内该营销员可享有计勤豁免期最多3天（包括无出席排班的日期），并提供考生准考证复印件及关系证明文件。' }
};

export const MOCK_WORKPLACES = [
  {
    id: 'wp_renmin',
    name: '人民广场营销服务部',
    institution: '中宏人寿上海分公司',
    managementOffice: '人广第一营管处',
    latitude: 31.2317,
    longitude: 121.4726,
    radius: 500
  },
  {
    id: 'wp_changning',
    name: '长宁营销服务部',
    institution: '中宏人寿上海分公司',
    managementOffice: '长宁区本部营管处',
    latitude: 31.2172,
    longitude: 121.4133,
    radius: 500
  },
  {
    id: 'wp_jingan',
    name: '静安营销服务部',
    institution: '中宏人寿上海分公司',
    managementOffice: '静安静安寺营管处',
    latitude: 31.2304,
    longitude: 121.4737,
    radius: 500
  }
];



