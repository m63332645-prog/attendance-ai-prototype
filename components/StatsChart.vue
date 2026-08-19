<script setup>
const data = [
  { name: '周一', hours: 8.5 },
  { name: '周二', hours: 9.2 },
  { name: '周三', hours: 7.8 },
  { name: '周四', hours: 8.9 },
  { name: '周五', hours: 9.5 },
  { name: '周六', hours: 0 },
  { name: '周日', hours: 0 },
];

const maxHours = 10;
</script>

<template>
  <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100 h-64 flex flex-col">
    <h3 class="text-lg font-bold text-gray-800 mb-4">
      本周工时统计
    </h3>
    <div class="flex-1 flex items-end justify-between gap-2 px-2">
      <div
        v-for="item in data"
        :key="item.name"
        class="flex-1 flex flex-col items-center gap-2 group"
      >
        <div class="relative w-full flex flex-col items-center">
          <!-- Tooltip on hover -->
          <div class="absolute -top-8 bg-gray-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
            {{ item.hours }} 小时
          </div>
          <!-- Bar -->
          <div 
            :class="['w-full rounded-t-lg transition-all duration-500', item.hours > 0 ? 'bg-emerald-500' : 'bg-gray-100']"
            :style="{ height: `${(item.hours / maxHours) * 140}px` }"
          />
        </div>
        <span class="text-[10px] font-bold text-gray-400">{{ item.name }}</span>
      </div>
    </div>
  </div>
</template>
