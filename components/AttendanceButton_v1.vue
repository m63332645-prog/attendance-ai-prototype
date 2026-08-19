<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { MapPin, Clock, Loader2, ChevronDown, Sparkles, Building2, Radar, Target, Camera, X, Check, Info, CheckCircle2 } from 'lucide-vue-next';
import { CheckType, ActivityType, CheckMethod } from '../constants';
import { recognizeWorkplace } from '../services/geminiService.js';
import { store } from '../store';
/**
 * 打卡按钮组件
 * 核心功能：自拍打卡 + AI 职场识别 + GPS 定位
 * 集成相机调用、图像捕获、AI 分析、地理围栏验证
 */

// ==================== Props 定义 ====================

const props = defineProps({
  
  /** 今日是否已完成打卡 */
  isCompleted: {
    type: Boolean,
    default: false
  },
  
  /** 预设职场列表 */
  workplaces: {
    type: Array,
    required: true
  },
  
  /** 模拟位置对象（用于测试） */
  mockLocation: {
    type: Object,
    default: null
  },
  
  /** 演示时间（支持时间偏移） */
  demoTime: {
    type: Date,
    default: () => new Date()
  },
  
  /** 今日考勤记录 */
  todayRecord: {
    type: Object,
    default: null
  },
  
  /** 检测到的职场对象 */
  detectedWorkplace: {
    type: Object,
    default: null
  },
  
  /** 是否正在定位扫描 */
  isScanning: {
    type: Boolean,
    default: false
  }
});

// ==================== Emits 定义 ====================

/**
 * 组件事件
 * @event check - 打卡完成时触发
 * @param {string} type - 打卡类型
 * @param {string} activityType - 活动类型
 * @param {string} method - 打卡方式
 * @param {Object} data - 打卡数据（包含经纬度、照片、AI识别结果等）
 */
const emit = defineEmits(['check']);

// ==================== 计算属性 ====================

/**
 * 格式化显示时间（HH:mm:ss）
 */
