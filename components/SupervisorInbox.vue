<script setup>
import { ref, computed } from 'vue';
import { ArrowLeft, CheckCircle, XCircle, Clock, MapPin, MessageCircle, ShieldCheck, AlertCircle, Sparkles, CalendarDays, UserCheck } from 'lucide-vue-next';
import { AppealStatus } from '../constants';

const props = defineProps({
  pendingRecords: {
    type: Array,
    required: true
  },
  pendingLeaves: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['back', 'approve', 'approveLeave']);

const tab = ref('pending');

const totalPending = computed(() => props.pendingRecords.length + props.pendingLeaves.length);
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-24">
    <van-tabs
      v-model:active="tab"
      sticky
      animated
      swipeable
      color="#00a758"
    >
      <van-tab
        name="pending"
        :title="`待处理 (${totalPending})`"
      />
      <van-tab
        name="processed"
        title="处理历史"
      />
    </van-tabs>

    <div class="p-6 space-y-4">
      <template v-if="tab === 'pending'">
        <van-empty
          v-if="totalPending === 0"
          description="暂无待处理的申请"
        >
          <template #image>
            <ShieldCheck class="w-16 h-16 opacity-20 text-gray-400" />
          </template>
        </van-empty>
        <template v-else>
          <!-- 请假申请列表 -->
          <div
            v-for="leave in pendingLeaves"
            :key="leave.id"
            class="bg-white rounded-lg p-6 shadow-sm border border-emerald-50 relative overflow-hidden group mb-4"
          >
            <div class="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:scale-110 transition-transform">
              <CalendarDays class="w-20 h-20 text-emerald-50" />
            </div>

            <div class="flex items-start justify-between mb-6 relative">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center border-2 border-white shadow-sm overflow-hidden ring-4 ring-emerald-50/30 text-emerald-600 font-black">
                  <img
                    :src="`https://api.dicebear.com/7.x/avataaars/svg?seed=${leave.agentName}`"
                    alt="avatar"
                  >
                </div>
                <div>
                  <h3 class="font-black text-gray-800 text-sm tracking-tight">
                    {{ leave.agentName }}
                  </h3>
                  <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-0.5">
                    外勤代理人
                  </p>
                </div>
              </div>
              <van-tag
                round
                type="primary"
                size="medium"
                class="px-3 py-1 font-black uppercase tracking-tighter"
              >
                🗓️ 请假申请
              </van-tag>
            </div>

            <div class="space-y-4 mb-6 relative">
              <div class="flex items-center gap-3 text-gray-600">
                <div class="p-1.5 bg-emerald-50 rounded-lg">
                  <Clock class="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <span class="text-xs font-bold tracking-tight">
                  {{ new Date(leave.startDate).toLocaleDateString() }} - {{ new Date(leave.endDate).toLocaleDateString() }}
                </span>
              </div>

              <div class="flex flex-col gap-2 bg-emerald-50/30 p-4 rounded-lg border border-emerald-50/50">
                <div class="flex items-center gap-2">
                  <MessageCircle class="w-3.5 h-3.5 text-emerald-500" />
                  <span class="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{{ leave.type }}缘由</span>
                </div>
                <p class="text-xs font-bold text-emerald-800 leading-relaxed italic">
                  "{{ leave.reason }}"
                </p>
                <!-- 请假证明照片 -->
                <div
                  v-if="leave.photos && leave.photos.length > 0"
                  class="flex gap-2 mt-2 overflow-x-auto pb-1"
                >
                  <div
                    v-for="(p, idx) in leave.photos"
                    :key="idx"
                    class="w-16 h-16 rounded-lg overflow-hidden border border-emerald-100 shrink-0"
                  >
                    <img
                      :src="p"
                      class="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    >
                  </div>
                </div>
              </div>
            </div>

            <div class="flex gap-3 pt-6 border-t border-gray-50 relative">
              <van-button 
                round
                plain
                type="danger"
                class="flex-1 h-12 font-black uppercase tracking-widest"
                @click="emit('approveLeave', leave.id, false)"
              >
                <div class="flex items-center justify-center gap-2">
                  <XCircle class="w-4 h-4" />
                  驳回
                </div>
              </van-button>
              <van-button 
                round
                type="primary"
                color="#00a758"
                class="flex-1 h-12 font-black uppercase tracking-widest shadow-lg shadow-emerald-100"
                @click="emit('approveLeave', leave.id, true)"
              >
                <div class="flex items-center justify-center gap-2">
                  <CheckCircle class="w-4 h-4" />
                  批准
                </div>
              </van-button>
            </div>
          </div>

          <!-- 打卡申诉列表 -->
          <div
            v-for="record in pendingRecords"
            :key="record.id"
            class="bg-white rounded-lg p-6 shadow-sm border border-gray-100 relative overflow-hidden group mb-4"
          >
            <div class="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
              <Sparkles class="w-24 h-24" />
            </div>

            <div class="flex items-start justify-between mb-6 relative">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center border-2 border-white shadow-sm overflow-hidden ring-4 ring-emerald-50/30">
                  <img
                    :src="`https://api.dicebear.com/7.x/avataaars/svg?seed=${record.agentName}`"
                    alt="avatar"
                  >
                </div>
                <div>
                  <h3 class="font-black text-gray-800 text-sm tracking-tight">
                    {{ record.agentName }}
                  </h3>
                  <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-0.5">
                    {{ record.agentLevel }}
                  </p>
                </div>
              </div>
              <van-tag 
                round 
                :type="record.appealStatus === AppealStatus.PENDING ? 'danger' : 'warning'" 
                size="medium"
                class="px-3 py-1 font-black uppercase tracking-tighter"
                :class="{ 'animate-pulse': record.appealStatus === AppealStatus.PENDING }"
              >
                {{ record.appealStatus === AppealStatus.PENDING ? '❗ 异常申诉' : '手工打卡' }}
              </van-tag>
            </div>

            <div class="space-y-4 mb-6 relative">
              <div class="flex items-center gap-3 text-gray-600">
                <div class="p-1.5 bg-gray-50 rounded-lg">
                  <Clock class="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <span class="text-xs font-bold tracking-tight">打卡时段: {{ new Date(record.timestamp).toLocaleString() }} · {{ record.activityType }}</span>
              </div>
              
              <div class="flex flex-col gap-2 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div class="flex items-center gap-2">
                  <component
                    :is="record.appealStatus === AppealStatus.PENDING ? AlertCircle : MessageCircle"
                    :class="['w-3.5 h-3.5', record.appealStatus === AppealStatus.PENDING ? 'text-red-500' : 'text-amber-500']"
                  />
                  <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">申诉缘由 / 备注说明</span>
                </div>
                <p class="text-xs font-bold text-slate-700 leading-relaxed italic">
                  "{{ record.appealStatus === AppealStatus.PENDING ? record.appealReason : record.remark }}"
                </p>
                <!-- 申诉证明照片 -->
                <div
                  v-if="record.appealPhotos && record.appealPhotos.length > 0"
                  class="flex gap-2 mt-2 overflow-x-auto pb-1"
                >
                  <div
                    v-for="(p, idx) in record.appealPhotos"
                    :key="idx"
                    class="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 shrink-0"
                  >
                    <img
                      :src="p"
                      class="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    >
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-2 px-1">
                <MapPin class="w-3.5 h-3.5 text-slate-300" />
                <span class="text-[10px] font-bold text-slate-400 truncate">{{ record.address || 'GPS 定位数据缺失' }}</span>
              </div>
            </div>

            <div class="flex gap-3 pt-6 border-t border-gray-50 relative">
              <van-button 
                round
                plain
                type="danger"
                class="flex-1 h-12 font-black uppercase tracking-widest"
                @click="emit('approve', record.id, false)"
              >
                <div class="flex items-center justify-center gap-2">
                  <XCircle class="w-4 h-4" />
                  驳回
                </div>
              </van-button>
              <van-button 
                round
                type="primary"
                color="#00a758"
                class="flex-1 h-12 font-black uppercase tracking-widest shadow-lg shadow-emerald-100"
                @click="emit('approve', record.id, true)"
              >
                <div class="flex items-center justify-center gap-2">
                  <CheckCircle class="w-4 h-4" />
                  批准
                </div>
              </van-button>
            </div>
          </div>
        </template>
      </template>
      <van-empty
        v-else
        description="处理历史记录暂无"
      >
        <template #image>
          <UserCheck class="w-16 h-16 opacity-20 text-gray-400" />
        </template>
      </van-empty>
    </div>
  </div>
</template>
