<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from "vue";
import { useRouter } from "vue-router";

import {
  MapPin,
  Clock,
  Loader2,
  ChevronDown,
  Target,
  Camera,
  X,
  Check,
  CheckCircle2,
  AlertCircle,
  FastForward,
  Edit,
} from "lucide-vue-next";
import { store } from "../store";
import AttendanceTipsCard from "./AttendanceTipsCard.vue";

const router = useRouter();

/**
 * 打卡按钮组件
 * 完整业务流程：点击打卡 → 拍照 → 退出相机 → 上传照片(loading) → 获取定位 → 调用打卡接口 → 显示成功状态
 */

// ==================== Props 定义 ====================

const props = defineProps({
  /** 上次打卡动作类型（IN/OUT） */
  lastAction: {
    type: String,
    default: null,
  },

  /** 预设职场列表 */
  workplaces: {
    type: Array,
    required: true,
  },

  /** 模拟位置对象（用于测试） */
  mockLocation: {
    type: Object,
    default: null,
  },

  /** 演示时间（支持时间偏移） */
  demoTime: {
    type: Date,
    default: () => new Date(),
  },
  /** 是否正在定位扫描 */
  isScanning: {
    type: Boolean,
    default: false,
  },
});

// ==================== Emits 定义 ====================

const emit = defineEmits(["check"]);

// ==================== 时间段配置 ====================
const scheduleConfig = {
  晨会: {
    checkInStart: "07:00:00",
    checkInEnd: "09:15:59",
    lateStart: "09:16:00",
    lateEnd: "09:30:59",
  },
  "晨会-二次": {
    checkInStart: "10:00:00",
    checkInEnd: "10:15:00",
  },
};