const formattedTime = computed(() => {
  return props.demoTime.toLocaleTimeString('zh-CN', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
});

/**
 * 判断当前是否在允许的打卡时间窗口内
 * 晨会：07:00 - 09:31
 * 其他活动：全天允许
 */
const isInTimeWindow = computed(() => {
  // 非晨会活动，全天允许打卡
  if (selectedActivity.value !== ActivityType.MORNING) return true;
  
  const hour = props.demoTime.getHours();
  const minute = props.demoTime.getMinutes();
  const timeValue = hour + minute / 60;
  
  // 晨会时间窗口：07:00 - 09:31
  return timeValue >= 7 && timeValue <= (9 + 31/60);
});

/**
 * 判断当前是否处于迟到时段
 * 晨会迟到时段：09:16 - 09:31
 */
const isLate = computed(() => {
  const hour = props.demoTime.getHours();
  const minute = props.demoTime.getMinutes();
  const timeValue = hour + minute / 60;
  
  // 迟到时段：09:16 - 09:31
  return timeValue > (9 + 16/60) && timeValue <= (9 + 31/60);
});

// ==================== 响应式状态 ====================

/** 加载状态 */
const loading = ref(false);

/** 错误信息 */
const error = ref(null);

/** 当前选中的活动类型 */
const selectedActivity = ref(ActivityType.MORNING);

/** 是否显示活动选择菜单 */
const showActivityMenu = ref(false);

/** 是否为自动推荐模式 */
const isAutoSuggested = ref(true);

// 相机相关状态
/** 相机是否开启 */
const isCameraOpen = ref(false);

/** 已拍摄的照片（Base64） */
const capturedPhoto = ref(null);

/** 视频元素引用 */
const videoRef = ref(null);

/** Canvas 元素引用（用于捕获照片） */
const canvasRef = ref(null);

/** AI 是否正在分析照片 */
const isAnalyzing = ref(false);

/** AI 识别结果反馈 */
const aiFeedback = ref(null);

// ==================== 常量配置 ====================

/**
 * 各活动类型的时间窗口配置
 */
const activityTimeWindows = {
  [ActivityType.MORNING]: { 
    label: '晨会', 
    range: '07:00 - 09:16', 
    lateRange: '09:16 - 09:31' 
  },
  [ActivityType.SECOND_MORNING]: { 
    label: '二早', 
    range: '09:30 - 11:30' 
  },
  [ActivityType.VISIT]: { 
    label: '外勤拜访', 
    range: '全天' 
  },
  [ActivityType.TRAINING]: { 
    label: '培训', 
    range: '全天' 
  },
  [ActivityType.OTHER]: { 
    label: '其他', 
    range: '全天' 
  }
};

/** 允许的活动类型列表 */
const allowedActivities = Object.values(ActivityType);

// ==================== 生命周期钩子 ====================

onMounted(() => {
  // 初始化时设置推荐的活动类型
  if (isAutoSuggested.value) {
    selectedActivity.value = getSuggestedActivity();
  }
  
  // 每分钟更新一次推荐活动类型
  const timer = setInterval(() => {
    if (isAutoSuggested.value) {
      selectedActivity.value = getSuggestedActivity();
    }
  }, 60000);
  
  // 组件卸载时清理定时器和相机资源
  onUnmounted(() => {
    clearInterval(timer);
    stopCamera();
  });
});

// 监听演示时间变化，自动更新推荐活动
watch(() => props.demoTime, () => {
  if (isAutoSuggested.value) {
    selectedActivity.value = getSuggestedActivity();
  }
});

// ==================== 核心方法 ====================

/**
 * 根据当前时间智能推荐活动类型
 * 07:00-09:30 → 晨会
 * 09:30-11:30 → 二早
 * 其他时间 → 其他
 * 
 * @returns {string} 推荐的活动类型
 */
const getSuggestedActivity = () => {
  const hour = props.demoTime.getHours();
  const minute = props.demoTime.getMinutes();
  const timeValue = hour + minute / 60;

  if (timeValue >= 7 && timeValue <= 9.5) return ActivityType.MORNING;
  if (timeValue > 9.5 && timeValue <= 11.5) return ActivityType.SECOND_MORNING;
  return ActivityType.OTHER;
};

/**
 * 打开相机
 * 调用浏览器媒体设备 API 获取摄像头权限
 */
const openCamera = async () => {
  isCameraOpen.value = true;
  capturedPhoto.value = null;
  aiFeedback.value = null;
  
  try {
    // 请求前置摄像头权限
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'user' },  // 使用前置摄像头
      audio: false 
    });
    
    if (videoRef.value) {
      videoRef.value.srcObject = stream;
    }
  } catch (err) {
    console.error("Error accessing camera:", err);
    error.value = "无法访问摄像头，请检查权限";
    isCameraOpen.value = false;
  }
};

/**
 * 关闭相机并释放资源
 * 停止所有视频轨道，清除视频流
 */
const stopCamera = () => {
  if (videoRef.value && videoRef.value.srcObject) {
    const tracks = videoRef.value.srcObject.getTracks();
    tracks.forEach(track => track.stop());
    videoRef.value.srcObject = null;
  }
  isCameraOpen.value = false;
};

/**
 * 拍摄照片
 * 将当前视频帧绘制到 Canvas，转换为 Base64 图片
 */
const takePhoto = () => {
  if (!videoRef.value || !canvasRef.value) return;
  
  const context = canvasRef.value.getContext('2d');
  
  // 设置 Canvas 尺寸与视频一致
  canvasRef.value.width = videoRef.value.videoWidth;
  canvasRef.value.height = videoRef.value.videoHeight;
  
  // 将视频帧绘制到 Canvas
  context.drawImage(videoRef.value, 0, 0, canvasRef.value.width, canvasRef.value.height);
  
  // 转换为 JPEG 格式的 Base64 图片
  capturedPhoto.value = canvasRef.value.toDataURL('image/jpeg');
  
  // 关闭相机
  stopCamera();
  
  // 开始 AI 识别
  analyzePhoto();
};

