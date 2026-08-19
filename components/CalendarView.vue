<script setup>
import { ref, computed } from "vue";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Info,
} from "lucide-vue-next";
import {
  AttendanceStatus,
  IsLeaveStatus,
  IsNormalAttendance,
} from "../constants";
import { store } from "../store";
/**
 * 将 Date 对象格式化为 YYYY-MM-DD 格式的本地日期字符串
 * @param {Date} date - 日期对象
 * @returns {string} 格式化后的日期字符串
 */
const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const props = defineProps({
  leaveRequests: {
    type: Array,
    required: true,
  },
  selectedDate: {
    type: Date,
    required: true,
  },
});

const emit = defineEmits(["dateSelect", "monthChange"]);

const viewMode = ref("month");
const currentMonth = ref(new Date(props.selectedDate));

const getDaysInMonth = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { firstDay, daysInMonth };
};

const getStatusForDate = (date) => {
  const dateMidnight = new Date(date).setHours(0, 0, 0, 0);

  // 1. 请假优先判定
  const isLeave = props.leaveRequests.some(
    (l) =>
      l.status === "APPROVED" &&
      new Date(l.startDate).setHours(0, 0, 0, 0) <= dateMidnight &&
      new Date(l.endDate).setHours(23, 59, 59, 999) >= dateMidnight,
  );
  if (isLeave) return AttendanceStatus.LEAVE;

  // 2. 从 store.currentTimeArr 中查找当天数据
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const localDateStr = `${year}-${month}-${day}`;

  const dayData = store.currentTimeArr.find(
    (item) => item.date === localDateStr,
  );

  // 3. 无记录判定
  if (!dayData || !dayData.agyLaAtnds || dayData.agyLaAtnds.length === 0) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    if (compareDate < now) return AttendanceStatus.EXPIRED;
    if (compareDate >= now) return AttendanceStatus.UPCOMING;
    return null;
  }

  // 4. 根据 agyLaAtnds 中的 state 判断状态
  // state: Y=正常, L=迟到, Q=请假, null=缺勤
  const hasAbnormal = dayData.agyLaAtnds.some((r) => r.state === null || r.state === "I");
  const hasLate = dayData.agyLaAtnds.some((r) => r.state === "L");
  const hasLeave = dayData.agyLaAtnds.some((r) => r.state === "Q");
  const hasNormal = dayData.agyLaAtnds.some((r) => r.state === "Y");

  if (hasAbnormal) return AttendanceStatus.ABNORMAL;
  if (hasLate) return AttendanceStatus.LATE;
  if (hasLeave) return AttendanceStatus.LEAVE;
  if (hasNormal) return AttendanceStatus.NORMAL;

  return AttendanceStatus.NORMAL;
};
const monthDays = computed(() => {
  const { firstDay, daysInMonth } = getDaysInMonth(currentMonth.value);
  const days = [];
  const prevMonthDays = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth(),
    0,
  ).getDate();

  // 调整周起始（周一为第一天）
  const emptyDays = firstDay === 0 ? 6 : firstDay - 1;
  for (let i = emptyDays; i >= 1; i--) {
    const date = new Date(
      currentMonth.value.getFullYear(),
      currentMonth.value.getMonth() - 1,
      prevMonthDays - i + 1,
    );
    days.push({
      type: "prev",
      day: prevMonthDays - i + 1,
      date: date,
      status: getStatusForDate(date),
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(
      currentMonth.value.getFullYear(),
      currentMonth.value.getMonth(),
      d,
    );
    days.push({
      type: "current",
      day: d,
      date: date,
      isSelected: date.toDateString() === props.selectedDate.toDateString(),
      status: getStatusForDate(date),
    });
  }

  // 动态填充下月日期：只补满当前周，避免最后一行全是下月日期
  const remainingDays = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(
      currentMonth.value.getFullYear(),
      currentMonth.value.getMonth() + 1,
      i,
    );
    days.push({
      type: "next",
      day: i,
      date: date,
      status: getStatusForDate(date),
    });
  }

  return days;
});

const weekDays = computed(() => {
  const days = [];
  const startOfWeek = new Date(props.selectedDate);
  const day = props.selectedDate.getDay();
  const diff = props.selectedDate.getDate() - (day === 0 ? 6 : day - 1);
  startOfWeek.setDate(diff);

  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    days.push({
      dayName: ["一", "二", "三", "四", "五", "六", "日"][i],
      day: date.getDate(),
      date: date,
      isSelected: date.toDateString() === props.selectedDate.toDateString(),
      status: getStatusForDate(date),
    });
  }
  return days;
});

