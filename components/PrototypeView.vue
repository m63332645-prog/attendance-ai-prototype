<script setup>
import { ArrowLeft, MousePointer2, Info, Layers, Palette, Layout } from 'lucide-vue-next';

const props = defineProps({
  onBack: {
    type: Function,
    required: true
  }
});

const emit = defineEmits(['back']);

const designSystemItems = [
  { color: 'bg-emerald-500', title: '正常 (Normal)', desc: '在规定时间内于职场完成签到/签退' },
  { color: 'bg-red-500', title: '异常 (Abnormal)', desc: '迟到、早退或不在指定围栏区域内' },
  { color: 'bg-amber-400', title: '待办 (Upcoming)', desc: '今日未来的排程或明日之后的预设计划' },
  { color: 'bg-gray-300', title: '过期 (Expired)', desc: '历史日期中未进行任何打卡操作的记录' },
  { color: 'bg-teal-500', title: '请假 (Leave)', desc: '由系统审批通过的各种类型非出勤日' },
];

const logicFlowItems = [
  { step: 1, title: '触发打卡', desc: '获取浏览器 Geolocation 接口权限' },
  { step: 2, title: '后端校验 (Mock)', desc: '对比当前时间 vs 活动预设时间 (08:45)' },
  { step: 3, title: '状态回传', desc: '更新 LocalStorage 记录并渲染日历红点' },
];
</script>

<template>
  <div class="p-6 pb-24 space-y-8 bg-slate-50 min-h-screen">
    <!-- 1. Design System Section -->
    <section class="space-y-4">
      <div class="flex items-center gap-2 text-slate-400">
        <Palette class="w-4 h-4" />
        <span class="text-xs font-bold uppercase tracking-widest">设计规范 / Design System</span>
      </div>
      <div class="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <div class="w-1.5 h-4 bg-emerald-500 rounded-full" />
          考勤红绿灯系统 (Traffic Light)
        </h3>
        <div class="grid grid-cols-1 gap-3">
          <div
            v-for="(item, i) in designSystemItems"
            :key="i"
            class="flex items-center gap-4 p-3 rounded-lg bg-slate-50 border border-slate-100"
          >
            <div :class="['w-10 h-10 rounded-full shadow-inner shrink-0', item.color]" />
            <div>
              <p class="font-bold text-slate-700 text-sm">
                {{ item.title }}
              </p>
              <p class="text-[10px] text-slate-400">
                {{ item.desc }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 2. Wireframe Annotations -->
    <section class="space-y-4">
      <div class="flex items-center gap-2 text-slate-400">
        <Layout class="w-4 h-4" />
        <span class="text-xs font-bold uppercase tracking-widest">页面原型标注 / Wireframes</span>
      </div>

      <!-- Artboard 1: Dashboard -->
      <div class="relative bg-white p-4 rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div class="absolute top-4 right-4 bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-1 rounded-md">
          Artboard 01
        </div>
        <h4 class="font-bold text-slate-400 text-xs mb-4">
          首页 - 仪表盘 (Dashboard)
        </h4>
        
        <div class="space-y-4 opacity-40 grayscale pointer-events-none scale-95 origin-top transition-all">
          <div class="h-32 bg-slate-200 rounded-lg" />
          <div class="h-48 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center">
            <span class="text-slate-400 font-bold">LBS 打卡核心组件</span>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="h-16 bg-slate-50 rounded-lg" />
            <div class="h-16 bg-slate-50 rounded-lg" />
          </div>
        </div>

        <!-- Annotations Layer -->
        <div class="absolute inset-0 p-6 pointer-events-none">
          <div class="absolute top-10 left-10">
            <div class="flex items-center gap-2">
              <MousePointer2 class="w-5 h-5 text-emerald-500" />
              <div class="bg-emerald-600 text-white text-[10px] p-2 rounded-lg shadow-lg font-bold">
                Gemini AI 动态寄语
              </div>
            </div>
          </div>
          <div class="absolute bottom-1/2 right-10">
            <div class="flex flex-col items-end gap-2">
              <div class="bg-emerald-600 text-white text-[10px] p-2 rounded-lg shadow-lg font-bold">
                地理围栏 (Geofencing) 校验
              </div>
              <div class="w-10 h-0.5 bg-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      <!-- Artboard 2: Calendar -->
      <div class="relative bg-white p-4 rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div class="absolute top-4 right-4 bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-1 rounded-md">
          Artboard 02
        </div>
        <h4 class="font-bold text-slate-400 text-xs mb-4">
          考勤页 - 智绘日历 (Calendar)
        </h4>
        
        <div class="space-y-4 opacity-40 grayscale pointer-events-none scale-95 origin-top transition-all">
          <div class="h-64 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300" />
          <div class="space-y-2">
            <div class="h-12 bg-slate-100 rounded-lg" />
            <div class="h-12 bg-slate-100 rounded-lg" />
          </div>
        </div>

        <div class="absolute inset-0 p-6 pointer-events-none">
          <div class="absolute top-1/3 left-1/2 -translate-x-1/2">
            <div class="bg-amber-500 text-white text-[10px] p-2 rounded-lg shadow-lg font-bold flex items-center gap-1">
              <Info class="w-3 h-3" />
              点击切换 [月/周] 视图
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. Logic Flow -->
    <section class="space-y-4">
      <div class="flex items-center gap-2 text-slate-400">
        <Layers class="w-4 h-4" />
        <span class="text-xs font-bold uppercase tracking-widest">业务逻辑流 / Logic Flow</span>
      </div>
      <div class="bg-slate-900 p-6 rounded-lg text-slate-300">
        <div class="space-y-6">
          <div
            v-for="item in logicFlowItems"
            :key="item.step"
            class="flex items-center gap-4"
          >
            <div class="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-white text-xs">
              {{ item.step }}
            </div>
            <div :class="['flex-1 pb-2', item.step !== 3 ? 'border-b border-slate-700' : '']">
              <p class="text-sm font-bold text-white">
                {{ item.title }}
              </p>
              <p class="text-[10px] text-slate-500">
                {{ item.desc }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <div class="text-center">
      <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
        Manulife-Sinochem UI Prototype v1.1
      </p>
    </div>
  </div>
</template>