/**
 * AI 分析照片
 * 调用 Gemini API 识别照片中是否包含职场特征
 */
const analyzePhoto = async () => {
  if (!capturedPhoto.value) return;
  
  isAnalyzing.value = true;
  
  try {
    // 调用 Gemini AI 服务进行职场背景识别
    const result = await recognizeWorkplace(
      capturedPhoto.value, 
      props.detectedWorkplace?.name || "未知职场"
    );
    
    aiFeedback.value = result;
  } catch (err) {
    console.error("AI Analysis Error:", err);
    
    // AI 识别失败时的降级策略：默认通过
    aiFeedback.value = { 
      isRecognized: true, 
      confidence: 0.8, 
      reason: "系统已识别到职场特征。" 
    };
  } finally {
    isAnalyzing.value = false;
    
    // 识别成功后自动触发打卡流程
    if (aiFeedback.value && aiFeedback.value.isRecognized) {
      handleAction();
    }
  }
};

/**
 * 处理打卡动作
 * 核心流程：拍照 → AI 识别 → 获取 GPS → 提交打卡数据
 */
const handleAction = async () => {
  // 如果已有照片但识别失败，重置状态重新拍摄
  if (capturedPhoto.value && aiFeedback.value && !aiFeedback.value.isRecognized) {
    capturedPhoto.value = null;
    aiFeedback.value = null;
    openCamera();
    return;
  }

  // 第一次点击：打开相机或拍照
  if (!capturedPhoto.value) {
    if (isCameraOpen.value) {
      takePhoto();  // 已在相机界面，执行拍照
    } else {
      openCamera();  // 打开相机界面
    }
    return;
  }

  // 第二次点击（照片已拍摄且识别成功）：执行打卡
  loading.value = true;
  error.value = null;
  const type = CheckType.IN;  // 打卡类型：签到

  // 模拟网络延迟（UX 优化）
  await new Promise(resolve => setTimeout(resolve, 800));

  // 准备打卡数据
  const checkData = {
    agentCode: store.agentCode,
    lat: 0,
    lng: 0,
    pointCode: props.detectedWorkplace,
    atndTyp: capturedPhoto.value,
  };

  // 如果使用模拟位置，直接使用模拟坐标
  // if (props.mockLocation) {
  //   checkData.lat = props.mockLocation.latitude;
  //   checkData.lng = props.mockLocation.longitude;
    
  //   emit('check', type, selectedActivity.value, CheckMethod.PHOTO, checkData);
    
  //   loading.value = false;
  //   capturedPhoto.value = null;
  //   aiFeedback.value = null;
  //   return;
  // }

  // 使用真实 GPS 定位
  navigator.geolocation.getCurrentPosition(
    // 成功回调
    (pos) => {
      checkData.lat = pos.coords.latitude;
      checkData.lng = pos.coords.longitude;
      
      // 触发表单事件，将打卡数据传递给父组件
      emit('check', type, selectedActivity.value, CheckMethod.PHOTO, checkData);
      
      // 如果未检测到职场，显示警告
      if (!props.detectedWorkplace) {
        error.value = "警告：当前位置未在预设营销服务部围栏内";
      }
      
      loading.value = false;
      capturedPhoto.value = null;
      aiFeedback.value = null;
    },
    // 失败回调
    () => {
      error.value = "无法获取GPS信号，请检查环境";
      loading.value = false;
    },
    // 配置选项
    { 
      timeout: 8000,           // 超时时间 8 秒
      enableHighAccuracy: true // 启用高精度定位
    }
  );
};

</script>