/**
 * 根据考勤状态获取对应的指示点颜色类名
 * @param {string} status - 考勤状态 (AttendanceStatus)
 * @returns {string} Tailwind CSS 背景色类名
 */
const getDotColor = (date) => {
  return getStatus(date);
};
// 硬编码日历圆点颜色逻辑，不依赖API
// 6月：准时1-21号 → 绿色，异常22-30号 → 红色（排除周日）
// 7月：准时1/2/3号 → 绿色，异常6号 → 红色，其余工作日 → 待打卡（黄色）（排除周日）
// 周日：不显示圆点
const getStatus = (date) => {
  const d = new Date(date.date);
  const dayOfWeek = d.getDay(); // 0=周日, 6=周六
  const month = d.getMonth() + 1; // 1-12
  const day = d.getDate();

  // 周日不显示圆点
  if (dayOfWeek === 0) return "";

  // 7月周六不显示圆点（不显示周末打卡情况）
  if (month === 7 && dayOfWeek === 6) return "";

  // === 6月数据 ===
  if (month === 6) {
    // 6月1号-6月21号 → 准时（绿色）
    if (day >= 1 && day <= 21) {
      return "bg-emerald-500";
    }
    // 6月22号-6月30号 → 异常（红色）
    if (day >= 22 && day <= 30) {
      return "bg-red-500";
    }
    return "";
  }

  // === 7月数据 ===
  if (month === 7) {
    // 7月1号 → 准时（绿色）
    if (day === 1) {
      return "bg-emerald-500";
    }
    // 7月2号 → 准时（绿色）
    if (day === 2) {
      return "bg-emerald-500";
    }
    // 7月3号 → 迟到（橙色）
    if (day === 3) {
      return "bg-[#F49600]";
    }
    // 7月13号 → 迟到（橙色）
    if (day === 13) {
      return "bg-[#F49600]";
    }
    // 7月14号 → 迟到（橙色）
    if (day === 14) {
      return "bg-[#F49600]";
    }
    // 7月7号 → 请假（青色）
    if (day === 7) {
      return "bg-teal-500";
    }
    // 7月8号 → 待审核（紫色）
    if (day === 8) {
      return "bg-[#361558]";
    }
    // 7月9号 → 待审核（紫色）
    if (day === 9) {
      return "bg-[#361558]";
    }
    // 7月10号 → 待审核（紫色）
    if (day === 10) {
      return "bg-[#361558]";
    }
    // 7月4号、5号、6号、11号-12号、15号-31号 → 待打卡（黄色）
    if ((day >= 4 && day <= 6) || (day >= 11 && day <= 12) || (day >= 15 && day <= 31)) {
      return "bg-amber-400";
    }
    return "";
  }

  return "";
};

const prev = () => {
  if (viewMode.value === "month") {
    const next = new Date(currentMonth.value);
    next.setMonth(currentMonth.value.getMonth() - 1);
    currentMonth.value = next;
    // 触发月份变化事件，传递格式化的年月字符串
    const year = next.getFullYear();
    const month = String(next.getMonth() + 1).padStart(2, "0");
    emit("monthChange", `${year}-${month}`);
  } else {
    const next = new Date(props.selectedDate);
    next.setDate(props.selectedDate.getDate() - 7);
    emit("dateSelect", next);
    // 如果跨月了，同步更新 currentMonth 并触发事件
    if (next.getMonth() !== currentMonth.value.getMonth()) {
      currentMonth.value = new Date(next);
      const year = next.getFullYear();
      const month = String(next.getMonth() + 1).padStart(2, "0");
      emit("monthChange", `${year}-${month}`);
    }
  }
  window.sensorsH5?.track("AMAClick", {
    page_title: "出席管理",
    tab_name: "打卡功能区",
    module_name: "日历",
    click_type: "filter_click",
    click_name: "切换月份",
    element_click_value: "month_filter",
    agent_code: store.agentCode,
  });
};

