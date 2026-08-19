<script setup>
import { computed } from 'vue';
import { Target, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-vue-next';
import { ActivityType, AttendanceStatus } from '../constants';

const props = defineProps({
  records: {
    type: Array,
    required: true
  }
});

const targets = [
  { type: ActivityType.MORNING, goal: 22, color: 'emerald', demoCount: 20 },
];

const currentDay = 25; // 固定为25日以匹配演示案例
const daysInMonth = 31;
const timeProgress = (currentDay / daysInMonth) * 100;

const processedTargets = computed(() => {
  return targets.map(target => {
    // 统计实际打卡记录 (NORMAL 或 LATE)
    const actualCount = props.records.filter(r => 
      r.activityType === target.type && 
      (r.status === AttendanceStatus.NORMAL || r.status === AttendanceStatus.LATE)
    ).length;

    // 演示模式下结合 demoCount 和实际记录
    const count = target.demoCount + actualCount;
    const gap = Math.max(0, target.goal - count);
    const progress = (count / target.goal) * 100;
    const isBehind = progress < timeProgress;
    return {
      ...target,
      count,
      gap,
      progress,
      isBehind
    };
  });
});
</script>

<template>
  <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-100 space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="font-black text-gray-800 flex items-center gap-2 text-sm">
        <Target class="w-4 h-4 text-emerald-500" />
        月度指标进度
      </h3>
      <div class="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-100">
        <span class="text-[8px] font-black text-gray-400 uppercase tracking-tighter">{{ currentDay }}/{{ daysInMonth }}天</span>
      </div>
    </div>

    <div class="space-y-4">
      <div
        v-for="target in processedTargets"
        :key="target.type"
        class="space-y-1.5"
      >
        <div class="flex justify-between items-end px-1">
          <div>
            <p class="text-[10px] font-black text-gray-700">
              {{ target.type }}
            </p>
            <p class="text-[8px] font-bold text-gray-400">
              目标: {{ target.goal }} 次
            </p>
          </div>
          <div class="text-right">
            <span :class="['text-base font-black tracking-tighter', target.isBehind ? 'text-amber-500' : 'text-emerald-600']">
              {{ target.count }}
            </span>
            <span class="text-gray-300 text-xs mx-0.5">/</span>
            <span class="text-gray-400 text-[10px] font-bold">{{ target.goal }}</span>
          </div>
        </div>
        
        <div class="relative py-2">
          <van-progress
            :percentage="Math.min(target.progress, 100)"
            :stroke-width="12"
            :color="target.isBehind ? '#fbbf24' : '#00a758'"
            :show-pivot="false"
            class="rounded-full"
          />
          <!-- 序时线指示器 -->
          <div 
            class="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10" 
            :style="{ left: `${timeProgress}%` }"
          />
        </div>

        <div class="flex items-center justify-between px-1">
          <div class="flex items-center gap-1">
            <template v-if="target.gap > 0">
              <AlertTriangle :class="['w-2.5 h-2.5', target.isBehind ? 'text-amber-500' : 'text-gray-300']" />
              <span class="text-[9px] font-bold text-gray-500">还需打卡 <span class="text-red-500">{{ target.gap }}</span> 次</span>
            </template>
            <template v-else>
              <CheckCircle class="w-2.5 h-2.5 text-emerald-500" />
              <span class="text-[9px] font-bold text-emerald-600">指标已达标</span>
            </template>
          </div>
          <div :class="['flex items-center gap-1 px-1.5 py-0.5 rounded-md', target.isBehind ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600']">
            <TrendingUp class="w-2 h-2" />
            <span class="text-[8px] font-black uppercase tracking-tighter">
              预计{{ target.isBehind ? '预警' : '达标' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100/50">
      <p class="text-[9px] text-emerald-800 font-bold leading-relaxed flex items-center gap-2">
        <span class="bg-emerald-200 text-emerald-700 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px]">i</span>
        系统已根据当前进度自动识别异常状态，请关注琥珀色预警项并及时补卡。
      </p>
    </div>
  </div>
</template>