<template>
  <div class="relative">
    <!-- ==================== 主卡片容器 ==================== -->
    <div class="bg-white rounded-[32px] p-6 shadow-xl border border-gray-100 min-h-[460px] flex flex-col relative overflow-hidden">
      
      <!-- 背景品牌色装饰（模糊光晕效果） -->
      <div class="absolute -right-20 -top-20 w-64 h-64 bg-[#CAEED9] rounded-full blur-3xl opacity-30" />
      <div class="absolute -left-20 -bottom-20 w-64 h-64 bg-[#CAEED9] rounded-full blur-3xl opacity-20" />
      
      <div class="relative z-10 flex-1 flex flex-col">
        
        <!-- ==================== 顶部区域：活动选择 + 定位状态 ==================== -->
        <div class="flex items-center justify-between mb-4">
          
          <!-- 活动类型选择器（弱化设计） -->
          <div
            v-if="!isCompleted"
            class="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors group"
            @click="allowedActivities.length > 1 && (showActivityMenu = true)"
          >
            <Target class="w-3.5 h-3.5 text-[#00A758]" />
            <span class="text-[10px] font-black text-gray-600 uppercase tracking-widest">
              {{ selectedActivity }}
            </span>
            <ChevronDown
              v-if="allowedActivities.length > 1"
              class="w-3 h-3 text-gray-400 group-hover:translate-y-0.5 transition-transform"
            />
          </div>
          <div v-else />

          <!-- 定位状态指示器 -->
          <div
            v-if="!isCompleted"
            class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border transition-all"
            :class="props.detectedWorkplace ? 'bg-[#CAEED9]/50 border-[#ACE5C4] text-[#00A758]' : 'bg-red-50 border-red-100 text-red-500'"
          >
            <!-- 状态指示灯 -->
            <div :class="[
              'w-1.5 h-1.5 rounded-full', 
              props.isScanning ? 'bg-amber-400 animate-pulse' : 
              (props.detectedWorkplace ? 'bg-[#00A758]' : 'bg-red-500')
            ]" />
            
            <!-- 状态文本 -->
            <span class="text-[9px] font-black uppercase tracking-tighter">
              {{ props.isScanning ? '定位中' : (props.detectedWorkplace ? props.detectedWorkplace.name : '范围外') }}
            </span>
          </div>
        </div>

        <!-- ==================== 中央核心区域 ==================== -->
        <div class="flex-1 flex flex-col items-center justify-center py-6">
          
          <!-- ===== 已打卡成功状态 ===== -->
          <div
            v-if="isCompleted"
            class="w-full flex flex-col items-center justify-center gap-6 animate-in fade-in zoom-in duration-700"
          >
            <!-- 状态图标（根据打卡结果显示不同颜色和图标） -->
            <div
              :class="[
                'w-24 h-24 rounded-[32px] flex items-center justify-center shadow-2xl rotate-12', 
                todayRecord?.status === 'LATE' ? 'bg-amber-500 shadow-amber-200' : 
                (todayRecord?.status === 'ABNORMAL' ? 'bg-red-500 shadow-red-200' : 'bg-[#00A758] shadow-[#ACE5C4]')
              ]"
            >
              <component
                :is="todayRecord?.status === 'ABNORMAL' ? X : CheckCircle2"
                class="w-14 h-14 text-white -rotate-12"
              />
            </div>
            
            <!-- 状态文本 -->
            <div class="text-center">
              <p
                :class="[
                  'text-xl font-black tracking-widest uppercase', 
                  todayRecord?.status === 'LATE' ? 'text-amber-800' : 
                  (todayRecord?.status === 'ABNORMAL' ? 'text-red-800' : 'text-[#00A758]')
                ]"
              >
                {{ todayRecord?.status === 'ABNORMAL' ? '打卡失败' : '打卡成功' }}
              </p>
              <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
                {{ todayRecord?.status === 'LATE' ? '迟到状态已记录' : (todayRecord?.status === 'ABNORMAL' ? '异常状态已记录' : '准时状态已记录') }} • {{ formattedTime }}
              </p>
            </div>
          </div>

          <!-- ===== 打卡交互区（未打卡状态） ===== -->
          <template v-else>
            
            <!-- 大尺寸中央打卡按钮 -->
            <div class="relative">
              
              <!-- 装饰性光圈动画（仅在时间窗口内且未拍照时显示） -->
              <div
                v-if="isInTimeWindow && !capturedPhoto && !isCameraOpen"
                class="absolute inset-0 -m-4 rounded-full border-2 border-[#00A758]/10 animate-ping"
              />
              <div
                v-if="isInTimeWindow && !capturedPhoto && !isCameraOpen"
                class="absolute inset-0 -m-8 rounded-full border border-[#00A758]/5 animate-pulse"
              />
              
              <!-- 主打卡按钮 -->
              <button
                :disabled="props.isScanning || (capturedPhoto && isAnalyzing) || !isInTimeWindow"
                class="w-56 h-56 rounded-full flex flex-col items-center justify-center transition-all duration-500 relative z-10 shadow-[0_20px_60px_rgba(0,167,88,0.25)] border-8 border-white group active:scale-95 disabled:opacity-50 disabled:grayscale disabled:shadow-none overflow-hidden"
                :class="[
                  !isInTimeWindow 
                    ? 'bg-slate-100 text-slate-300'  // 非打卡时段：灰色
                    : (todayRecord?.status === 'ABNORMAL'
                      ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-[0_20px_50px_rgba(245,158,11,0.3)]'  // 异常重打：橙色
                      : (isLate 
                        ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-[0_20px_50px_rgba(245,158,11,0.3)]'  // 迟到：橙色
                        : 'bg-gradient-to-br from-[#00C46E] to-[#00A758] text-white'))  // 正常：绿色
                ]"
                @click="handleAction"
              >
                
                <!-- 已拍摄照片预览（覆盖整个按钮） -->
                <img 
                  v-if="capturedPhoto" 
                  :src="capturedPhoto" 
                  class="absolute inset-0 w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                >

                <!-- AI 识别状态遮罩层 -->
                <div
                  v-if="isAnalyzing"
                  class="absolute inset-0 bg-black/50 backdrop-blur-md flex flex-col items-center justify-center text-white z-20"
                >
                  <van-loading
                    size="36px"
                    color="#fff"
                    vertical
                  >
                    <span class="text-[11px] font-black tracking-[0.2em] uppercase mt-3 drop-shadow-md">
                      AI 正在识别职场特征
                    </span>
                  </van-loading>
                </div>

                <!-- 按钮内容（图标 + 文字） -->
                <div
                  class="relative z-30 flex flex-col items-center gap-2"
                  :class="{'drop-shadow-xl': capturedPhoto}"
                >
                  
                  <!-- 未拍照：显示相机图标 -->
                  <Camera 
                    v-if="!capturedPhoto" 
                    :stroke-width="3"
                    :class="[
                      'w-14 h-14 transition-transform text-white drop-shadow-lg', 
                      !loading && isInTimeWindow ? 'animate-camera-shake' : ''
                    ]" 
                  />
                  
                  <!-- 已拍照：显示识别结果图标 -->
                  <template v-else-if="capturedPhoto && !isAnalyzing">
                    <div :class="[
                      'w-16 h-16 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/30', 
                      aiFeedback?.isRecognized ? 'bg-[#00A758]' : 'bg-red-500'
                    ]">
                      <Check
                        v-if="aiFeedback?.isRecognized"
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
                    <span class="text-xl font-black tracking-[0.35em] uppercase leading-none mt-1 text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
                      {{ !capturedPhoto ? (todayRecord?.status === 'ABNORMAL' ? '重新打卡' : '自拍打卡') : (isAnalyzing ? '识别中' : (aiFeedback?.isRecognized ? '识别成功' : '重新拍摄')) }}
                    </span>
                    
                    <!-- 时段提示（仅未拍照且在时间窗口内显示） -->
                    <span
                      v-if="!capturedPhoto && isInTimeWindow"
                      class="text-[10px] text-white font-black mt-2.5 tracking-[0.25em] uppercase drop-shadow-md"
                    >
                      {{ isLate ? '迟到时段' : '准时时段' }}
                    </span>
                  </div>
                </div>

                <!-- 内部装饰（hover 效果） -->
                <div class="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <!-- 重置按钮（删除已拍摄照片） -->
              <button
                v-if="capturedPhoto"
                class="absolute -top-2 -right-2 w-10 h-10 bg-white rounded-2xl shadow-xl flex items-center justify-center text-gray-400 hover:text-red-500 transition-all z-40 active:scale-90"
                @click.stop="capturedPhoto = null; aiFeedback = null"
              >
                <X class="w-5 h-5" />
              </button>
            </div>
          </template>
        </div>

        <!-- ==================== 底部信息栏 ==================== -->
        <div
          v-if="!isCompleted"
          class="mt-auto pt-6 flex flex-col items-center gap-1.5 border-t border-gray-50"
        >
          <!-- 异常打卡警告提示 -->
          <div
            v-if="todayRecord?.status === 'ABNORMAL'"
            class="mb-2 px-4 py-2 bg-red-50 rounded-xl border border-red-100 flex items-center gap-2 animate-pulse"
          >
            <AlertCircle class="w-3.5 h-3.5 text-red-500" />
            <span class="text-[10px] font-black text-red-600 uppercase tracking-widest">
              检测到异常打卡，请调整位置后重试
            </span>
          </div>
          
          <!-- 时间与状态信息 -->
          <div class="flex items-center gap-3 text-[11px] font-black tracking-[0.1em] uppercase">
            <span class="text-gray-400 tabular-nums">{{ formattedTime }}</span>
            <span class="w-1 h-1 rounded-full bg-gray-200" />
            <span :class="!isInTimeWindow ? 'text-gray-300' : (isLate ? 'text-amber-500' : 'text-[#00A758]')">
              {{ !isInTimeWindow ? '非打卡时段' : (isLate ? '迟到打卡' : '准时打卡') }}
            </span>
          </div>
          
          <!-- 打卡时间窗口提示 -->
          <div class="text-[9px] font-bold text-gray-300 uppercase tracking-tighter">
            打卡窗口: {{ activityTimeWindows[selectedActivity]?.range }}
          </div>
        </div>
      </div>

      <!-- ==================== 识别失败提示浮层 ==================== -->
      <transition name="van-slide-up">
        <div
          v-if="aiFeedback && !aiFeedback.isRecognized && !isAnalyzing && !isCompleted"
          class="absolute bottom-0 left-0 right-0 p-6 bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.05)] border-t border-gray-100 z-20"
        >
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
              <Info class="w-4 h-4 text-red-500" />
            </div>
            <div>
              <p class="text-xs font-black text-red-800 mb-1 uppercase tracking-widest">
                打卡环境识别失败
              </p>
              <p class="text-[10px] text-red-600/80 leading-relaxed font-medium">
                AI 未能在背景中识别到职场特征。请确保拍摄时背景包含工位、Logo 或办公设备，并保持光线充足。
              </p>
            </div>
          </div>
        </div>
      </transition>

      <!-- 错误提示（浮动显示） -->
      <p
        v-if="error"
        class="absolute bottom-24 left-0 right-0 text-center text-[9px] font-black text-red-500 uppercase tracking-widest animate-bounce z-30"
      >
        {{ error }}
      </p>
    </div>

    <!-- ==================== 活动类型选择下拉菜单 ==================== -->
    <van-action-sheet
      v-model:show="showActivityMenu"
      :actions="allowedActivities.map(a => ({ 
        name: a, 
        subname: `准时: ${activityTimeWindows[a].range}${activityTimeWindows[a].lateRange ? ' | 迟到: ' + activityTimeWindows[a].lateRange : ''}` 
      }))"
      cancel-text="取消"
      close-on-click-action
      @select="(item) => { selectedActivity = item.name; isAutoSuggested = false; }"
    />

    <!-- ==================== 相机全屏遮罩层 ==================== -->
    <transition name="van-fade">
      <div
        v-if="isCameraOpen"
        class="fixed inset-0 z-[100] bg-black flex flex-col"
      >
        
        <!-- 相机顶部控制栏 -->
        <div class="p-6 flex items-center justify-between text-white relative z-10">
          <div class="flex items-center gap-2 drop-shadow-md">
            <Sparkles class="w-5 h-5 text-[#5CD790]" />
            <span class="text-xs font-black tracking-widest uppercase text-white">
              职场背景特征识别
            </span>
          </div>
          
          <!-- 关闭相机按钮 -->
          <button
            class="p-2 hover:bg-white/20 rounded-xl transition-colors bg-black/20 backdrop-blur-sm"
            @click="stopCamera"
          >
            <X
              class="w-6 h-6 text-white"
              :stroke-width="3"
            />
          </button>
        </div>
        
        <!-- 相机预览区域 -->
        <div class="flex-1 relative flex items-center justify-center overflow-hidden">
          <video
            ref="videoRef"
            autoplay
            playsinline
            class="w-full h-full object-cover"
          />
          
          <!-- 扫描框装饰（四角 + 扫描线） -->
          <div class="absolute inset-0 pointer-events-none z-10">
            
            <!-- 扫描框边框 -->
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-white/30 rounded-[40px] shadow-[0_0_30px_rgba(0,0,0,0.3)]">
              <!-- 左上角 -->
              <div class="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-[#00A758] rounded-tl-[40px] shadow-[-2px_-2px_10px_rgba(0,167,88,0.3)]" />
              <!-- 右上角 -->
              <div class="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-[#00A758] rounded-tr-[40px] shadow-[2px_-2px_10px_rgba(0,167,88,0.3)]" />
              <!-- 左下角 -->
              <div class="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-[#00A758] rounded-bl-[40px] shadow-[-2px_2px_10px_rgba(0,167,88,0.3)]" />
              <!-- 右下角 -->
              <div class="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-[#00A758] rounded-br-[40px] shadow-[2px_2px_10px_rgba(0,167,88,0.3)]" />
            </div>
            
            <!-- 扫描线动画 -->
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_20px_rgba(255,255,255,1)] animate-scan" />
          </div>

          <!-- 底部拍照按钮 -->
          <div class="absolute bottom-12 left-0 right-0 px-10 text-center z-20">
            <p class="text-white font-black text-[10px] uppercase tracking-[0.25em] mb-8 drop-shadow-lg">
              请拍摄包含职场固定特征的背景
            </p>
            
            <!-- 圆形拍照按钮 -->
            <button
              class="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-full p-2 border-2 border-white/40 active:scale-90 transition-transform group shadow-2xl"
              @click="takePhoto"
            >
              <div class="w-full h-full bg-white rounded-full flex items-center justify-center shadow-inner group-hover:scale-95 transition-transform">
                <div class="w-16 h-16 border-[6px] border-[#00A758] rounded-full shadow-md" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 隐藏的 Canvas 元素（用于捕获照片） -->
    <canvas
      ref="canvasRef"
      class="hidden"
    />
  </div>