const next = () => {
  if (viewMode.value === "month") {
    const next = new Date(currentMonth.value);
    next.setMonth(currentMonth.value.getMonth() + 1);
    currentMonth.value = next;
    // 触发月份变化事件，传递格式化的年月字符串
    const year = next.getFullYear();
    const month = String(next.getMonth() + 1).padStart(2, "0");
    emit("monthChange", `${year}-${month}`);
  } else {
    const next = new Date(props.selectedDate);
    next.setDate(props.selectedDate.getDate() + 7);
    emit("dateSelect", next);
    // 如果跨月了，同步更新 currentMonth 并触发事件
    if (next.getMonth() !== currentMonth.value.getMonth()) {
      currentMonth.value = new Date(next);
      const year = next.getFullYear();
      const month = String(next.getMonth() + 1).padStart(2, "0");
      emit("monthChange", `${year}-${month}`);
    }
  }
  window.sensorsH5?.track("AMAClick", {
    page_title: "出席管理",
    tab_name: "明细",
    module_name: "日历",
    click_type: "filter_click",
    click_name: "切换月份",
    element_click_value: "month_filter",
    agent_code: store.agentCode,
  });
};
// ... existing code ...

const handleDateSelect = (date) => {
  if (date.getMonth() !== currentMonth.value.getMonth()) {
    currentMonth.value = new Date(date);
    // 如果跨月了，触发月份变化事件
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    emit("monthChange", `${year}-${month}`);
  }
  emit("dateSelect", date);
  window.sensorsH5?.track("AMAClick", {
    page_title: "出席管理",
    tab_name: "明细",
    module_name: "考勤明细",
    click_type: "filter_click",
    click_name: "考勤明细",
    element_click_value: "record_detail",
    agent_code: store.agentCode,
  });
};
const goToday = () => {
  const today = new Date();

  // 判断是否需要切换月份
  const needChangeMonth =
    today.getFullYear() !== currentMonth.value.getFullYear() ||
    today.getMonth() !== currentMonth.value.getMonth();

  // 更新当前月份为今天
  currentMonth.value = today;

  // 触发日期选择事件，更新父组件的 selectedDate
  emit("dateSelect", today);

  // 只有在月份发生变化时，才触发月份变化事件
  if (needChangeMonth) {
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    emit("monthChange", `${year}-${month}`);
  }
  window.sensorsH5?.track("AMAClick", {
    page_title: "出席管理",
    tab_name: "打卡功能区",
    module_name: "日历",
    click_type: "filter_click",
    click_name: "回到今天",
    element_click_value: "goToday",
    agent_code: store.agentCode,
  });
};
</script>

