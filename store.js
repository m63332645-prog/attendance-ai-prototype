import { reactive, computed } from "vue";
import {
  CheckType,
  ActivityType,
  AttendanceStatus,
  JobLevel,
  CheckMethod,
  ApprovalStatus,
  AppealStatus,
  MOCK_WORKPLACES,
} from "./constants";
import { showToast, showLoadingToast, closeToast } from "vant";
import {
  calculateDistance,
  getFenceAndCheckType,
  checkIn as apiCheckIn,
  getExemptionCard,
  queryClockIn,
  creatLeave,
  checkClock,
} from "./services/api";
import { getLocation } from "./utils/mafa.js";
import { getDateTimeAfterMinutes } from "./utils/dateFormat";
/**
 * 全局状态管理 Store
 * 使用 Vue 3 reactive 实现响应式状态管理
 * 存储考勤记录、请假申请、豁免卡等核心业务数据
 */
export const store = reactive({
  // ==================== 核心数据 ====================
  /** 当前用户工号 */
  agentCode: "",
  agentName: "",
  departmentName: "",
  position: { lon: 0, lat: 0 },
  agyLaAtndPoints: [],
  agyLaAtndSchedules: [],
  activeSchedule: null,
  isLock: false,
  /** 今日考勤记录 */
  agyLaAtnd: null,
  // 是否已在加载考勤数据
  isLoadingRecords: false,
  // 当月考勤数据
  currentTimeArr: [],
  /** 是否在打卡范围内 */
  detectedWorkplace: false,
  /** 考勤记录数组（按时间倒序） */
  records: [],
  /** 请假申请数组 */
  leaveRequests: [],

  /** 豁免卡数组 */
  exemptionCards: [],

  /** 当前用户职级 */
  currentLevel: JobLevel.FC,

  /** 是否为主管模式 */
  isSupervisorMode: false,

  /** 模拟职场位置（用于测试） */
  mockWorkplace: null,

  /** 演示时间偏移量（分钟） */
  demoTimeOffset: 0,

  /** 基准时间（用于计算演示时间） */
  now: new Date(),

  /** 是否正在定位扫描 */
  isScanning: false,

  // ==================== UI 状态 ====================

  /** 是否显示豁免卡包弹窗 */
  showExemptionPack: false,

  /** 是否显示选择记录弹窗 */
  showSelectRecordForExemption: false,

  /** 是否显示豁免成功弹窗 */
  showExemptionSuccess: false,

  /** 当前选中的豁免卡 */
  selectedExemptionCard: null,

  // ==================== 计算属性 ====================

  /**
   * 获取当前时间（考虑演示时间偏移）
   * @returns {Date} 当前时间对象
   */
  get currentTime() {
    return new Date(this.now.getTime() + this.demoTimeOffset * 60000);
  },

  /**
   * 获取异常考勤记录列表
   * @returns {Array} 状态为 ABNORMAL 的记录数组
   */
  get abnormalRecords() {
    return this.currentTimeArr.filter((r) => r.state === "I");
  },

  /**
   * 获取待审批事项列表
   * 包括：待审批的考勤记录 + 待审批的申诉
   * @returns {Array} 待审批记录数组
   */
  get pendingApprovals() {
    return this.records.filter(
      (r) =>
        r.approvalStatus === ApprovalStatus.PENDING ||
        r.appealStatus === AppealStatus.PENDING,
    );
  },

  /**
   * 获取待审批的请假申请列表
   * @returns {Array} 状态为 PENDING 的请假申请数组
   */
  get pendingLeaves() {
    return this.leaveRequests.filter((l) => l.status === "PENDING");
  },
  get allDates() {
    return this.currentTimeArr.map((r) => r.date);
  },
  // ==================== 初始化方法 ====================

  /**
   * 初始化 Store 数据
   * 从 localStorage 读取持久化数据，若无则使用模拟数据
   */
  init() {
    //获取url中携带的agentCode
    // 从 URL hash 中解析查询参数 (例如: #/?agentCode=SH68669)
    const hash = window.location.hash;
    const queryIndex = hash.indexOf("?");
    if (queryIndex !== -1) {
      const queryString = hash.substring(queryIndex + 1);
      const params = new URLSearchParams(queryString);
      this.agentCode = params.get("agentCode") || "";
      this.token = params.get("token") || "";
      if (this.token) {
        localStorage.setItem("token", this.token);
        sessionStorage.setItem("token", this.token);
        this.loadUserConfig();
        this.getExemptionCard();
        this.queryClockIn();
      } else if (window.MafaJSAPI.isMafaApp()) {
        window.MafaJSAPI.getStartupParams(
          keys.length ? { key: keys } : undefined,
        ).then((res) => {
          this.token = res.data.params.token;
          localStorage.setItem("token", this.token);
          sessionStorage.setItem("token", this.token);
          this.loadUserConfig();
          this.getExemptionCard();
          this.queryClockIn();
        });
      } else {
        showToast("登录信息丢失");
      }
    } else {
      this.agentCode = "";
    }

    // 启动时间更新定时器（每秒更新一次）
    setInterval(() => {
      this.now = new Date();
    }, 1000);
  },

  async loadUserConfig() {
    try {
      showLoadingToast({
        message: "获取排班信息...",
        forbidClick: true,
        duration: 0,
      });

      // 获取定位，添加错误处理
      let locationSuccess = false;
      try {
        locationSuccess = await this.startScanning();
        console.log(locationSuccess);
      } catch (error) {
        console.error("获取定位失败:", error);
        showToast("定位失败，请检查权限设置");
        closeToast();
        return;
      }

      if (!locationSuccess) {
        console.error("获取定位失败");
        showToast("无法获取位置信息");
        closeToast();
        return;
      }

      const { code, data } = await getFenceAndCheckType({
        agentCode: store.agentCode,
        lon: this.position.lon,
        lat: this.position.lat,
      });

      if (code === 200 && data) {
        this.agentName = data.agentName;
        this.departmentName = data.departmentName;
        if (data.agyLaAtndPoints) {
          this.agyLaAtndPoints = data.agyLaAtndPoints;
          console.log("电子围栏配置:", this.agyLaAtndPoints);
        }
        if (data.agyLaAtnd) this.agyLaAtnd = data.agyLaAtnd;
        if (data.agyLaAtndSchedules) {
          if (data.agyLaAtndSchedules.startTime) {
            this.agyLaAtndSchedules = [
              {
                scheduleName: "晨会",
                atndDt: data.agyLaAtndSchedules.atndDt,
                startTime: data.agyLaAtndSchedules.startTime,
                endTime: data.agyLaAtndSchedules.endTime,
                lateTime: getDateTimeAfterMinutes(
                  data.agyLaAtndSchedules.endTime,
                  1,
                ),
                lateEnd: getDateTimeAfterMinutes(
                  data.agyLaAtndSchedules.endTime,
                  15,
                ),
                type: "01",
              },
            ];
          }
          if (data.agyLaAtndSchedules.startTime2) {
            this.agyLaAtndSchedules.push({
              scheduleName: "二早",
              atndDt: data.agyLaAtndSchedules.atndDt,
              startTime: data.agyLaAtndSchedules.startTime2,
              endTime: data.agyLaAtndSchedules.endTime2,
              lateTime: getDateTimeAfterMinutes(
                data.agyLaAtndSchedules.endTime2,
                1,
              ),
              lateEnd: getDateTimeAfterMinutes(
                data.agyLaAtndSchedules.endTime2,
                15,
              ),
              type: "02",
            });
          }
          if (data.atndType && ["01", "02"].includes(data.atndType)) {
            this.activeSchedule = this.agyLaAtndSchedules.find(
              (s) => s.type === data.atndType,
            ) || this.agyLaAtndSchedules[0];
          } else {
            this.activeSchedule = this.agyLaAtndSchedules[0];
          }
        }
        if (data.isLockIn !== undefined) {
          this.detectedWorkplace = data.isLockIn;
          console.log("是否在打卡点内:", data.isLockIn);

          // 清除之前的定时器
          if (this.distanceTimerId) {
            clearInterval(this.distanceTimerId);
            this.distanceTimerId = null;
          }

          // 如果不在打卡范围内，启动定时检测
          this.distanceTimerId = setInterval(() => {
            this.calculateDistance();
          }, 5000);
          console.log("启动距离检测定时器, ID:", this.distanceTimerId);
        }
        if (data.isLock !== undefined) {
          this.isLock = data.isLock;
          console.log("是否已打卡:", data.isLock);
          if (data.isLock && this.distanceTimerId) {
            clearInterval(this.distanceTimerId);
            this.distanceTimerId = null;
          }
        }
      }

      closeToast();
    } catch (err) {
      closeToast();
      console.error("接口请求失败:", err);
      showToast("获取排班失败");
    }
  },
  // 获取豁免卡
  async getExemptionCard() {
    try {
      const response = await getExemptionCard({
        agentCode: this.agentCode,
      });
      if (response) {
        this.exemptionCards = response.data || [];
      }
    } catch (err) {
      console.error("获取豁免卡失败:", err);
    }
  },
  // 查询明细
  async queryClockIn(date) {
    if (this.isLoadingRecords) {
      return;
    }
    try {
      this.isLoadingRecords = true;
      const response = await queryClockIn({
        agentCode: this.agentCode,
        date:
          date ||
          this.currentTime.getFullYear() +
            "-" +
            (this.currentTime.getMonth() + 1).toString().padStart(2, "0"), // 十以内需要加0
      });
      this.currentTimeArr = response?.data || [];
    } catch (err) {
      console.error("查询明细失败:", err);
    } finally {
      this.isLoadingRecords = false;
    }
  },
  // 是否已打卡
  async checkClock(atndTyp) {
    if (this.isLoadingRecords) {
      return;
    }
    try {
      this.isLoadingRecords = true;
      const response = await checkClock({
        agentCode: this.agentCode,
        atndTyp,
      });
      console.log(response);
      if (response) {
        this.isLock = !!response.data || false;
        this.agyLaAtnd = response.data || null;
      }
    } catch (err) {
      console.error("查询明细失败:", err);
    } finally {
      this.isLoadingRecords = false;
    }
  },
  // ==================== 豁免卡相关方法 ====================

  /**
   * 使用豁免卡豁免异常考勤记录
   *
   */
  async useExemptionCard(data) {
    try {
      const response = await creatLeave(data);
      if (response.code === 200) {
        this.showExemptionSuccess = true;
        this.showSelectRecordForExemption = false;
        this.queryClockIn(data.startTime.slice(0, 7));
        this.getExemptionCard();
      } else {
        showToast(response.message);
      }
    } catch (error) {
      console.error("豁免卡豁免异常考勤记录:", error);
    }
  },

  // ==================== 工具方法 与业务无关====================
  /**
   * 重置考勤数据（清空所有记录）
   */
  resetAttendance() {
    this.records = [];
    localStorage.removeItem("agent_records_v4");
  },

  /**
   * 更新模拟职场位置
   *
   * @param {Object|null} wp - 职场对象，null 表示清除模拟位置
   */
  updateMockWorkplace(wp) {
    this.mockWorkplace = wp;

    if (wp) {
      localStorage.setItem("mock_workplace_v4", JSON.stringify(wp));
    } else {
      localStorage.removeItem("mock_workplace_v4");
    }

    // 重新触发定位扫描
    this.startScanning();
  },

  /**
   * 启动定位扫描
   * 获取当前位置并判断是否在预设职场围栏内
   */
  startScanning() {
    this.isScanning = true;
    return new Promise((resolve, reject) => {
      getLocation({ timeout: 5000 })
        .then(({ lat, lon }) => {
          this.position = { lon, lat };
          this.isScanning = false;
          console.log("定位成功:", this.position);
          resolve(true);
        })
        .catch((error) => {
          this.isScanning = false;
          console.error("定位失败:", error.message);
          reject(false);
        });
    });
  },
  // 计算距离
  async calculateDistance() {
    try {
      const pos = await new Promise((resolve, reject) => {
        this.startScanning().then(resolve).catch(reject);
      });

      const distance = await calculateDistance({
        ...this.position,
        pointCode: this.agyLaAtndPoints[0]?.pointCode,
      });
      this.detectedWorkplace = distance.data || false;
      console.log("距离计算结果:", distance);
      return true;
    } catch (error) {
      console.error("计算距离失败:", error);
      return false;
    }
  },
});
