<script setup>
// 我的页面 （废弃）http://localhost:3000/#/profile
import { store } from '../store';
import { 
  FlaskConical, 
  Settings2, 
  Clock, 
  MapPin, 
  Building2, 
  RefreshCcw, 
  ShieldAlert, 
  ToggleRight, 
  ToggleLeft, 
  ShieldCheck, 
  LayoutTemplate,
  CheckCircle 
} from 'lucide-vue-next';
import { MOCK_WORKPLACES } from '../constants';

const toggleSupervisorMode = () => {
  store.isSupervisorMode = !store.isSupervisorMode;
  localStorage.setItem('supervisor_mode_v4', JSON.stringify(store.isSupervisorMode));
};

const updateMockWorkplace = (wp) => {
  store.updateMockWorkplace(wp);
};
</script>

<template>
  <div class="p-6 pb-20 space-y-6">
    <div class="text-center mb-8">
      <div class="relative w-24 h-24 mx-auto mb-4">
        <div class="w-24 h-24 bg-emerald-100 rounded-full border-4 border-white shadow-xl overflow-hidden ring-4 ring-emerald-50">
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Zhang"
            alt="avatar"
          >
        </div>
      </div>
      <h2 class="text-2xl font-bold text-gray-800 tracking-tight">
        张志强
      </h2>
      <p class="text-gray-500 font-bold text-xs uppercase tracking-widest">
        中宏人寿 营销代理人
      </p>
    </div>

    <div class="bg-slate-900 rounded-lg p-6 text-white shadow-2xl relative overflow-hidden border border-slate-800 group">
      <div class="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
        <FlaskConical class="w-24 h-24 text-amber-500" />
      </div>
      
      <div class="flex items-center justify-between mb-6 relative">
        <div class="bg-amber-500/20 p-2 rounded-lg">
          <Settings2 class="w-5 h-5 text-amber-500" />
        </div>
        <div class="flex-1 ml-3">
          <h3 class="text-sm font-black uppercase tracking-widest">
            演示模式 / 仿真工具
          </h3>
          <p class="text-[9px] text-slate-500 font-bold uppercase mt-0.5">
            模拟地理围栏与时间
          </p>
        </div>
        <van-button
          size="mini"
          type="danger"
          plain
          round
          @click="store.resetAttendance"
        >
          重置所有
        </van-button>
      </div>

      <div class="space-y-6 relative">
        <!-- Time Mocking -->
        <div class="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <Clock class="w-3.5 h-3.5 text-emerald-400" />
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">仿真时间</span>
            </div>
            <span class="text-xs font-black text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {{ store.currentTime.toLocaleTimeString('zh-CN', { hour12: false }) }}
            </span>
          </div>
          <van-slider
            v-model="store.demoTimeOffset"
            :min="-720"
            :max="720"
            :step="30"
            active-color="#00a758"
          />
          <div class="flex justify-between mt-2">
            <span class="text-[8px] font-bold text-slate-600 uppercase">-12h</span>
            <span class="text-[8px] font-bold text-slate-500 uppercase">现在</span>
            <span class="text-[8px] font-bold text-slate-600 uppercase">+12h</span>
          </div>
        </div>

        <div class="flex flex-col gap-3">
          <van-button 
            block
            round
            class="h-auto py-4 border-2 transition-all"
            :class="!store.mockWorkplace ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'"
            @click="updateMockWorkplace(null)"
          >
            <div class="flex items-center justify-between w-full px-4">
              <div class="flex items-center gap-3">
                <MapPin class="w-4 h-4" />
                <span class="text-xs font-black uppercase tracking-widest">真实 GPS 定位</span>
              </div>
              <CheckCircle
                v-if="!store.mockWorkplace"
                class="w-4 h-4"
              />
            </div>
          </van-button>
           
          <div class="grid grid-cols-1 gap-2">
            <p class="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] px-1 mt-2">
              预设营销服务部 (围栏模拟)
            </p>
            <van-button 
              v-for="wp in MOCK_WORKPLACES"
              :key="wp.id"
              block
              round
              class="h-auto py-4 border-2 transition-all"
              :class="store.mockWorkplace?.id === wp.id ? 'bg-amber-500/10 border-amber-500 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-400'"
              @click="updateMockWorkplace(wp)"
            >
              <div class="flex items-center justify-between w-full px-4">
                <div class="flex items-center gap-3 text-left">
                  <Building2 class="w-4 h-4" />
                  <div>
                    <span class="text-[11px] font-black uppercase tracking-tight block">{{ wp.name }}</span>
                    <span class="text-[8px] font-bold opacity-60 block">{{ wp.managementOffice }}</span>
                  </div>
                </div>
                <RefreshCcw
                  v-if="store.mockWorkplace?.id === wp.id"
                  class="w-4 h-4 animate-spin"
                />
              </div>
            </van-button>
          </div>
        </div>
        
        <div class="bg-slate-800/50 p-3 rounded-lg border border-slate-700 flex items-start gap-3 mt-4">
          <ShieldAlert class="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
          <p class="text-[9px] text-slate-400 font-bold leading-relaxed">
            注意：模拟定位仅用于演示该职场围栏内的考勤表现。在生产环境中使用可能导致合规风险。
          </p>
        </div>
      </div>
    </div>

    <div class="space-y-3">
      <van-cell
        is-link
        center
        round
        class="rounded-lg shadow-sm border border-gray-50 mb-3"
        @click="toggleSupervisorMode"
      >
        <template #title>
          <div class="flex items-center gap-3">
            <div class="p-2 bg-gray-50 rounded-lg">
              <component
                :is="store.isSupervisorMode ? ToggleRight : ToggleLeft"
                :class="['w-5 h-5', store.isSupervisorMode ? 'text-emerald-500' : 'text-slate-400']"
              />
            </div>
            <span class="font-bold text-gray-700">视角切换</span>
          </div>
        </template>
      </van-cell>
      
      <van-cell
        is-link
        center
        round
        class="rounded-lg shadow-sm border border-gray-50 mb-3"
        @click="$router.push('/supervisor-inbox')"
      >
        <template #title>
          <div class="flex items-center gap-3">
            <div class="p-2 bg-gray-50 rounded-lg">
              <ShieldCheck class="w-5 h-5 text-emerald-500/70" />
            </div>
            <span class="font-bold text-gray-700">审批中心</span>
          </div>
        </template>
      </van-cell>

      <van-cell
        is-link
        center
        round
        class="rounded-lg shadow-sm border border-gray-50 mb-3"
        @click="$router.push('/prototype')"
      >
        <template #title>
          <div class="flex items-center gap-3">
            <div class="p-2 bg-gray-50 rounded-lg">
              <LayoutTemplate class="w-5 h-5 text-emerald-500/70" />
            </div>
            <span class="font-bold text-gray-700">设计原型图</span>
          </div>
        </template>
      </van-cell>
    </div>
  </div>
</template>
