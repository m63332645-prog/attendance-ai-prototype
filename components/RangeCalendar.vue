<script setup>
import { ref, computed } from "vue";
import { ChevronLeft, ChevronRight } from "lucide-vue-next";
import { showToast } from "vant";
const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [null, null],
  },
  leaveRecords: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["update:modelValue", "view-leave", "month-change"]);

const currentMonth = ref(new Date());

const getDaysInMonth = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { firstDay, daysInMonth };
};
// 只能选择当月和下个月
const minMonth = computed(() => {
  const date = new Date();
  date.setDate(1); // 当月1号
  return date;
});

const maxMonth = computed(() => {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  date.setDate(1); // 下个月1号
  return date;
});
const monthDays = computed(() => {
  const { firstDay, daysInMonth } = getDaysInMonth(currentMonth.value);
  const days = [];
  const prevMonthDays = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth(),
    0,
  ).getDate();

  // Adjust week start (Monday as first day)
  const emptyDays = firstDay === 0 ? 6 : firstDay - 1;
  for (let i = emptyDays; i >= 1; i--) {
    days.push({
      type: "prev",
      day: prevMonthDays - i + 1,
      date: null,
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
    });
  }
  return days;
});

const isSelected = (date) => {
  if (!date) return false;
  const [start, end] = props.modelValue;
  if (start && date.toDateString() === start.toDateString()) return true;
  if (end && date.toDateString() === end.toDateString()) return true;
  return false;
};

const isInRange = (date) => {
  if (!date) return false;
  const [start, end] = props.modelValue;
  if (!start || !end) return false;
  const info = getLeaveInfo(date);
  if (info && (info.status === "approved" || info.status === "pending")) {
    return false;
  }
  return date > start && date < end;
};

const formatDateKey = (date) => {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getLeaveInfo = (date) => {
  if (!date || !props.leaveRecords.length) return null;
  const key = formatDateKey(date);
  return props.leaveRecords.find((r) => r.date === key) || null;
};

const getDayClass = (date) => {
  const base =
    "relative w-full h-full flex items-center justify-center rounded-lg transition-all duration-200 text-xs font-bold";
  if (isSelected(date)) return `${base} bg-[#00A758] text-white z-10 shadow-md`;
  if (isInRange(date)) return `${base} bg-[#CAEED9] text-[#00A758]`;
  const info = getLeaveInfo(date);
  if (info?.status === "approved")
    return `${base} bg-[#E8F5E9] text-[#00A758] active:scale-95 active:bg-[#cae9d0]`;
  if (info?.status === "pending")
    return `${base} bg-[#FFF8E1] text-[#F5A623] active:scale-95 active:bg-[#fef0c7]`;
  if (info?.status === "rejected")
    return `${base} bg-[#FEE2E2] text-[#E31B23] active:scale-95 active:bg-[#fecaca]`;
  return `${base} text-gray-700 bg-transparent`;
};

const handleDateClick = (date) => {
  if (!date) return;

  const leaveInfo = getLeaveInfo(date);
  if (
    leaveInfo &&
    (leaveInfo.status === "approved" || leaveInfo.status === "pending")
  ) {
    emit("view-leave", leaveInfo);
    return;
  }

  let [start, end] = props.modelValue;

  if (!start || (start && end)) {
    start = date;
    end = null;
  } else if (date < start) {
    end = start;
    start = date;
  } else if (date.toDateString() === start.toDateString()) {
    if (!end) {
      end = date;
    } else {
      start = null;
      end = null;
    }
  } else {
    end = date;
  }

  emit("update:modelValue", [start, end]);
};

const prevMonth = () => {
  const next = new Date(currentMonth.value);
  next.setMonth(currentMonth.value.getMonth() - 1);

  // 检查是否小于当月（不允许选择上个月及更早）
  if (
    next.getFullYear() < minMonth.value.getFullYear() ||
    (next.getFullYear() === minMonth.value.getFullYear() &&
      next.getMonth() < minMonth.value.getMonth())
  ) {
    showToast("不能选择过去的月份");
    return;
  }

  currentMonth.value = next;
  emit("month-change", next);
};

const nextMonth = () => {
  const next = new Date(currentMonth.value);
  next.setMonth(currentMonth.value.getMonth() + 1);

  // 限制不能超过下个月
  // if (
  //   next.getFullYear() > maxMonth.value.getFullYear() ||
  //   (next.getFullYear() === maxMonth.value.getFullYear() &&
  //     next.getMonth() > maxMonth.value.getMonth())
  // ) {
  //   showToast("只能从当月和下个月开始申请");
  //   return;
  // }

  currentMonth.value = next;
  emit("month-change", next);
};
</script>

<template>
  <div class="range-calendar">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h4 class="text-sm font-black text-gray-800 tracking-tight">
        {{
          currentMonth.toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "long",
          })
        }}
      </h4>
      <div class="flex gap-1">
        <button
          class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
          @click="prevMonth"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>
        <button
          class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
          @click="nextMonth"
        >
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Weekdays -->
    <div class="flex items-center justify-center gap-1 mb-2 justify-around">
      <div class="text-gray-700 text-xs font-medium">一</div>
      <div class="text-gray-700 text-xs font-medium">二</div>
      <div class="text-gray-700 text-xs font-medium">三</div>
      <div class="text-gray-700 text-xs font-medium">四</div>
      <div class="text-gray-700 text-xs font-medium">五</div>
      <div class="text-gray-700 text-xs font-medium">六</div>
      <div class="text-gray-700 text-xs font-medium">日</div>
    </div>
    <!-- Days Grid -->
    <div class="grid grid-cols-7 gap-1">
      <div
        v-for="(d, idx) in monthDays"
        :key="idx"
        class="h-10 flex items-center justify-center relative"
      >
        <div v-if="d.type === 'prev'" class="text-gray-200 text-xs font-medium">
          {{ d.day }}
        </div>
        <button
          v-else
          :class="getDayClass(d.date)"
          @click="handleDateClick(d.date)"
        >
          {{ d.day }}

          <!-- 请假状态标记 -->
          <div
            v-if="getLeaveInfo(d.date)"
            class="absolute bottom-1 w-1.5 h-1.5 rounded-full"
            :class="{
              'bg-[#00A758]': getLeaveInfo(d.date).status === 'approved',
              'bg-[#F5A623]': getLeaveInfo(d.date).status === 'pending',
              'bg-[#E31B23]': getLeaveInfo(d.date).status === 'rejected',
            }"
          />

          <!-- Range background for start/end to make it look continuous -->
          <div
            v-if="
              isSelected(d.date) &&
              modelValue[0] &&
              modelValue[1] &&
              modelValue[0].toDateString() !== modelValue[1].toDateString()
            "
            :class="[
              'absolute inset-y-0 w-1/2 -z-10 bg-[#CAEED9]',
              d.date.toDateString() === modelValue[0].toDateString()
                ? 'right-0'
                : 'left-0',
            ]"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.range-calendar {
  user-select: none;
}
</style>
