<script setup>
// 考勤明细页
import { ref, computed, onMounted } from "vue";
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileText,
  Send,
  AlertCircle,
  User,
  HelpCircle,
} from "lucide-vue-next";
import CalendarView from "../components/CalendarView.vue";
import { useRouter } from "vue-router";
import { formatDate } from "../utils/dateFormat";
import { store } from "../store";

// 格式化日期为 YYYY-MM-DD
const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
import DefaultTemp from "../components/defaultTemp.vue";
import ticket from "@/assets/image/ticket.png";

const router = useRouter();
const selectedDate = ref(new Date(2026, 6, 1)); // 默认7月1日
const showExemptionSheet = ref(false);
const currentRecordForExemption = ref(null);
const isLoading = ref(false);
const showReasonTooltip = ref(false);

// 模拟数据，不调用API
// 6月：准时1-21号（排除周日），异常22-30号（排除周日）
// 7月：准时1/2/3号，异常6号，其余待打卡
const mockAttendanceData = {};

// === 6月数据 ===
// 生成6月准时打卡数据（1号-21号，排除周日）
for (let day = 1; day <= 21; day++) {
  const d = new Date(2026, 5, day); // 月份从0开始，5=6月
  if (d.getDay() !== 0) { // 排除周日
    const dateStr = `2026-06-${String(day).padStart(2, "0")}`;
    const timeStr = `09:${String(5 + (day % 20)).padStart(2, "0")}:00`;
    mockAttendanceData[dateStr] = {
      state: "Y",
      agyLaAtnds: [{ id: `m${day}`, atndTyp: "01", state: "Y", makeDate: `${dateStr} ${timeStr}`, modifyDate: null, operator: "SH686699", isManualInd: "N" }],
      leaveApplications: [],
    };
  }
}

// 生成6月异常打卡数据（22号-30号，排除周日28号）
for (let day = 22; day <= 30; day++) {
  const d = new Date(2026, 5, day);
  if (d.getDay() !== 0) { // 排除周日
    const dateStr = `2026-06-${String(day).padStart(2, "0")}`;
    mockAttendanceData[dateStr] = {
      state: "I",
      agyLaAtnds: [{ id: `m${day}`, atndTyp: "01", state: "I", makeDate: null, modifyDate: null, operator: null, isManualInd: null }],
      leaveApplications: [],
    };
  }
}

// === 7月数据 ===
// 7月1号 → 正常（晨会+晨会-二次）
mockAttendanceData["2026-07-01"] = {
  state: "Y",
  agyLaAtnds: [
    { id: "j1-1", atndTyp: "01", state: "Y", makeDate: "2026-07-01 09:05:00", modifyDate: null, operator: "SH686699", isManualInd: "N" },
    { id: "j1-2", atndTyp: "02", state: "Y", makeDate: "2026-07-01 10:10:00", modifyDate: null, operator: "SH686699", isManualInd: "N" }
  ],
  leaveApplications: [],
};

// 7月2号 → 正常（晨会+晨会-二次）
mockAttendanceData["2026-07-02"] = {
  state: "Y",
  agyLaAtnds: [
    { id: "j2-1", atndTyp: "01", state: "Y", makeDate: "2026-07-02 09:07:00", modifyDate: null, operator: "SH686699", isManualInd: "N" },
    { id: "j2-2", atndTyp: "02", state: "Y", makeDate: "2026-07-02 10:08:00", modifyDate: null, operator: "SH686699", isManualInd: "N" }
  ],
  leaveApplications: [],
};

// 7月3号 → 准时打卡
for (const day of [3]) {
  const dateStr = `2026-07-${String(day).padStart(2, "0")}`;
  const timeStr = `09:${String(5 + (day % 20)).padStart(2, "0")}:00`;
  mockAttendanceData[dateStr] = {
    state: "Y",
    agyLaAtnds: [{ id: `j${day}`, atndTyp: "01", state: "Y", makeDate: `${dateStr} ${timeStr}`, modifyDate: null, operator: "SH686699", isManualInd: "N" }],
    leaveApplications: [],
  };
}

// 7月8号 → 待审核 + 异常
mockAttendanceData["2026-07-08"] = {
  state: "Y",
  agyLaAtnds: [
    { id: "j8-1", atndTyp: "01", state: "P", makeDate: "2026-07-08 09:13:00", modifyDate: null, operator: "SH686699", isManualInd: "N" },
    { id: "j8-2", atndTyp: "01", state: "I", makeDate: "2026-07-08 09:17:00", modifyDate: null, operator: "SH686699", isManualInd: "N" }
  ],
  leaveApplications: [],
};

// 7月9号 → 待审核 + 异常
mockAttendanceData["2026-07-09"] = {
  state: "Y",
  agyLaAtnds: [
    { id: "j9-1", atndTyp: "01", state: "P", makeDate: "2026-07-09 09:13:00", modifyDate: null, operator: "SH686699", isManualInd: "N" },
    { id: "j9-2", atndTyp: "01", state: "I", makeDate: "2026-07-09 09:17:00", modifyDate: null, operator: "SH686699", isManualInd: "N" }
  ],
  leaveApplications: [],
};

// 7月10号 → 待审核 + 异常
mockAttendanceData["2026-07-10"] = {
  state: "Y",
  agyLaAtnds: [
    { id: "j10-1", atndTyp: "01", state: "P", makeDate: "2026-07-10 09:13:00", modifyDate: null, operator: "SH686699", isManualInd: "N" },
    { id: "j10-2", atndTyp: "01", state: "I", makeDate: "2026-07-10 09:17:00", modifyDate: null, operator: "SH686699", isManualInd: "N" }
  ],
  leaveApplications: [],
};

// 7月13号 → 晨会迟到 + 晨会-二次正常（新样式）
mockAttendanceData["2026-07-13"] = {
  state: "Y",
  agyLaAtnds: [{ id: "j13", atndTyp: "01", state: "L", makeDate: "2026-07-13 09:17:22", modifyDate: null, operator: "SH686699", isManualInd: "N" }],
  leaveApplications: [],
};

// 7月14号 → 晨会迟到 + 晨会-二次正常（复制7月13号的数据）
mockAttendanceData["2026-07-14"] = {
  state: "Y",
  agyLaAtnds: [{ id: "j14", atndTyp: "01", state: "L", makeDate: "2026-07-14 09:17:22", modifyDate: null, operator: "SH686699", isManualInd: "N" }],
  leaveApplications: [],
};

