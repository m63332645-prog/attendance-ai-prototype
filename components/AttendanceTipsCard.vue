<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  Lightbulb,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Camera,
  FileText,
  Smartphone,
  Flame
} from 'lucide-vue-next';

const router = useRouter();

const swipeRef = ref(null);
const currentSwipeIndex = ref(0);

// 贴士列表
const tipsList = [
  {
    id: 'out_of_range',
    tag: '范围外',
    tagType: 'danger',
    tagBg: 'bg-rose-50 text-rose-600 border-rose-200',
    icon: MapPin,
    title: '身处职场内 · 开启GPS · 仅限手机',
    desc: '请确保手机定位已开启，并在中宏职场围栏内打卡',
  },
  {
    id: 'face_environment',
    tag: '未识别到职场/人脸',
    tagType: 'warning',
    tagBg: 'bg-amber-50 text-amber-600 border-amber-200',
    icon: Camera,
    title: '人脸清晰无遮挡 · 包含职场标志环境',
    desc: '拍摄时露出完整面部，避开强光与阴影，拍到职场特征',
  },
  {
    id: 'appeal',
    tag: '无法打卡提交申诉',
    tagType: 'primary',
    tagBg: 'bg-blue-50 text-blue-600 border-blue-200',
    icon: FileText,
    title: '可提交申诉：附原因、异常截图与自拍',
    desc: '系统异常时可前往申诉中心补交申请并由主管审核',
  },
  {
    id: 'location_permission',
    tag: '如何开启定位',
    tagType: 'success',
    tagBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    icon: Smartphone,
    title: 'iOS/华为/小米 定位权限极速配置',
    desc: '支持各大手机品牌位置权限一键查看与授权指引',
  },
];

const onSwipeChange = (index) => {
  currentSwipeIndex.value = index;
};

const prevTip = (e) => {
  e.stopPropagation();
  swipeRef.value?.prev();
};

const nextTip = (e) => {
  e.stopPropagation();
  swipeRef.value?.next();
};

const openGuide = () => {
  router.push({ name: 'attendance_tips' });
};
</script>

<template>
  <div class="attendance-tips-container w-full select-none">
    <!-- 黄金视觉落点卡片：浅绿色边框 + 浅绿色背景 -->
    <div
      class="bg-[#F2FAF5] border border-[#CAEED9] hover:border-[#A4DEBA] rounded-2xl p-3 sm:p-3.5 shadow-sm transition-all duration-300 cursor-pointer relative overflow-hidden group"
      @click="openGuide"
    >
      <!-- 顶部轻微水波纹背景装饰 -->
      <div class="absolute -right-6 -bottom-6 w-20 h-20 bg-emerald-200/30 rounded-full blur-xl pointer-events-none" />

      <!-- 顶栏：呼吸徽标 + HOT标签 + 左右切换与全部按钮 -->
      <div class="flex items-center justify-between gap-2 mb-2">
        <div class="flex items-center gap-1.5">
          <!-- 动态呼吸发光徽标 -->
          <div class="relative flex items-center justify-center">
            <div class="w-6 h-6 rounded-full bg-gradient-to-tr from-[#00A758] to-[#22C55E] text-white flex items-center justify-center shadow-[0_0_10px_rgba(0,167,88,0.45)] animate-pulse">
              <Lightbulb class="w-3.5 h-3.5 text-white fill-white/80" />
            </div>
            <span class="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span class="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
          </div>

          <!-- 标题 -->
          <span class="text-xs sm:text-sm font-bold text-gray-800 tracking-tight flex items-center gap-1">
            打卡小贴士
          </span>

          <!-- HOT 标签 -->
          <span class="inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[9px] font-black rounded-full shadow-sm animate-pulse tracking-wider">
            <Flame class="w-2.5 h-2.5 fill-white" />
            HOT
          </span>
        </div>

        <!-- 右侧：指示器与全部入口 -->
        <div class="flex items-center gap-2">
          <!-- 左右微调按钮 (触摸友好) -->
          <div class="hidden sm:flex items-center gap-1">
            <button
              class="w-5 h-5 rounded-full bg-white/80 border border-emerald-100 flex items-center justify-center text-gray-400 hover:text-[#00A758] hover:bg-white active:scale-90 transition-all"
              title="上一条"
              @click="prevTip"
            >
              <ChevronLeft class="w-3 h-3" />
            </button>
            <button
              class="w-5 h-5 rounded-full bg-white/80 border border-emerald-100 flex items-center justify-center text-gray-400 hover:text-[#00A758] hover:bg-white active:scale-90 transition-all"
              title="下一条"
              @click="nextTip"
            >
              <ChevronRight class="w-3 h-3" />
            </button>
          </div>

          <!-- 全部链接 -->
          <div class="flex items-center text-[11px] font-bold text-[#00A758] hover:text-emerald-700 active:scale-95 transition-all">
            <span>全部指南</span>
            <ChevronRight class="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      <!-- 轮播主体区 -->
      <div class="bg-white/80 backdrop-blur-sm rounded-xl p-2 sm:p-2.5 border border-emerald-100/60 shadow-[0_1px_3px_rgba(0,167,88,0.05)]">
        <van-swipe
          ref="swipeRef"
          :autoplay="3600"
          :show-indicators="false"
          class="tips-swipe h-[32px] sm:h-[30px]"
          @change="onSwipeChange"
        >
          <van-swipe-item
            v-for="tip in tipsList"
            :key="tip.id"
            class="flex items-center"
          >
            <div class="flex items-center gap-2 w-full overflow-hidden">
              <!-- 分类胶囊标签 -->
              <span
                class="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                :class="tip.tagBg"
              >
                {{ tip.tag }}
              </span>

              <!-- 文字内容 -->
              <div class="flex-1 min-w-0 pr-1">
                <p class="text-xs font-bold text-gray-800 truncate leading-snug">
                  {{ tip.title }}
                </p>
              </div>
            </div>
          </van-swipe-item>
        </van-swipe>

        <!-- 底部翻页指示点 -->
        <div class="flex items-center justify-center gap-1.5 mt-1.5 pt-1 border-t border-emerald-50/80">
          <span
            v-for="(tip, idx) in tipsList"
            :key="'dot-' + tip.id"
            class="h-1 rounded-full transition-all duration-300"
            :class="currentSwipeIndex === idx ? 'w-3.5 bg-[#00A758]' : 'w-1 bg-emerald-200/80'"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tips-swipe :deep(.van-swipe-item) {
  display: flex;
  align-items: center;
}
</style>