<template>
  <div class="bg-white p-5 rounded-lg shadow-sm border border-gray-100 mb-6">
    <!-- 顶部控制栏 -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex flex-col">
        <span
          class="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1"
          >Attendance Calendar</span
        >
        <h3
          class="text-xl font-black text-gray-800 tracking-tight leading-none"
        >
          {{
            currentMonth.toLocaleDateString("zh-CN", {
              year: "numeric",
              month: "long",
            })
          }}
        </h3>
      </div>
      <div
        class="flex items-center bg-gray-100/80 rounded-lg p-1 border border-gray-100"
      >
        <van-button
          size="small"
          round
          :plain="viewMode !== 'month'"
          :type="viewMode === 'month' ? 'primary' : 'default'"
          color="#00a758"
          class="px-4 h-8 font-black text-xs border-none"
          @click="viewMode = 'month'"
        >
          月
        </van-button>
        <van-button
          size="small"
          round
          :plain="viewMode !== 'week'"
          :type="viewMode === 'week' ? 'primary' : 'default'"
          color="#00a758"
          class="px-4 h-8 font-black text-xs border-none"
          @click="viewMode = 'week'"
        >
          周
        </van-button>
      </div>
    </div>

    <!-- 星期标题 -->
    <div class="grid grid-cols-7 gap-1 text-center mb-3">
      <div
        v-for="d in ['一', '二', '三', '四', '五', '六', '日']"
        :key="d"
        class="text-[10px] font-black text-gray-300 uppercase"
      >
        {{ d }}
      </div>
    </div>

    <!-- 内容区域 -->
    <div
      :class="[
        'transition-all duration-500 ease-in-out',
        viewMode === 'month'
          ? 'grid grid-cols-7 gap-1'
          : 'flex justify-between gap-1',
      ]"
    >
      <template v-if="viewMode === 'month'">
        <div
          v-for="(d, idx) in monthDays"
          :key="idx"
          class="h-10 flex items-center justify-center"
        >
          <button
            :class="[
              'relative w-full h-full flex flex-col items-center justify-center rounded-lg transition-all duration-300',
              d.isSelected
                ? 'bg-[#00A758] text-white shadow-lg shadow-emerald-100 scale-105 z-10'
                : d.type === 'current'
                  ? 'text-gray-700 bg-transparent'
                  : 'text-gray-300 bg-transparent',
            ]"
            @click="handleDateSelect(d.date)"
          >
            <span
              :class="[
                'text-sm font-bold',
                d.isSelected
                  ? 'text-white'
                  : d.type === 'current'
                    ? 'text-gray-700'
                    : 'text-gray-300',
              ]"
              >{{ d.day }}</span
            >
            <div
              v-if="getDotColor(d)"
              :class="[
                'mt-1 w-1.5 h-1.5 rounded-full ring-2',
                d.isSelected
                  ? 'bg-white ring-emerald-600'
                  : `${getDotColor(d)} ring-transparent`,
              ]"
            />
          </button>
        </div>
      </template>
      <template v-else>
        <button
          v-for="(d, i) in weekDays"
          :key="i"
          :class="[
            'flex-1 flex flex-col items-center py-4 rounded-lg transition-all duration-300',
            d.isSelected
              ? 'bg-[#00A758] text-white shadow-xl scale-105 z-10'
              : 'border border-transparent',
          ]"
          @click="handleDateSelect(d.date)"
        >
          <span class="text-base font-black tracking-tighter">{{ d.day }}</span>
          <div
            v-if="getDotColor(d)"
            :class="[
              'mt-2 w-2 h-2 rounded-full border-2',
              d.isSelected
                ? 'bg-white border-emerald-600'
                : getDotColor(d) + ' border-white',
            ]"
            class="shadow-sm"
          />
        </button>
      </template>
    </div>

    <!-- 底部导航 -->
    <div
      class="mt-3 flex items-center justify-between border-t border-gray-50 pt-3"
    >
      <div class="flex gap-2">
        <button
          class="p-2.5 bg-gray-50 rounded-lg text-gray-400 transition-colors border-none"
          @click="prev"
        >
          <ChevronLeft class="w-5 h-5" />
        </button>
        <button
          class="p-2.5 bg-gray-50 rounded-lg text-gray-400 transition-colors border-none"
          @click="next"
        >
          <ChevronRight class="w-5 h-5" />
        </button>
      </div>
      <van-button
        round
        size="small"
        type="primary"
        plain
        color="#00a758"
        class="flex items-center gap-2 bg-emerald-50 text-emerald-700 font-black text-[10px] px-4 py-2.5 rounded-lg uppercase tracking-widest border border-emerald-100 hover:bg-emerald-100 transition-all active:scale-95 h-auto"
        @click="goToday"
      >
        <div class="flex items-center gap-2">
          <CalendarIcon class="w-3.5 h-3.5" />
          <span>回到今天</span>
        </div>
      </van-button>
    </div>

    <!-- 状态图例快速预览 -->
    <div class="mt-4">
      <div class="flex flex-col gap-2 px-2 py-2 bg-gray-50/50 rounded-lg border border-gray-50">
        <!-- 提示话术 -->
        <div class="flex items-center gap-1.5">
          <Info class="w-3 h-3 text-gray-300" />
          <span class="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">晨会首次出席打卡状态</span>
        </div>
        <!-- 指示灯 -->
        <div class="flex overflow-x-auto no-scrollbar">
          <div
            v-for="l in [
              { c: 'bg-emerald-500', t: '准时' },
              { c: 'bg-amber-500', t: '迟到' },
              { c: 'bg-red-500', t: '异常' },
              { c: 'bg-amber-400', t: '待打卡' },
              { c: 'bg-teal-500', t: '请假' },
              { c: 'bg-[#361558]', t: '待审核' },
            ]"
            :key="l.t"
            class="flex items-center shrink-0"
            style="margin-left: 6px"
          >
            <div :class="['w-1.5 h-1.5 rounded-full', l.c]" />
            <span
              style="margin-left: 6px"
              class="text-[10px] font-bold text-gray-400 uppercase tracking-tighter"
              >{{ l.t }}</span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