// 7月待打卡日期（4号、5号、11号-12号、15号-31号，排除周日、6号、7号、8号、9号、10号、13号、14号）
for (let day = 4; day <= 31; day++) {
  if (day === 6 || day === 7 || day === 8 || day === 9 || day === 10 || day === 13 || day === 14) continue; // 6号已设为晨会正常+晨会-二次迟到，7号已设为请假，8号已设为待审核+异常，9号已设为待审核+异常，10号已设为待审核+异常，13号已设为迟到，14号已设为迟到
  const d = new Date(2026, 6, day); // 6=7月
  if (d.getDay() !== 0) { // 排除周日
    const dateStr = `2026-07-${String(day).padStart(2, "0")}`;
    mockAttendanceData[dateStr] = {
      state: "P", // P = Pending 待打卡
      agyLaAtnds: [],
      leaveApplications: [],
    };
  }
}

// 7月6号 → 晨会正常 + 晨会-二次迟到
mockAttendanceData["2026-07-06"] = {
  state: "Y",
  agyLaAtnds: [
    { id: "j61", atndTyp: "01", state: "Y", makeDate: "2026-07-06 09:05:00", modifyDate: null, operator: "SH686699", isManualInd: "N" },
    { id: "j62", atndTyp: "02", state: "L", makeDate: "2026-07-06 10:17:00", modifyDate: null, operator: "SH686699", isManualInd: "N" },
  ],
  leaveApplications: [],
};

// 7月7号 → 请假状态（审核中）
mockAttendanceData["2026-07-07"] = {
  state: "L", // L = Leave 请假
  agyLaAtnds: [],
  leaveApplications: [{
    id: "leave7",
    status: "PENDING",
    applyTime: "2026-07-06 10:24:42",
    applyType: "请事假申请",
  }],
};

const fetchAttendanceData = () => {};
const onRefresh = () => {};
const handleMonthChange = () => {};

// 判断选中日期是否为异常日期（直接使用模拟数据）
const isAbnormalDate = computed(() => {
  const dateStr = formatLocalDate(selectedDate.value);
  const dayData = mockAttendanceData[dateStr];
  return dayData?.state === "I";
});

// 判断选中日期是否为待打卡日期
const isPendingDate = computed(() => {
  const dateStr = formatLocalDate(selectedDate.value);
  const dayData = mockAttendanceData[dateStr];
  return dayData?.state === "P";
});

// 判断选中日期是否为7月
const isSelectedDateJuly = computed(() => {
  return selectedDate.value.getMonth() + 1 === 7;
});

// 获取选中日期的日（几号）
const selectedDay = computed(() => {
  return selectedDate.value.getDate();
});

// 判断选中日期是否为请假日期
const isLeaveDate = computed(() => {
  const dateStr = formatLocalDate(selectedDate.value);
  const dayData = mockAttendanceData[dateStr];
  return dayData?.state === "L";
});

// 获取请假申请数据
const leaveApplications = computed(() => {
  const dateStr = formatLocalDate(selectedDate.value);
  const dayData = mockAttendanceData[dateStr];
  return dayData?.leaveApplications || [];
});

// 获取正常打卡记录（直接使用模拟数据）
const normalRecords = computed(() => {
  const dateStr = formatLocalDate(selectedDate.value);
  const dayData = mockAttendanceData[dateStr];
  
  // 异常日期不显示正常记录
  if (dayData?.state === "I") return [];

  if (dayData && dayData.agyLaAtnds && dayData.agyLaAtnds.length > 0) {
    return dayData.agyLaAtnds.filter(r => r.state !== "I" && r.makeDate);
  }
  return [];
});

const navigateToAppeal = () => {
  router.push({ path: "/appeal-form", query: { ...router.currentRoute.value.query } });
};

const openExemptionSelection = () => {
  showExemptionSheet.value = true;
};

const handleLeaveSubmit = () => {};

onMounted(() => {
  store.currentTimeArr = Object.keys(mockAttendanceData).map(date => ({
    date,
    ...mockAttendanceData[date]
  }));
});
</script>

