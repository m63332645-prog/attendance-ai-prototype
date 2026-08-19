<script setup>
import { CheckCircle2, FileText, ShieldCheck } from "lucide-vue-next";
import { useRouter } from "vue-router";

const router = useRouter();

const goToLeave = () => {
  router.push({ path: "/leave-form", query: { ...router.currentRoute.value.query } });
};

const goToAppeal = () => {
  router.push({ path: "/appeal-form", query: { ...router.currentRoute.value.query } });
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-20">
    <!-- 顶部绿色背景框 - 参考首页样式，下方两个小圆角 -->
    <div class="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 rounded-b-lg shadow-lg">
      <h1 class="text-lg font-bold text-white">你好, 王枫枭</h1>
    </div>

    <!-- 主内容区域 -->
    <div class="px-6 py-6">
      <div
        class="bg-white rounded-[32px] p-6 shadow-xl border border-gray-100 min-h-[420px] flex flex-col relative overflow-hidden"
        style="-webkit-mask-image: -webkit-radial-gradient(white, black)"
      >
        <div
          class="absolute -right-20 -top-20 w-64 h-64 bg-[#CAEED9] rounded-full blur-3xl opacity-30"
        />
        <div
          class="absolute -left-20 -bottom-20 w-64 h-64 bg-[#CAEED9] rounded-full blur-3xl opacity-20"
        />
        
        <!-- 晨会/二早标签 + 定位地址 -->
        <div class="flex items-center justify-between mb-4 relative z-10">
          <div class="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100">
            <CheckCircle2 class="w-3.5 h-3.5 text-[#00A758]" />
            <span class="text-[10px] font-black text-gray-600 uppercase tracking-widest">晨会</span>
          </div>
          <div class="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#DDF3E7] border border-[#CAEED9]">
            <div class="w-1.5 h-1.5 rounded-full bg-[#00A758]" />
            <span class="text-[10px] text-[#00A758]">长宁来福士广场16层</span>
          </div>
        </div>

        <!-- 打卡成功图标和文字 -->
        <div class="flex-1 flex flex-col items-center justify-center relative z-10">
          <div class="w-24 h-24 rounded-[32px] flex items-center justify-center bg-[#00A758] shadow-lg shadow-emerald-200">
            <CheckCircle2 class="w-14 h-14 text-white" />
          </div>
          <div class="text-center mt-6">
            <p class="text-xl font-black tracking-widest text-[#00A758]">打卡成功</p>
            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">准时状态已记录</p>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex gap-4 mt-6">
        <button
          class="flex-1 bg-white text-[#00A758] font-bold text-sm py-3 rounded-xl border border-gray-100 shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
          @click="goToLeave"
        >
          <FileText class="w-4 h-4" />
          在线请假
        </button>
        <button
          class="flex-1 bg-white text-[#F49600] font-bold text-sm py-3 rounded-xl border border-gray-100 shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
          @click="goToAppeal"
        >
          <ShieldCheck class="w-4 h-4" />
          申诉中心
        </button>
      </div>
    </div>
  </div>
</template>