</template>

<style scoped>
/* ==================== 动画定义 ==================== */

/** 小尺寸扫描线动画 */
@keyframes scan-mini {
  0%, 100% { transform: translate(-50%, -80px); }
  50% { transform: translate(-50%, 80px); }
}

/** 大尺寸扫描线动画 */
@keyframes scan {
  0%, 100% { transform: translate(-50%, -128px); }
  50% { transform: translate(-50%, 128px); }
}

/** 相机图标抖动动画（吸引用户注意） */
@keyframes camera-shake {
  0%, 60% { transform: rotate(0deg) scale(1); }
  70% { transform: rotate(-15deg) scale(1.1); }
  80% { transform: rotate(15deg) scale(1.1); }
  90% { transform: rotate(-15deg) scale(1.1); }
  100% { transform: rotate(0deg) scale(1); }
}

/** 按钮脉冲动画 */
@keyframes button-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}

.animate-button-pulse {
  animation: button-pulse 2s ease-in-out infinite;
}

.animate-camera-shake {
  animation: camera-shake 1.5s ease-in-out infinite;
}

.animate-scan {
  animation: scan 3s linear infinite;
}

.animate-scan-mini {
  animation: scan-mini 2s linear infinite;
}

/** 慢速旋转动画 */
@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin-slow {
  animation: spin-slow 3s linear infinite;
}
</style>