<template>
  <div class="p-6 pb-20 space-y-4">
    <van-pull-refresh v-model="isLoading" @refresh="onRefresh">
      <CalendarView
        :records="[]"
        :leave-requests="[]"
        @month-change="handleMonthChange"
        :selected-date="selectedDate"
        @date-select="selectedDate = $event"
      />
      <div class="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-gray-800 text-lg">
            {{
              selectedDate &&
              selectedDate.toLocaleDateString("zh-CN", {
                month: "long",
                day: "numeric",
              })
            }}
            明细
          </h3>


        </div>

        <!-- 异常状态卡片 -->
        <div v-if="isAbnormalDate" class="bg-white rounded-lg p-4 border border-[#F3F4F6]">
          <!-- 6月异常：不显示未知地点和发起申诉按钮 -->
          <div v-if="!isSelectedDateJuly">
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full flex items-center justify-center bg-[#FFF5F5]" />
                <div>
                  <h4 class="font-bold text-gray-800 text-base">晨会</h4>
                  <p class="text-[11px] font-bold text-gray-400 mt-0.5">异常</p>
                </div>
              </div>
              <span class="text-[9px] font-black text-[#FF6777] bg-[#FFF5F5] px-2 py-1 rounded-md uppercase">异常</span>
            </div>
          </div>
          <!-- 7月异常：显示完整内容 -->
          <DefaultTemp v-else temp-type="I" />
          <div v-if="isSelectedDateJuly" class="flex gap-2 pt-2">
            <button
              class="flex-1 bg-[#FFF5F5] text-[#282B3E] font-bold text-sm py-3 rounded-lg border border-[#FFE5E5] transition-all active:scale-95 flex items-center justify-center gap-1"
              @click="navigateToAppeal"
            >
              <AlertCircle class="w-4 h-4 text-[#282B3E]" />
              发起申诉
            </button>
          </div>
        </div>

        <!-- 复制异常状态卡片（仅7月显示） -->
        <div v-if="isAbnormalDate && isSelectedDateJuly" class="mt-4 bg-white rounded-lg p-4 border border-[#F3F4F6]">
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-[#FFF5F5]">
                <CheckCircle2 class="w-5 h-5 text-[#FF6777]" />
              </div>
              <div>
                <h4 class="font-bold text-gray-800 text-base">晨会-二次</h4>
                <p class="text-[11px] font-bold text-gray-400 mt-0.5">异常</p>
              </div>
            </div>
            <span class="text-[9px] font-black text-[#FF6777] bg-[#FFF5F5] px-2 py-1 rounded-md uppercase">异常</span>
          </div>
          <div class="flex gap-2 pt-2">
            <button
              class="flex-1 bg-[#FFF5F5] text-[#282B3E] font-bold text-sm py-3 rounded-lg border border-[#FFE5E5] transition-all active:scale-95 flex items-center justify-center gap-1"
              @click="navigateToAppeal"
            >
              <AlertCircle class="w-4 h-4 text-[#282B3E]" />
              发起申诉
            </button>
          </div>
        </div>

        <!-- 7月6日：使用豁免卡按钮（在两个卡片下方） -->
        <div v-if="isAbnormalDate && isSelectedDateJuly && selectedDay === 6" class="mt-4">
          <button
            class="w-full bg-[#CAEED9] text-[#00A758] font-bold text-sm py-3 rounded-lg border border-[#ACE5C4] transition-all active:scale-95"
            @click="openExemptionSelection"
          >
            使用豁免卡
          </button>
        </div>

        <!-- 待打卡状态卡片 -->
        <div v-else-if="isPendingDate" class="py-12 text-center">
          <Clock class="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p class="text-sm text-gray-400 font-bold">该日期暂无数据</p>
        </div>

        <!-- 请假状态卡片 -->
        <div v-else-if="isLeaveDate" class="bg-white rounded-lg p-4 border border-[#06C7BA] relative overflow-hidden">
          <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-[#06C7BA]" />
          <div v-for="leave in leaveApplications" :key="leave.id">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <div class="w-5 h-5 rounded-full bg-[#00A758]/10 flex items-center justify-center">
                  <Clock class="w-3 h-3 text-[#00A758]" />
                </div>
                <span class="text-sm font-bold text-[#00A758]">审核中</span>
              </div>
              <span class="text-[11px] font-bold text-gray-400">{{ leave.applyTime }}</span>
            </div>
            <div class="bg-[#F9FAFB] rounded-lg p-3 border border-[#F3F4F6]">
              <div class="flex items-center gap-2">
                <Send class="w-3.5 h-3.5 text-gray-400" />
                <span class="text-[11px] font-bold text-gray-600">申请方式: {{ leave.applyType }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 7月1号：全新样式（晨会正常 + 晨会-二次正常）- 单独处理 -->
        <div v-else-if="isSelectedDateJuly && selectedDay === 1">
          <!-- 晨会打卡卡片 -->
          <div class="bg-white rounded-lg p-4 border border-emerald-200 relative overflow-hidden mb-4">
            <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-[#00A758]" />
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-gray-800 text-base">晨会</h4>
                <span class="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-50 text-[#00A758]">09:05 • 正常</span>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <Clock class="w-3 h-3" />
                  <span>打卡时间</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800">09:05:00</p>
              </div>
              <div>
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <User class="w-3 h-3" />
                  <span>操作人</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800">SH686699</p>
              </div>
              <div>
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <ShieldCheck class="w-3 h-3" />
                  <span>打卡方式</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800">人脸打卡</p>
              </div>
            </div>
          </div>
          <!-- 晨会-二次打卡卡片 -->
          <div class="bg-white rounded-lg p-4 border border-emerald-200 relative overflow-hidden">
            <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-[#00A758]" />
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-gray-800 text-base">晨会-二次</h4>
                <span class="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-50 text-[#00A758]">10:10 • 正常</span>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <Clock class="w-3 h-3" />
                  <span>打卡时间</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800">10:10:00</p>
              </div>
              <div>
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <User class="w-3 h-3" />
                  <span>操作人</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800">SH686699</p>
              </div>
              <div>
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <ShieldCheck class="w-3 h-3" />
                  <span>打卡方式</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800">人脸打卡</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 7月6号：全新样式（晨会正常 + 晨会-二次迟到）- 单独处理 -->
        <div v-else-if="isSelectedDateJuly && selectedDay === 6">
          <!-- 晨会打卡卡片 -->
          <div class="bg-white rounded-lg p-4 border border-[#E4E7ED] relative overflow-hidden mb-4">
            <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-[#E4E7ED]" />
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-gray-800 text-base">晨会</h4>
                <span class="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-50 text-[#00A758]">正常</span>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <Clock class="w-3 h-3" />
                  <span>打卡时间</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800">09:05:00</p>
              </div>
              <div>
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <User class="w-3 h-3" />
                  <span>操作人</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800">SH686699</p>
              </div>
              <div>
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <ShieldCheck class="w-3 h-3" />
                  <span>打卡方式</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800">人脸打卡</p>
              </div>
            </div>
          </div>
          <!-- 晨会-二次打卡卡片（迟到） -->
          <div class="bg-white rounded-lg p-4 border border-[#E4E7ED] relative overflow-hidden">
            <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-[#E4E7ED]" />
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-gray-800 text-base">晨会-二次</h4>
                <span class="text-[10px] font-black px-2 py-0.5 rounded bg-[#FBE9C6] text-[#F49600]">迟到</span>
              </div>
              <button
                class="bg-[#F49600] text-white font-bold text-[11px] px-2.5 py-1 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1"
                @click="navigateToAppeal"
              >
                <AlertCircle class="w-2.5 h-2.5" />
                发起申诉
              </button>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <Clock class="w-3 h-3" />
                  <span>打卡时间</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800">10:17:00</p>
              </div>
              <div>
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <User class="w-3 h-3" />
                  <span>操作人</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800">SH686699</p>
              </div>
              <div>
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <ShieldCheck class="w-3 h-3" />
                  <span>打卡方式</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800">人脸打卡</p>
              </div>
            </div>
          </div>
          <!-- 使用豁免卡按钮 -->
          <button
            class="w-full bg-[#00A758] text-white font-bold text-xs py-2.5 rounded-lg transition-all active:scale-95 mt-4"
            @click="openExemptionSelection"
          >
            使用豁免卡
          </button>
        </div>

        <!-- 7月2号：全新样式（晨会正常 + 晨会-二次正常）- 单独处理 -->
        <div v-else-if="isSelectedDateJuly && selectedDay === 2">
          <!-- 晨会打卡卡片 -->
          <div class="bg-white rounded-lg p-4 border border-emerald-200 relative overflow-hidden mb-4">
            <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-[#00A758]" />
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-gray-800 text-base">晨会</h4>
                <span class="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-50 text-[#00A758]">09:07 • 正常</span>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <Clock class="w-3 h-3" />
                  <span>打卡时间</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800">09:07:00</p>
              </div>
              <div>
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <User class="w-3 h-3" />
                  <span>操作人</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800">SH686699</p>
              </div>
              <div>
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <ShieldCheck class="w-3 h-3" />
                  <span>打卡方式</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800">人脸打卡</p>
              </div>
            </div>
          </div>
          <!-- 晨会-二次打卡卡片 -->
          <div class="bg-white rounded-lg p-4 border border-red-200 relative overflow-hidden">
            <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-[#FF6777]" />
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-gray-800 text-base">晨会-二次</h4>
                <span class="text-[10px] font-black px-2 py-0.5 rounded bg-[#FFF5F5] text-[#FF6777]">异常</span>
              </div>
              <button
                class="bg-[#F49600] text-white font-bold text-[11px] px-2.5 py-1 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1"
                @click="navigateToAppeal"
              >
                <AlertCircle class="w-2.5 h-2.5" />
                发起申诉
              </button>
            </div>
          </div>
          <!-- 使用豁免卡按钮 -->
          <button
            class="w-full bg-[#00A758] text-white font-bold text-xs py-2.5 rounded-lg transition-all active:scale-95 mt-4"
            @click="openExemptionSelection"
          >
            使用豁免卡
          </button>
        </div>

        <!-- 7月3号：全新样式（晨会迟到 + 晨会-二次异常）- 单独处理 -->
        <div v-else-if="isSelectedDateJuly && selectedDay === 3">
          <!-- 晨会打卡卡片 -->
          <div class="bg-white rounded-lg p-4 border border-amber-200 relative overflow-hidden mb-4">
            <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500" />
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-gray-800 text-base">晨会</h4>
                <span class="text-[10px] font-black px-2 py-0.5 rounded bg-[#FBE9C6] text-[#F49600]">09:17 • 迟到</span>
              </div>
              <button
                class="bg-[#F49600] text-white font-bold text-[11px] px-2.5 py-1 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1"
                @click="navigateToAppeal"
              >
                <AlertCircle class="w-2.5 h-2.5" />
                发起申诉
              </button>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <Clock class="w-3 h-3" />
                  <span>打卡时间</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800">09:17:00</p>
              </div>
              <div>
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <User class="w-3 h-3" />
                  <span>操作人</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800">SH686699</p>
              </div>
              <div>
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <ShieldCheck class="w-3 h-3" />
                  <span>打卡方式</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800">人脸打卡</p>
              </div>
            </div>
          </div>
          <!-- 晨会-二次打卡卡片（异常） -->
          <div class="bg-white rounded-lg p-4 border border-red-200 relative overflow-hidden">
            <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-[#FF6777]" />
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-gray-800 text-base">晨会-二次</h4>
                <span class="text-[10px] font-black px-2 py-0.5 rounded bg-[#FFF5F5] text-[#FF6777]">异常</span>
              </div>
              <button
                class="bg-[#F49600] text-white font-bold text-[11px] px-2.5 py-1 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1"
                @click="navigateToAppeal"
              >
                <AlertCircle class="w-2.5 h-2.5" />
                发起申诉
              </button>
            </div>
          </div>
          <!-- 使用豁免卡按钮 -->
          <button
            class="w-full bg-[#00A758] text-white font-bold text-xs py-2.5 rounded-lg transition-all active:scale-95 mt-4"
            @click="openExemptionSelection"
          >
            使用豁免卡
          </button>
        </div>

        <!-- 7月13号：全新样式（晨会迟到 + 在岗正常）- 单独处理 -->
        <div v-else-if="isSelectedDateJuly && selectedDay === 13">
          <!-- 晨会打卡卡片 -->
          <div class="bg-white rounded-lg p-4 border border-amber-200 relative overflow-hidden mb-4">
            <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500" />
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-gray-800 text-base">晨会</h4>
                <span class="text-[10px] font-black px-2 py-0.5 rounded bg-[#FBE9C6] text-[#F49600]">09:17 • 迟到</span>
              </div>
              <button
                class="bg-[#F49600] text-white font-bold text-[11px] px-2.5 py-1 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1"
                @click="navigateToAppeal"
              >
                <AlertCircle class="w-2.5 h-2.5" />
                发起申诉
              </button>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <Clock class="w-3 h-3" />
                  <span>打卡时间</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800"> 09:17:22</p>
              </div>
              <div>
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <User class="w-3 h-3" />
                  <span>操作人</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800">SH686699</p>
              </div>
              <div>
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <ShieldCheck class="w-3 h-3" />
                  <span>打卡方式</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800">人脸打卡</p>
              </div>
            </div>
          </div>
          <!-- 晨会-二次打卡卡片 -->
          <div class="bg-white rounded-lg p-4 border border-emerald-200 relative overflow-hidden">
            <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-[#00A758]" />
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-gray-800 text-base">晨会-二次</h4>
                <span class="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-50 text-[#00A758]">10:10 • 正常</span>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <Clock class="w-3 h-3" />
                  <span>打卡时间</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800"> 10:00:00</p>
              </div>
              <div>
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <User class="w-3 h-3" />
                  <span>操作人</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800">SH686699</p>
              </div>
              <div>
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <ShieldCheck class="w-3 h-3" />
                  <span>打卡方式</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800">人脸打卡</p>
              </div>
            </div>
          </div>
          <!-- 使用豁免卡按钮 -->
          <button
            class="w-full bg-[#00A758] text-white font-bold text-xs py-2.5 rounded-lg transition-all active:scale-95 mt-4"
            @click="openExemptionSelection"
          >
            使用豁免卡
          </button>
        </div>

        <!-- 7月14号：全新样式（晨会迟到 + 晨会-二次正常）- 复制7月13号样式 -->
        <div v-else-if="isSelectedDateJuly && selectedDay === 14">
          <!-- 晨会打卡卡片 -->
          <div class="bg-white rounded-lg p-4 border border-amber-200 relative overflow-hidden mb-4">
            <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500" />
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-gray-800 text-base">晨会</h4>
                <span class="text-[10px] font-black px-2 py-0.5 rounded bg-[#FBE9C6] text-[#F49600]">09:17 • 迟到</span>
              </div>
              <button
                class="bg-[#F49600] text-white font-bold text-[11px] px-2.5 py-1 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1"
                @click="navigateToAppeal"
              >
                <AlertCircle class="w-2.5 h-2.5" />
                发起申诉
              </button>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <Clock class="w-3 h-3" />
                  <span>打卡时间</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800"> 09:17:22</p>
              </div>
              <div>
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <User class="w-3 h-3" />
                  <span>操作人</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800">SH686699</p>
              </div>
              <div>
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <ShieldCheck class="w-3 h-3" />
                  <span>打卡方式</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800">人脸打卡</p>
              </div>
            </div>
          </div>
          <!-- 晨会-二次打卡卡片 -->
          <div class="bg-white rounded-lg p-4 border border-emerald-200 relative overflow-hidden">
            <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-[#00A758]" />
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-gray-800 text-base">晨会-二次</h4>
                <span class="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-50 text-[#00A758]">10:10 • 正常</span>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <Clock class="w-3 h-3" />
                  <span>打卡时间</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800"> 10:00:00</p>
              </div>
              <div>
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <User class="w-3 h-3" />
                  <span>操作人</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800">SH686699</p>
              </div>
              <div>
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <ShieldCheck class="w-3 h-3" />
                  <span>打卡方式</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800">人脸打卡</p>
              </div>
            </div>
          </div>
          <!-- 使用豁免卡按钮（置灰） -->
          <button
            class="w-full bg-gray-300 text-gray-500 font-bold text-xs py-2.5 rounded-lg mt-4 cursor-not-allowed"
            disabled
          >
            使用豁免卡
          </button>
          <!-- 提示话术 -->
          <div class="flex items-center gap-1.5 mt-2">
            <div class="w-3 h-3 rounded-full border border-[#EC6453] flex items-center justify-center">
              <span class="text-[8px] font-bold text-[#EC6453]">!</span>
            </div>
            <span class="text-[10px] text-gray-400">今日不可使用豁免卡</span>
          </div>
        </div>

        <!-- 7月9号：待审核 + 异常（独立处理） -->
        <div v-else-if="isSelectedDateJuly && selectedDay === 9">
          <!-- 第一张卡片：晨会待审核 -->
          <div class="bg-white rounded-lg p-4 border border-[#361558] relative overflow-hidden mb-4">
            <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-[#361558]" />
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-gray-800 text-base">晨会</h4>
                <span class="text-[10px] font-black px-2 py-0.5 rounded bg-[#F8F2FF] text-[#361558]">09:13 • 待审核</span>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <Clock class="w-3 h-3" />
                  <span>打卡时间</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800">09:13:00</p>
              </div>
              <div>
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <User class="w-3 h-3" />
                  <span>操作人</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800">SH686699</p>
              </div>
              <div>
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <ShieldCheck class="w-3 h-3" />
                  <span>打卡方式</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800">人脸打卡</p>
              </div>
            </div>
          </div>
          <!-- 第二张卡片：晨会异常 -->
          <div class="bg-white rounded-lg p-4 border border-[#FF6777] relative overflow-hidden">
            <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-[#FF6777]" />
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-gray-800 text-base">晨会</h4>
                <span class="text-[10px] font-black px-2 py-0.5 rounded bg-[#FEF2F2] text-[#FF6777]">异常</span>
              </div>
              <button
                class="bg-[#F49600] text-white font-bold text-[11px] px-2.5 py-1 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1"
                @click="navigateToAppeal"
              >
                <AlertCircle class="w-2.5 h-2.5" />
                发起申诉
              </button>
            </div>
            <div class="grid grid-cols-3 gap-4 mb-2">
              <div class="col-span-1">
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <Clock class="w-3 h-3" />
                  <span>打卡时间</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800">09:17:00</p>
              </div>
              <div class="col-span-1">
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <User class="w-3 h-3" />
                  <span>操作人</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800">SH686699</p>
              </div>
              <div class="col-span-1">
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <ShieldCheck class="w-3 h-3" />
                  <span>打卡方式</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800">人脸打卡</p>
              </div>
            </div>
            <div class="bg-[#F3F4F6] rounded-lg px-3 py-2">
              <div class="flex items-center gap-1.5">
                <div class="w-4 h-4 rounded-full bg-[#FF6777] flex items-center justify-center flex-shrink-0">
                  <AlertCircle class="w-2.5 h-2.5 text-white" />
                </div>
                <p class="text-[11px] font-bold text-gray-800 whitespace-nowrap">异常原因：审核失败，背景图片不清晰</p>
              </div>
            </div>
          </div>
          <!-- 使用豁免卡按钮 -->
          <button
            class="w-full bg-[#00A758] text-white font-bold text-xs py-2.5 rounded-lg transition-all active:scale-95 mt-4"
            @click="openExemptionSelection"
          >
            使用豁免卡
          </button>
        </div>

        <!-- 7月8号：待审核 + 异常（独立处理） -->
        <div v-else-if="isSelectedDateJuly && selectedDay === 8">
          <!-- 第一张卡片：晨会待审核 -->
          <div class="bg-white rounded-lg p-4 border border-[#361558] relative overflow-hidden mb-4">
            <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-[#361558]" />
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-gray-800 text-base">晨会</h4>
                <span class="text-[10px] font-black px-2 py-0.5 rounded bg-[#F8F2FF] text-[#361558]">09:13 • 待审核</span>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <Clock class="w-3 h-3" />
                  <span>打卡时间</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800">09:13:00</p>
              </div>
              <div>
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <User class="w-3 h-3" />
                  <span>操作人</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800">SH686699</p>
              </div>
              <div>
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <ShieldCheck class="w-3 h-3" />
                  <span>打卡方式</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800">人脸打卡</p>
              </div>
            </div>
          </div>
          <!-- 第二张卡片：晨会异常 -->
          <div class="bg-white rounded-lg p-4 border border-[#FF6777] relative overflow-hidden">
            <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-[#FF6777]" />
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-gray-800 text-base">晨会</h4>
                <span class="text-[10px] font-black px-2 py-0.5 rounded bg-[#FEF2F2] text-[#FF6777]">异常</span>
              </div>
              <button
                class="bg-[#F49600] text-white font-bold text-[11px] px-2.5 py-1 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1"
                @click="navigateToAppeal"
              >
                <AlertCircle class="w-2.5 h-2.5" />
                发起申诉
              </button>
            </div>
            <div class="grid grid-cols-4 gap-2.5">
              <div>
                <div class="flex items-center gap-1 text-[10px] font-bold text-gray-400 mb-1">
                  <Clock class="w-2.5 h-2.5" />
                  <span>打卡时间</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800">09:17:00</p>
              </div>
              <div>
                <div class="flex items-center gap-1 text-[10px] font-bold text-gray-400 mb-1">
                  <User class="w-2.5 h-2.5" />
                  <span>操作人</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800">SH686699</p>
              </div>
              <div>
                <div class="flex items-center gap-1 text-[10px] font-bold text-gray-400 mb-1">
                  <ShieldCheck class="w-2.5 h-2.5" />
                  <span>打卡方式</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800">人脸打卡</p>
              </div>
              <div class="relative">
                <div class="flex items-center gap-1 text-[10px] font-bold text-gray-400 mb-1">
                  <AlertCircle class="w-2.5 h-2.5" />
                  <span>异常原因</span>
                </div>
                <div class="flex items-center gap-0.5">
                  <p class="text-[11px] font-bold text-gray-800">审核失败</p>
                  <button
                    class="w-2.5 h-2.5 rounded-full bg-[#361558] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity relative"
                    @click.stop="showReasonTooltip = !showReasonTooltip"
                  >
                    <span class="text-[7px] font-bold text-white">?</span>
                    <div
                      v-if="showReasonTooltip"
                      class="absolute bottom-full right-0 mb-1 px-2 py-1.5 bg-[#F3F4F6] text-gray-600 text-[10px] rounded-md whitespace-nowrap z-10 shadow-lg max-w-[150px]"
                    >
                      审核失败，背景图片不清晰
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <!-- 使用豁免卡按钮 -->
          <button
            class="w-full bg-[#00A758] text-white font-bold text-xs py-2.5 rounded-lg transition-all active:scale-95 mt-4"
            @click="openExemptionSelection"
          >
            使用豁免卡
          </button>
        </div>

        <!-- 7月10号：待审核 + 异常（独立处理） -->
        <div v-else-if="isSelectedDateJuly && selectedDay === 10">
          <!-- 第一张卡片：晨会待审核 -->
          <div class="bg-white rounded-lg p-4 border border-[#361558] relative overflow-hidden mb-4">
            <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-[#361558]" />
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-gray-800 text-base">晨会</h4>
                <span class="text-[10px] font-black px-2 py-0.5 rounded bg-[#F8F2FF] text-[#361558]">09:13 • 待审核</span>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <Clock class="w-3 h-3" />
                  <span>打卡时间</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800">09:13:00</p>
              </div>
              <div>
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <User class="w-3 h-3" />
                  <span>操作人</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800">SH686699</p>
              </div>
              <div>
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <ShieldCheck class="w-3 h-3" />
                  <span>打卡方式</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800">人脸打卡</p>
              </div>
            </div>
          </div>
          <!-- 第二张卡片：晨会异常 -->
          <div class="bg-white rounded-lg p-4 border border-[#FF6777] relative overflow-hidden">
            <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-[#FF6777]" />
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-gray-800 text-base">晨会</h4>
                <span class="text-[10px] font-black px-2 py-0.5 rounded bg-[#FEF2F2] text-[#FF6777]">异常</span>
              </div>
              <button
                class="bg-[#F49600] text-white font-bold text-[10px] px-2.5 py-1 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1"
                @click="navigateToAppeal"
              >
                <AlertCircle class="w-2.5 h-2.5" />
                发起申诉
              </button>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div class="col-span-1">
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <Clock class="w-3 h-3" />
                  <span>打卡时间</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800">09:17:00</p>
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mt-2 mb-1">
                  <AlertCircle class="w-3 h-3" />
                  <span>异常原因</span>
                </div>
                <div class="flex items-center gap-1">
                  <p class="text-[11px] font-bold text-gray-800">审核失败</p>
                  <button
                    class="w-3 h-3 rounded-full bg-[#361558] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity relative"
                    @click.stop="showReasonTooltip = !showReasonTooltip"
                  >
                    <span class="text-[8px] font-bold text-white">?</span>
                    <div
                      v-if="showReasonTooltip"
                      class="absolute bottom-full right-0 mb-1 px-2 py-1.5 bg-[#F3F4F6] text-gray-600 text-[10px] rounded-md whitespace-nowrap z-10 shadow-lg max-w-[150px]"
                    >
                      审核失败，背景图片不清晰
                    </div>
                  </button>
                </div>
              </div>
              <div class="col-span-1">
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <User class="w-3 h-3" />
                  <span>操作人</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800">SH686699</p>
              </div>
              <div class="col-span-1">
                <div class="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-1">
                  <ShieldCheck class="w-3 h-3" />
                  <span>打卡方式</span>
                </div>
                <p class="text-[11px] font-bold text-gray-800">人脸打卡</p>
              </div>
            </div>
          </div>
          <!-- 使用豁免卡按钮 -->
          <button
            class="w-full bg-[#00A758] text-white font-bold text-xs py-2.5 rounded-lg transition-all active:scale-95 mt-4"
            @click="openExemptionSelection"
          >
            使用豁免卡
          </button>
        </div>

        <!-- 正常打卡记录 -->
        <div v-else-if="normalRecords.length > 0 && !(isSelectedDateJuly && selectedDay === 1)">
          <div v-for="r in normalRecords" :key="r.id" class="mb-4 last:mb-0 bg-white rounded-lg p-4 border border-[#F3F4F6]">

            <!-- 7月9号：晨会迟到状态 -->
            <template v-if="isSelectedDateJuly && selectedDay === 9">
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-50">
                    <Clock class="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 class="font-bold text-gray-800 text-sm">晨会</h4>
                    <p class="text-[11px] font-bold text-[#F49600] mt-0.5">09:20 • 迟到</p>
                  </div>
                </div>
                <span class="text-[9px] font-black px-2 py-1 rounded-md bg-[#FBE9C6] text-[#F49600]">迟到</span>
              </div>
              <div class="space-y-2">
                <div class="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <Clock class="w-3.5 h-3.5 text-gray-400" />
                  <span class="text-[11px] font-bold text-gray-600">打卡时间: 2026-07-09 09:20:00</span>
                </div>
                <div class="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <FileText class="w-3.5 h-3.5 text-gray-400" />
                  <span class="text-[11px] font-bold text-gray-600">操作人: {{ r.operator || "-" }}</span>
                </div>
                <div class="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <ShieldCheck class="w-3.5 h-3.5 text-gray-400" />
                  <span class="text-[11px] font-bold text-gray-600">打卡方式: {{ r.isManualInd === "Y" ? "手工上传" : "人脸打卡" }}</span>
                </div>
              </div>
            </template>
            <!-- 7月3号：晨会迟到状态 -->
            <template v-else-if="isSelectedDateJuly && selectedDay === 3">
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-50">
                    <Clock class="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 class="font-bold text-gray-800 text-sm">晨会</h4>
                    <span class="text-[11px] font-black px-2 py-0.5 rounded-md bg-[#FBE9C6] text-[#F49600] mt-0.5 inline-block">09:17 • 迟到</span>
                  </div>
                </div>
                <button
                  class="bg-[#F49600] text-white font-bold text-xs px-3 py-2 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1"
                  @click="navigateToAppeal"
                >
                  <AlertCircle class="w-3.5 h-3.5 text-white" />
                  发起申诉
                </button>
              </div>
              <div class="space-y-2">
                <div class="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <Clock class="w-3.5 h-3.5 text-gray-400" />
                  <span class="text-[11px] font-bold text-gray-600">打卡时间: 2026-07-03 09:17:00</span>
                </div>
                <div class="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <FileText class="w-3.5 h-3.5 text-gray-400" />
                  <span class="text-[11px] font-bold text-gray-600">操作人: {{ r.operator || "-" }}</span>
                </div>
                <div class="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <ShieldCheck class="w-3.5 h-3.5 text-gray-400" />
                  <span class="text-[11px] font-bold text-gray-600">打卡方式: {{ r.isManualInd === "Y" ? "手工上传" : "人脸打卡" }}</span>
                </div>
              </div>
            </template>
            <!-- 7月10号：晨会迟到状态 -->
            <template v-else-if="isSelectedDateJuly && selectedDay === 10">
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-50">
                    <Clock class="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 class="font-bold text-gray-800 text-sm">晨会</h4>
                    <p class="text-[11px] font-bold text-gray-400 mt-0.5">09:17 • 迟到</p>
                  </div>
                </div>
                <span class="text-[11px] font-black px-2 py-0.5 rounded-md bg-[#FBE9C6] text-[#F49600]">迟到</span>
              </div>
              <div class="space-y-2">
                <div class="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <Clock class="w-3.5 h-3.5 text-gray-400" />
                  <span class="text-[11px] font-bold text-gray-600">打卡时间: 2026-07-10 09:17:00</span>
                </div>
                <div class="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <FileText class="w-3.5 h-3.5 text-gray-400" />
                  <span class="text-[11px] font-bold text-gray-600">操作人: {{ r.operator || "-" }}</span>
                </div>
                <div class="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <ShieldCheck class="w-3.5 h-3.5 text-gray-400" />
                  <span class="text-[11px] font-bold text-gray-600">打卡方式: {{ r.isManualInd === "Y" ? "手工上传" : "人脸打卡" }}</span>
                </div>
              </div>
            </template>
            
            <!-- 其他日期：正常打卡 -->
            <template v-else>
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div
                    :class="[
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      r.state === 'Y' ? 'bg-[#00A758]' : 'bg-amber-50',
                    ]"
                  >
                    <CheckCircle2 v-if="r.state === 'Y'" class="w-5 h-5 text-white" />
                    <Clock v-else class="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 class="font-bold text-gray-800 text-sm">
                      {{ r.atndTyp === "01" ? "晨会" : "晨会-二次" }}
                    </h4>
                    <p class="text-[11px] font-bold text-gray-400 mt-0.5">
                      {{
                        new Date(r.makeDate).toLocaleTimeString("zh-CN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      }}
                      {{ r.state === "Y" ? " • 正常" : r.state === "L" ? " • 迟到" : "" }}
                    </p>
                  </div>
                </div>
                <span
                  :class="[
                    'text-[9px] font-black px-2 py-1 rounded-md',
                    r.state === 'Y' ? 'bg-emerald-50 text-[#00A758]' : 'bg-amber-50 text-amber-600',
                  ]"
                >
                  {{ r.state === "Y" ? "准时" : r.state === "L" ? "迟到" : "" }}
                </span>
              </div>
              <div class="space-y-2">
                <div class="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <Clock class="w-3.5 h-3.5 text-gray-400" />
                  <span class="text-[11px] font-bold text-gray-600">
                    打卡时间: {{ r.makeDate || "-" }}
                  </span>
                </div>
                <div class="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <FileText class="w-3.5 h-3.5 text-gray-400" />
                  <span class="text-[11px] font-bold text-gray-600">
                    操作人: {{ r.operator || "-" }}
                  </span>
                </div>
                <div class="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <ShieldCheck class="w-3.5 h-3.5 text-gray-400" />
                  <span class="text-[11px] font-bold text-gray-600">
                    打卡方式: {{ r.isManualInd === "Y" ? "手工上传" : "人脸打卡" }}
                  </span>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- 复制正常打卡记录卡片（仅7月显示，14px间距，晨会→晨会-二次） -->
        <div v-if="normalRecords.length > 0 && isSelectedDateJuly && selectedDay !== 1 && selectedDay !== 2 && selectedDay !== 3 && selectedDay !== 6 && selectedDay !== 8 && selectedDay !== 9 && selectedDay !== 10 && selectedDay !== 13 && selectedDay !== 14">
          <div v-for="r in normalRecords" :key="'copy-' + r.id" class="mt-[14px] bg-white rounded-lg p-4 border border-[#F3F4F6]">
            <!-- 7月9号：晨会-二次异常状态 -->
            <template v-if="selectedDay === 9">
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-[#FFF5F5]">
                    <CheckCircle2 class="w-5 h-5 text-[#DC2B2B]" />
                  </div>
                  <div>
                    <h4 class="font-bold text-gray-800 text-sm">晨会-二次</h4>
                    <p class="text-[11px] font-bold text-[#C0C4CC] mt-0.5">异常</p>
                  </div>
                </div>
                <span class="text-[9px] font-black px-2 py-1 rounded-md bg-[#FEF2F2] text-[#DC2B2B]">异常</span>
              </div>
            </template>
            <!-- 7月2号：异常状态 -->
            <template v-else-if="selectedDay === 2">
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-[#FFF5F5]">
                    <CheckCircle2 class="w-5 h-5 text-[#DC2B2B]" />
                  </div>
                  <div>
                    <h4 class="font-bold text-gray-800 text-sm">晨会-二次</h4>
                    <p class="text-[11px] font-bold text-[#C0C4CC] mt-0.5">异常</p>
                  </div>
                </div>
                <span class="text-[9px] font-black px-2 py-1 rounded-md bg-[#FEF2F2] text-[#DC2B2B]">异常</span>
              </div>
              <div class="flex gap-2 mt-2">
                <button
                  class="flex-1 bg-[#FFF5F5] text-[#282B3E] font-bold text-sm py-3 rounded-lg border border-[#FFE5E5] transition-all active:scale-95 flex items-center justify-center gap-1"
                  @click="navigateToAppeal"
                >
                  <AlertCircle class="w-4 h-4 text-[#282B3E]" />
                  发起申诉
                </button>
              </div>
            </template>
            <!-- 7月3号：晨会-二次正常状态 -->
            <template v-else-if="selectedDay === 3">
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-[#00A758]">
                    <CheckCircle2 class="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 class="font-bold text-gray-800 text-sm">晨会-二次</h4>
                    <span class="text-[11px] font-black px-2 py-0.5 rounded-md bg-emerald-50 text-[#00A758] mt-0.5 inline-block">10:00 • 正常</span>
                  </div>
                </div>
              </div>
              <div class="space-y-2">
                <div class="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <Clock class="w-3.5 h-3.5 text-gray-400" />
                  <span class="text-[11px] font-bold text-gray-600">打卡时间: 2026-07-03 10:00:00</span>
                </div>
                <div class="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <FileText class="w-3.5 h-3.5 text-gray-400" />
                  <span class="text-[11px] font-bold text-gray-600">操作人: {{ r.operator || "-" }}</span>
                </div>
                <div class="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <ShieldCheck class="w-3.5 h-3.5 text-gray-400" />
                  <span class="text-[11px] font-bold text-gray-600">打卡方式: {{ r.isManualInd === "Y" ? "手工上传" : "人脸打卡" }}</span>
                </div>
              </div>
            </template>
            <!-- 7月10号：晨会-二次正常状态 -->
            <template v-else-if="selectedDay === 10">
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-[#00A758]">
                    <CheckCircle2 class="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 class="font-bold text-gray-800 text-sm">晨会-二次</h4>
                    <p class="text-[11px] font-bold text-gray-400 mt-0.5">10:00 • 正常</p>
                  </div>
                </div>
                <span class="text-[11px] font-black px-2 py-0.5 rounded-md bg-emerald-50 text-[#00A758]">准时</span>
              </div>
              <div class="space-y-2">
                <div class="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <Clock class="w-3.5 h-3.5 text-gray-400" />
                  <span class="text-[11px] font-bold text-gray-600">打卡时间: 2026-07-10 10:00:00</span>
                </div>
                <div class="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <FileText class="w-3.5 h-3.5 text-gray-400" />
                  <span class="text-[11px] font-bold text-gray-600">操作人: {{ r.operator || "-" }}</span>
                </div>
                <div class="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <ShieldCheck class="w-3.5 h-3.5 text-gray-400" />
                  <span class="text-[11px] font-bold text-gray-600">打卡方式: {{ r.isManualInd === "Y" ? "手工上传" : "人脸打卡" }}</span>
                </div>
              </div>
            </template>
            
            <!-- 其他7月日期：准时状态 -->
            <template v-else>
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-[#00A758]">
                    <CheckCircle2 class="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 class="font-bold text-gray-800 text-sm">晨会-二次</h4>
                    <p class="text-[11px] font-bold text-gray-400 mt-0.5">10:10 • 正常</p>
                  </div>
                </div>
                <span class="text-[9px] font-black px-2 py-1 rounded-md bg-emerald-50 text-[#00A758]">准时</span>
              </div>
              <div class="space-y-2">
                <div class="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <Clock class="w-3.5 h-3.5 text-gray-400" />
                  <span class="text-[11px] font-bold text-gray-600">打卡时间: 2026-07-0{{ selectedDay }} 10:10:00</span>
                </div>
                <div class="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <FileText class="w-3.5 h-3.5 text-gray-400" />
                  <span class="text-[11px] font-bold text-gray-600">操作人: {{ r.operator || "-" }}</span>
                </div>
                <div class="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <ShieldCheck class="w-3.5 h-3.5 text-gray-400" />
                  <span class="text-[11px] font-bold text-gray-600">打卡方式: {{ r.isManualInd === "Y" ? "手工上传" : "人脸打卡" }}</span>
                </div>
              </div>
            </template>
          </div>
        </div>

              </div>
    </van-pull-refresh>

    <!-- 豁免卡选择面板 -->
    <van-action-sheet
      safe-area-inset-bottom
      v-model:show="showExemptionSheet"
      title="选择豁免卡"
      class="max-h-[70vh]"
      :z-index="99999"
      teleport="body"
    >
      <div class="p-4 space-y-3">
        <div class="py-10 text-center">
          <p class="text-gray-400 text-sm">暂无可用豁免卡</p>
        </div>
      </div>
    </van-action-sheet>
  </div>
</template>

<style scoped>
.ticket-icon {
  filter: brightness(0) saturate(100%);
}
</style>