// 根据系统时间自动判断当前所处时间段
const autoDetectSchedule = () => {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("zh-CN", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
  // 晨会-二次时间段：10:00:00 - 10:30:00
  if (timeStr >= "10:00:00" && timeStr <= "10:30:00") return "晨会-二次";
  // 晨会时间段：07:00:00 - 09:30:59
  if (timeStr >= "07:00:00" && timeStr <= "09:30:59") return "晨会";
  // 默认晨会
  return "晨会";
};

// ==================== 下拉框状态 ====================
const showScheduleDropdown = ref(false);
const selectedSchedule = ref(autoDetectSchedule());
const scheduleOptions = ["晨会", "晨会-二次"];

const selectSchedule = (item) => {
  selectedSchedule.value = item;
  showScheduleDropdown.value = false;
};

// 触摸切换下拉框（手机端兼容）
const toggleDropdownTouch = (e) => {
  e.preventDefault();
  e.stopPropagation();
  showScheduleDropdown.value = !showScheduleDropdown.value;
};

// 触摸选择选项（手机端兼容）
const selectScheduleTouch = (item, e) => {
  e.preventDefault();
  e.stopPropagation();
  selectSchedule(item);
};

// 当前时间字符串（HH:mm:ss）
const currentTimeStr = computed(() => {
  const now = new Date();
  return now.toLocaleTimeString("zh-CN", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
});

// 当前选中排班的配置
const currentConfig = computed(() => scheduleConfig[selectedSchedule.value]);

// 是否在打卡窗口内
const isInCheckInWindow = computed(() => {
  return currentTimeStr.value >= currentConfig.value.checkInStart &&
         currentTimeStr.value <= currentConfig.value.checkInEnd;
});

// 是否在迟到时间段内（仅晨会）
const isInLateWindow = computed(() => {
  const cfg = currentConfig.value;
  if (!cfg.lateStart || !cfg.lateEnd) return false;
  return currentTimeStr.value >= cfg.lateStart &&
         currentTimeStr.value <= cfg.lateEnd;
});

// 是否在可打卡时间段（打卡窗口 + 迟到时间段）
const isInTimeWindow = computed(() => {
  return isInCheckInWindow.value || isInLateWindow.value;
});

// 当前打卡状态：on-time / late / none
const attendanceStatus = computed(() => {
  if (isInCheckInWindow.value) return "on-time";
  if (isInLateWindow.value) return "late";
  return "none";
});

// 打卡窗口显示文本
const checkWindowText = computed(() => {
  const cfg = currentConfig.value;
  if (selectedSchedule.value === '晨会-二次') {
    return `打 卡 窗 口：${cfg.checkInStart} - ${cfg.checkInEnd}`;
  }
  return `打 卡 窗 口：${cfg.checkInStart} - ${cfg.checkInEnd}；迟到时间段：${cfg.lateStart} - ${cfg.lateEnd}`;
});

// 状态标签文本
const statusLabelText = computed(() => {
  if (attendanceStatus.value === "late") return "迟到打卡";
  return "准时打卡";
});

// 状态标签颜色
const statusLabelColor = computed(() => {
  if (attendanceStatus.value === "late") return "#F49600";
  return "#00A758";
});

// 时段提示文本
const periodText = computed(() => {
  if (attendanceStatus.value === "late") return "迟到时段";
  return "准时时段";
});

// 打卡按钮颜色
const checkInBtnColor = computed(() => {
  if (attendanceStatus.value === "late") return "#F49600";
  return "#00A758";
});

// 点击外部关闭下拉框（延迟判断，避免与toggle冲突）
const handleClickOutside = () => {
  if (showScheduleDropdown.value) {
    showScheduleDropdown.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});

// ==================== 计算属性 ====================
const formattedTime = computed(() => {
  return props.demoTime.toLocaleTimeString("zh-CN", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
});
const activeSchedule = computed(() => {
  return store.activeSchedule || null;
});
// 电子围栏
const agyLaAtndPoints = computed(() => {
  return store.agyLaAtndPoints;
});
// 打卡地点显示
const workplaceName = computed(() => {
  if (!agyLaAtndPoints.value[0]) {
    return "";
  }
  if (!store.detectedWorkplace) {
    return "范围外";
  }
  return agyLaAtndPoints.value[0].pointName;
});
// 打卡类型
const agyLaAtndSchedules = computed(() => {
  return store.agyLaAtndSchedules;
});
/** 今日是否已完成打卡 */
const isCompleted = computed(() => {
  return store.isLock;
});

const agyLaAtnd = computed(() => {
  return store.agyLaAtnd;
});

// 打卡时间
const makeDate = computed(() => {
  return agyLaAtnd.value?.makeDate || null;
});

// ==================== 响应式状态 ====================
const loading = ref(false);
const isAnalyzing = ref(false); // 是否正在分析
const isRecognized = ref(false); // 是否识别成功
const capturedPhoto = ref(null);

const error = ref(null);
const autoInfoError = computed(() => {
  if (store.agentName) {
    if (!store.activeSchedule) {
      return "无排班信息, 无需打卡, 如有疑问, 请联系管理员！";
    }
    if (!store.agyLaAtndPoints.length) {
      return "未配置打卡地点，请联系管理员";
    }
  }
  return "";
});
// const selectedActivity = ref(ActivityType.MORNING);
const showActivityMenu = ref(false);
const isAutoSuggested = ref(true);

const isCameraOpen = ref(false);
const videoRef = ref(null);
const canvasRef = ref(null);

// ==================== 核心方法 ====================

const selectInType = (item) => {
  console.log(item, "item");
  store.activeSchedule =
    agyLaAtndSchedules.value.filter(
      (schedule) => schedule.type === item.code,
    )[0] || null;
  isAutoSuggested.value = false;
  store.checkClock(item.code);
};
const transformScheduleToActivities = (schedule) => {
  // type: ActivityType.OTHER,
  // name: "其他",
  // startTime: "00:00",
  // endTime: "23:59",
};

// const openCamera = async () => {
//   isCameraOpen.value = true;
//   capturedPhoto.value = null;
//   photoUrl.value = null;

//   try {
//     const stream = await navigator.mediaDevices.getUserMedia({
//       video: { facingMode: "user" },
//       audio: false,
//     });

//     if (videoRef.value) {
//       videoRef.value.srcObject = stream;
//     }
//   } catch (err) {
//     console.error("Error accessing camera:", err);
//     showToast("无法访问摄像头，请检查权限");
//     isCameraOpen.value = false;
//   }
// };

const stopCamera = () => {
  if (videoRef.value && videoRef.value.srcObject) {
    const tracks = videoRef.value.srcObject.getTracks();
    tracks.forEach((track) => track.stop());
    videoRef.value.srcObject = null;
  }
  isCameraOpen.value = false;
};

// const takePhoto = () => {
//   if (!videoRef.value || !canvasRef.value) return;

//   const context = canvasRef.value.getContext("2d");

//   canvasRef.value.width = videoRef.value.videoWidth;
//   canvasRef.value.height = videoRef.value.videoHeight;

//   context.drawImage(
//     videoRef.value,
//     0,
//     0,
//     canvasRef.value.width,
//     canvasRef.value.height,
//   );

//   capturedPhoto.value = canvasRef.value.toDataURL("image/jpeg");

//   stopCamera();

//   uploadPhoto();
// };

// const uploadPhoto = async () => {
//   if (!capturedPhoto.value) {
//     showToast("照片数据异常，请重新拍摄");
//     return;
//   }

//   loading.value = true;
//   error.value = null;

//   try {
//     const formData = new FormData();
//     formData.append("file", dataURLtoFile(capturedPhoto.value, "photo.jpg"));

//     const uploadResponse = await uploadImage(formData);

//     photoUrl.value =
//       uploadResponse.url || uploadResponse.data?.url || uploadResponse.fileUrl;

//     if (!photoUrl.value) {
//       throw new Error("未获取到照片URL");
//     }
//     console.log("照片上传成功，URL:", photoUrl.value);
//     await getLocationAndCheckIn();
//   } catch (err) {
//     console.error("照片上传失败:", err);
//     error.value = "照片上传失败，请重试";
//     loading.value = false;
//   }
// };
// 使用 Cordova 调用相机
const takePhotoWithCordova = async () => {
  if (loading.value) return;
  window.CordovaBridge.jsCallCordovaPlugin("camera", "getPicture", {
    quality: 80,
    destinationType: 0,
    sourceType: 1,
    encodingType: 0,
    cameraDirection: 0,
  });
  window.sensorsH5?.track("AMAClick", {
    page_title: "首页",
    tab_name: "首页",
    module_name: "打卡功能区",
    click_type: "opr_click",
    click_name: "打卡",
    element_click_value: "clock_in_complete",
    agent_code: store.agentCode,
  });
};
let cameraTakePhotoListener = null;
onMounted(() => {
  cameraTakePhotoListener = document.addEventListener(
    "camera.getPicture",
    function (e) {
      var imgsrc = e["detail"]["data"];
      var newImage = imgsrc.substring(0, 5);
      if (newImage == "error") {
        console.error(newImage);
        showToast("无法获取相机，请检查权限是否打开");
        return;
      }
      const imageData = e.detail.data; // base64 或文件 URL
      const file = base64ToFile(imageData);
      handleAction(file);
    },
  );
});
onUnmounted(() => {
  document.removeEventListener("camera.getPicture", cameraTakePhotoListener);
});
// 打卡接口
const performCheckIn = async () => {
  loading.value = true;
  const pointCode = store.agyLaAtndPoints[0]?.pointCode || "";
  const checkData = {
    agentCode: store.agentCode,
    lat: store.position.lat,
    lon: store.position.lon,
    pointCode: pointCode,
    atndTyp: store.activeSchedule.type,
    imageUrl: capturedPhoto.value,
  };
  try {
    const { code, data, message } = await apiCheckIn(checkData);
    if (code !== 200) {
      error.value = message;
      return;
    }
    store.isLock = true;
    store.queryClockIn();
    capturedPhoto.value = null;
  } catch (err) {
    error.value = "打卡失败，请重试";
  } finally {
    loading.value = false;
  }
};
// 创建input 元素并上传文件
// const createInputAndUpload = async () => {
//   const input = document.createElement("input");
//   input.type = "file";
//   input.click();
//   input.addEventListener("change", (e) => {
//     const file = e.target.files[0];
//     handleAction(file);
//   });
// };
const handleAction = async (file) => {
  capturedPhoto.value = URL.createObjectURL(file);
  isAnalyzing.value = true;
  uploadImage({ file })
    .then((url) => {
      isRecognized.value = true;
      console.log("上传成功，URL:", url);
      capturedPhoto.value = url;
      performCheckIn();
    })
    .catch((error) => {
      console.error("照片上传失败:", error);
      error.value = "照片上传失败，请重试";
      isRecognized.value = false;
    })
    .finally(() => {
      isAnalyzing.value = false;
    });
};

const handleCheckInSuccess = () => {
  router.push('/checkin-success');
};

onUnmounted(() => {
  URL.revokeObjectURL(capturedPhoto.value);
});
</script>

<template>
  <div class="relative">
    <div
      class="bg-white rounded-[32px] p-6 shadow-xl border border-gray-100 min-h-[460px] flex flex-col relative overflow-hidden"
      style="-webkit-mask-image: -webkit-radial-gradient(white, black)"
    >
      <div
        class="absolute -right-20 -top-20 w-64 h-64 bg-[#CAEED9] rounded-full blur-3xl opacity-30"
      />
      <div
        class="absolute -left-20 -bottom-20 w-64 h-64 bg-[#CAEED9] rounded-full blur-3xl opacity-20"
      />
      <div class="relative z-10 flex-1 flex flex-col">
        <!-- 晨会/二早下拉选择行 -->
        <div class="flex flex-col gap-1.5 mb-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5 relative">
              <!-- 下拉框样式标签 - 响应式尺寸 -->
              <div
                class="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-gray-50 rounded-full border border-gray-100 cursor-pointer hover:bg-gray-100 active:bg-gray-200 transition-colors group select-none"
                @click.stop="showScheduleDropdown = !showScheduleDropdown"
                @touchend.stop="toggleDropdownTouch($event)"
              >
                <Target class="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#00A758]" />
                <span
                  class="text-xs sm:text-[10px] font-black text-gray-600 uppercase tracking-widest"
                >
                  {{ selectedSchedule }}
                </span>
                <ChevronDown
                  class="w-3 h-3 text-gray-400 transition-transform duration-200"
                  :class="{ 'rotate-180': showScheduleDropdown }"
                />
              </div>
              <!-- 下拉选项 - 响应式面板 -->
              <transition
                enter-active-class="transition ease-out duration-200"
                enter-from-class="opacity-0 scale-95 -translate-y-1"
                enter-to-class="opacity-100 scale-100 translate-y-0"
                leave-active-class="transition ease-in duration-150"
                leave-from-class="opacity-100 scale-100 translate-y-0"
                leave-to-class="opacity-0 scale-95 -translate-y-1"
              >
                <div
                  v-if="showScheduleDropdown"
                  class="absolute top-full left-0 mt-1.5 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-[9999] w-[120px] sm:min-w-[120px]"
                  @click.stop
                >
                  <div
                    v-for="item in scheduleOptions"
                    :key="item"
                    class="flex items-center gap-2 px-3 py-2.5 sm:py-2 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
                    :class="{ 'bg-[#EEF8F2]': selectedSchedule === item }"
                    @click="selectSchedule(item)"
                    @touchend.stop="selectScheduleTouch(item, $event)"
                  >
                    <Target class="w-3 h-3 text-[#00A758]" />
                    <span
                      class="text-xs sm:text-[10px] font-black uppercase tracking-widest"
                      :class="selectedSchedule === item ? 'text-[#00A758]' : 'text-gray-600'"
                    >
                      {{ item }}
                    </span>
                    <CheckCircle2
                      v-if="selectedSchedule === item"
                      class="w-3 h-3 text-[#00A758] ml-auto"
                    />
                  </div>
                </div>
              </transition>
            </div>
            <!-- 定位地址 - 响应式尺寸 -->
            <div
              class="flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full bg-[#DDF3E7] border border-[#CAEED9]"
            >
              <div class="w-1.5 h-1.5 rounded-full bg-[#00A758]" />
              <span class="text-[10px] sm:text-[10px] text-[#00A758]">长宁来福士广场16层</span>
            </div>
          </div>
        </div>
        <div class="flex-1 flex flex-col items-center justify-center py-6">
          <div
            v-if="isCompleted"
            class="w-full flex flex-col items-center justify-center gap-4 animate-in fade-in zoom-in duration-700"
          >
            <div
              class="w-24 h-24 rounded-[32px] flex items-center justify-center bg-[#00A758]"
            >
              <CheckCircle2 class="w-14 h-14 text-white" />
            </div>

            <div class="text-center">
              <p class="text-xl font-black tracking-widest text-[#00A758]">
                打卡成功
              </p>
              <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
                准时状态已记录
              </p>
            </div>
          </div>

          <template v-else>
            <div class="relative">
              <!-- 辐射圆形效果 - 始终显示 -->
              <div
                class="absolute inset-0 -m-4 rounded-full border-2 animate-ping"
                :class="attendanceStatus === 'late' ? 'border-[#F49600]/15' : 'border-[#00A758]/15'"
              />
              <div
                class="absolute inset-0 -m-8 rounded-full border animate-pulse"
                :class="attendanceStatus === 'late' ? 'border-[#F49600]/10' : 'border-[#00A758]/10'"
              />
              <div
                class="absolute inset-0 -m-12 rounded-full border animate-ping"
                :class="attendanceStatus === 'late' ? 'border-[#F49600]/5' : 'border-[#00A758]/5'"
                style="animation-delay: 0.5s"
              />
              <div
                class="absolute inset-0 -m-16 rounded-full border animate-pulse"
                :class="attendanceStatus === 'late' ? 'border-[#F49600]/[0.03]' : 'border-[#00A758]/[0.03]'"
                style="animation-delay: 1s"
              />
              <button
                class="w-56 h-56 rounded-full flex flex-col items-center justify-center transition-all duration-500 relative z-10 border-8 border-white group active:scale-95 overflow-hidden"
                :class="[
                  attendanceStatus === 'late'
                    ? 'bg-gradient-to-br from-[#FFB84D] to-[#F49600] text-white shadow-[0_20px_50px_rgba(244,150,0,0.3)]'
                    : 'bg-gradient-to-br from-[#00C46E] to-[#00A758] text-white shadow-[0_20px_60px_rgba(0,167,88,0.25)]',
                ]"
                @click="handleCheckInSuccess"
              >
                <!-- @click="createInputAndUpload" -->
                <!-- @click="uploadFile" -->

                <img
                  v-if="capturedPhoto"
                  :src="capturedPhoto"
                  class="absolute inset-0 w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div
                  v-if="isAnalyzing"
                  class="absolute inset-0 bg-black/50 backdrop-blur-md flex flex-col items-center justify-center text-white z-20"
                >
                  <van-loading size="36px" color="#fff" vertical>
                    <span
                      class="text-[11px] font-black tracking-[0.2em] uppercase mt-3 drop-shadow-md"
                    >
                      AI 正在识别职场特征
                    </span>
                  </van-loading>
                </div>

                <!-- 按钮内容（图标 + 文字） -->
                <div
                  class="relative z-30 flex flex-col items-center gap-2"
                  :class="{ 'drop-shadow-xl': capturedPhoto }"
                >
                  <!-- 未拍照：显示相机图标 -->
                  <Camera
                    v-if="!capturedPhoto"
                    :stroke-width="3"
                    class="w-14 h-14 transition-transform text-white drop-shadow-lg animate-camera-shake"
                  />

                  <!-- 已拍照：显示识别结果图标 -->
                  <template v-else-if="capturedPhoto && !isAnalyzing">
                    <div
                      :class="[
                        'w-16 h-16 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/30',
                        isRecognized ? 'bg-[#00A758]' : 'bg-red-500',
                      ]"
                    >
                      <Check
                        v-if="isRecognized"
                        :stroke-width="4"
                        class="w-10 h-10 text-white drop-shadow-md"
                      />
                      <X
                        v-else
                        :stroke-width="4"
                        class="w-10 h-10 text-white drop-shadow-md"
                      />
                    </div>
                  </template>

                  <!-- 按钮文字说明 -->
                  <div class="flex flex-col items-center">
                    <span
                      class="text-xl font-black tracking-[0.35em] uppercase leading-none mt-1 text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]"
                    >
                      {{
                        !capturedPhoto
                          ? error
                            ? "重新打卡"
                            : "自拍打卡"
                          : isAnalyzing
                            ? "识别中"
                            : isRecognized
                              ? "识别成功"
                              : "重新拍摄"
                      }}
                    </span>

                    <!-- 时段提示（始终显示） -->
                    <span
                      v-if="!capturedPhoto"
                      class="text-[10px] text-white font-black mt-2.5 tracking-[0.25em] uppercase drop-shadow-md"
                    >
                      {{ periodText }}
                    </span>
                  </div>
                </div>

                <!-- 内部装饰（hover 效果） -->
                <div
                  class="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </button>

              <button
                v-if="capturedPhoto && !loading"
                class="absolute -top-2 -right-2 w-10 h-10 bg-white rounded-2xl shadow-xl flex items-center justify-center text-gray-400 hover:text-red-500 transition-all z-40 active:scale-90"
                @click.stop="
                  capturedPhoto = null;
                  photoUrl = null;
                "
              >
                <X class="w-5 h-5" />
              </button>
            </div>
          </template>
        </div>
        <!-- 未打卡时展示样式 -->
        <div
          v-if="!isCompleted"
          class="mt-auto pt-4 flex flex-col items-center gap-1.5 border-t border-gray-50 w-full"
        >
          <div
            class="flex items-center gap-3 text-[11px] font-black tracking-[0.1em] uppercase"
          >
            <span class="text-gray-400 tabular-nums">{{ formattedTime }}</span>
            <span class="w-1 h-1 rounded-full bg-gray-200" />
            <span
              :style="{ color: statusLabelColor }"
            >
              {{ statusLabelText }}
            </span>
          </div>
          <div
            class="text-[10px] font-bold text-gray-400 uppercase tracking-tight text-center"
          >
            {{ checkWindowText }}
          </div>
        </div>

        <p
          v-if="error || autoInfoError"
          class="absolute bottom-20 left-0 right-0 text-center text-[9px] font-black text-red-500 uppercase tracking-widest animate-bounce z-30"
        >
          {{ error || autoInfoError }}
        </p>
      </div>

      <van-action-sheet
        teleport="body"
        v-model:show="showActivityMenu"
        :actions="
          agyLaAtndSchedules.map((item) => ({
            code: item.type,
            name: item.scheduleName,
            subname: `准时: ${item.startTime + '-' + item.endTime} 迟到：${item.lateTime + '-' + item.lateEnd}`,
          }))
        "
        cancel-text=" 取消"
        close-on-click-action
        @select="selectInType"
      />

      <transition name="van-fade">
        <div
          v-if="isCameraOpen"
          class="fixed inset-0 z-[100] bg-black flex flex-col"
        >
          <div
            class="p-6 flex items-center justify-between text-white relative z-10"
          >
            <div class="flex items-center gap-2 drop-shadow-md">
              <Camera class="w-5 h-5 text-[#5CD790]" />
              <span
                class="text-xs font-black tracking-widest uppercase text-white"
              >
                拍摄打卡照片
              </span>
            </div>

            <button
              class="p-2 hover:bg-white/20 rounded-xl transition-colors bg-black/20 backdrop-blur-sm"
              @click="stopCamera"
            >
              <X class="w-6 h-6 text-white" :stroke-width="3" />
            </button>
          </div>

          <div
            class="flex-1 relative flex items-center justify-center overflow-hidden"
          >
            <video
              ref="videoRef"
              autoplay
              playsinline
              class="w-full h-full object-cover"
            />

            <div class="absolute inset-0 pointer-events-none z-10">
              <div
                class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-white/30 rounded-[40px] shadow-[0_0_30px_rgba(0,0,0,0.3)]"
              >
                <div
                  class="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-[#00A758] rounded-tl-[40px] shadow-[-2px_-2px_10px_rgba(0,167,88,0.3)]"
                />
                <div
                  class="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-[#00A758] rounded-tr-[40px] shadow-[2px_-2px_10px_rgba(0,167,88,0.3)]"
                />
                <div
                  class="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-[#00A758] rounded-bl-[40px] shadow-[-2px_2px_10px_rgba(0,167,88,0.3)]"
                />
                <div
                  class="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-[#00A758] rounded-br-[40px] shadow-[2px_2px_10px_rgba(0,167,88,0.3)]"
                />
              </div>

              <div
                class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_20px_rgba(255,255,255,1)] animate-scan"
              />
            </div>

            <div
              class="absolute bottom-12 left-0 right-0 px-10 text-center z-20"
            >
              <p
                class="text-white font-black text-[10px] uppercase tracking-[0.25em] mb-8 drop-shadow-lg"
              >
                请拍摄清晰的打卡照片
              </p>

              <button
                class="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-full p-2 border-2 border-white/40 active:scale-90 transition-transform group shadow-2xl"
                @click="takePhoto"
              >
                <div
                  class="w-full h-full bg-white rounded-full flex items-center justify-center shadow-inner group-hover:scale-95 transition-transform"
                >
                  <div
                    class="w-16 h-16 border-[6px] border-[#00A758] rounded-full shadow-md"
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </transition>

      <canvas ref="canvasRef" class="hidden" />
    </div>

    <!-- 打卡小贴士：独立卡片，位于打卡时间窗口正下方 -->
    <AttendanceTipsCard class="mt-2.5 w-full" />
  </div>
</template>

<style scoped>
@keyframes scan {
  0%,
  100% {
    transform: translate(-50%, -128px);
  }

  50% {
    transform: translate(-50%, 128px);
  }
}

@keyframes camera-shake {
  0%,
  60% {
    transform: rotate(0deg) scale(1);
  }

  70% {
    transform: rotate(-15deg) scale(1.1);
  }

  80% {
    transform: rotate(15deg) scale(1.1);
  }

  90% {
    transform: rotate(-15deg) scale(1.1);
  }

  100% {
    transform: rotate(0deg) scale(1);
  }
}

.animate-camera-shake {
  animation: camera-shake 1.5s ease-in-out infinite;
}

.animate-scan {
  animation: scan 3s linear infinite;
}
</style>
