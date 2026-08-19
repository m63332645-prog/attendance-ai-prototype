<script setup>
import { ref, computed, onMounted, reactive, watch } from "vue";
import { CalendarDays } from "lucide-vue-next";
import { LeaveType, LeaveRules } from "../constants";
import RangeCalendar from "./RangeCalendar.vue";
import { showToast, showImagePreview, PullRefresh } from "vant";
import { queryClockIn } from "../services/api";

const props = defineProps({
  onBack: {
    type: Function,
    required: true,
  },
});
import { store } from "../store";
const emit = defineEmits(["back", "submit", "uploadFile"]);

const dateRange = ref([null, null]);
const selectedStart = computed(() => dateRange.value[0]);
const selectedEnd = computed(() => dateRange.value[1]);
const leaveType = ref("16");
const miscarriageMonths = ref(3); // For miscarriage logic
const bereavementType = ref("immediate"); // For bereavement logic
const reason = ref("");
const fileList = ref([]);

const currentRule = computed(() => LeaveRules[leaveType.value]);
const submitting = ref(false);

const maxDays = computed(() => {
  if (!leaveType.value) {
    return 999;
  }
  if (leaveType.value === "03") {
    return miscarriageMonths.value >= 4 ? 40 : 20;
  }
  if (leaveType.value === "06") {
    return bereavementType.value === "immediate" ? 7 : 3;
  }

  return currentRule.value ? currentRule.value.maxDays : 999;
});

const leaveDays = computed(() => {
  if (!selectedStart.value) return 0;
  if (!selectedEnd.value) return 1;

  let count = 0;
  const cur = new Date(selectedStart.value);
  const end = new Date(selectedEnd.value);

  while (cur <= end) {
    const dateStr = formatDate(cur);
    const record = calendarLeaveRecords.value.find((r) => r.date === dateStr);
    if (
      record &&
      (record.status === "approved" || record.status === "pending")
    ) {
      cur.setDate(cur.getDate() + 1);
      continue;
    }
    count++;
    cur.setDate(cur.getDate() + 1);
  }

  return count;
});

const isDaysValid = computed(() => {
  if (!selectedStart.value) return true;
  return leaveDays.value <= maxDays.value;
});

const canSubmit = computed(
  () => selectedStart.value && reason.value && isDaysValid.value,
);
import { formatDate } from "../utils/dateFormat";

// 获取当前月和下个月的 YYYY-MM 格式
const getCurrentAndNextMonth = () => {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const nextDate = new Date();
  nextDate.setDate(1); // 先设为1号，避免31日进位到再下个月
  nextDate.setMonth(nextDate.getMonth() + 1);
  const nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;

  return [currentMonth, nextMonth];
};
const startMonth = computed(() => {
  return formatDate(selectedStart.value).substring(0, 7);
});
const handleSubmit = () => {
  const [currentMonth, nextMonth] = getCurrentAndNextMonth();
  if (fileList.value.length === 0) {
    return showToast("请上传证明材料！");
  } else if (fileList.value.length > 3) {
    return showToast("最多上传3张图片");
  }

  if (![currentMonth, nextMonth].includes(startMonth.value)) {
    return showToast("只能从当月和下个月开始申请");
  }
  if (canSubmit.value) {
    emit(
      "submit",
      {
        agentCode: store.agentCode,
        startTime: formatDate(selectedStart.value),
        endTime: formatDate(selectedEnd.value || selectedStart.value),
        leaveType: leaveType.value,
        reason: reason.value,
      },
      ref(submitting),
    );
    if (fileList.value.length > 0) {
      const formData = new FormData();
      formData.append("agentCode", store.agentCode);
      fileList.value.forEach((f) => {
        formData.append("files", f.file);
      });
      emit("uploadFile", formData);
    }
  } else if (!isDaysValid.value) {
    showToast(`${leaveType.value}最多可申请${maxDays.value}天`);
  }
};

// ================== 请假日历标记与详情 ==================
const monthDataMap = reactive({});
const showLeaveDetail = ref(false);
const selectedLeaveDetail = ref(null);

const loadMonthData = async (yearMonth) => {
  if (monthDataMap[yearMonth]) return;
  try {
    const response = await queryClockIn({
      agentCode: store.agentCode,
      date: yearMonth,
    });
    monthDataMap[yearMonth] = response.data || [];
  } catch (e) {
    console.error("加载考勤数据失败:", e);
  }
};

onMounted(() => {
  const [currentMonth, nextMonth] = getCurrentAndNextMonth();
  loadMonthData(currentMonth);
  loadMonthData(nextMonth);
});

const calendarLeaveRecords = computed(() => {
  const records = [];
  Object.values(monthDataMap).forEach((monthData) => {
    if (!Array.isArray(monthData)) return;
    for (const day of monthData) {
      if (day.leaveApplications?.length) {
        if (!LeaveType[day.leaveApplications[0].leaveType]) {
          continue;
        }
        const hasApproved = day.leaveApplications.some(
          (l) => l.currentPro === "WC",
        );
        const hasPending = day.leaveApplications.some(
          (l) => l.currentPro !== "WC" && l.currentPro !== "APPLY",
        );

        let status = "rejected";
        if (hasApproved) status = "approved";
        else if (hasPending) status = "pending";

        records.push({
          date: day.date,
          status,
          applications: day.leaveApplications,
        });
      }
    }
  });
  return records;
});

const handleViewLeave = (leaveInfo) => {
  selectedLeaveDetail.value = leaveInfo;
  showLeaveDetail.value = true;
};

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length >= 3) return `${parts[1]}/${parts[2]}`;
  return dateStr;
};

const getAppPhotos = (app) => {
  return app.imageUrls?.map((item) => item.url) || [];
};

const getStatusLabel = (currentPro) => {
  if (currentPro === "WC") return "已批复";
  if (currentPro === "APPLY") return "已拒绝";
  return "审批中";
};

const getStatusClass = (currentPro) => {
  if (currentPro === "WC") return "bg-emerald-100 text-[#00A758]";
  if (currentPro === "APPLY") return "bg-red-100 text-red-600";
  return "bg-amber-100 text-amber-600";
};

const getCardClass = (currentPro) => {
  if (currentPro === "WC") return "bg-[#F6FDF9] border-[#BBF7D0]";
  if (currentPro === "APPLY") return "bg-[#FFF7F7] border-[#FECACA]";
  return "bg-[#FFFDF5] border-[#FDE68A]";
};

const getIconBgClass = (currentPro) => {
  if (currentPro === "WC") return "bg-[#E8F5E9]";
  if (currentPro === "APPLY") return "bg-[#FEE2E2]";
  return "bg-[#FFF8E1]";
};

const getIconTextClass = (currentPro) => {
  if (currentPro === "WC") return "text-[#00A758]";
  if (currentPro === "APPLY") return "text-[#E31B23]";
  return "text-[#F5A623]";
};
const previewImage = (app, index) => {
  showImagePreview({
    images: getAppPhotos(app),
    startPosition: index,
  });
};
watch(
  dateRange,
  () => {
    if (showLeaveDetail.value) {
      showLeaveDetail.value = false;
    }
  },
  { deep: true },
);
const refreshing = ref(false);

const onRefresh = async () => {
  const [currentMonth, nextMonth] = getCurrentAndNextMonth();
  monthDataMap[currentMonth] = null;
  monthDataMap[nextMonth] = null;
  await Promise.all([loadMonthData(currentMonth), loadMonthData(nextMonth)]);
  refreshing.value = false;
  showToast("刷新成功");
};
</script>

<template>
  <van-pull-refresh
    v-model="refreshing"
    success-text="刷新成功"
    @refresh="onRefresh"
  >
    <div class="p-6 pb-24 space-y-6">
      <!-- 第一步：选择日期范围 -->
      <div class="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
        <div class="flex mb-4 justify-between items-center">
          <h3 class="text-sm font-black text-gray-800">选择休假时段</h3>
        </div>

        <RangeCalendar
          v-model="dateRange"
          :leave-records="calendarLeaveRecords"
          @view-leave="handleViewLeave"
        />
        <div class="TypeMap">
          <div class="text-[10px] font-bold text-gray-500 item-selected">
            本次选中
          </div>
          <div class="text-[10px] ml-2 font-bold text-gray-500 item-approved">
            已批假
          </div>
          <div class="text-[10px] ml-2 font-bold text-gray-500 item-pending">
            在途审核
          </div>
          <div class="text-[10px] ml-2 font-bold text-gray-500 item-rejected">
            已拒绝
          </div>
        </div>
        <div
          v-if="selectedStart"
          class="mt-4 p-3 rounded-lg border flex items-center justify-between"
          :class="
            isDaysValid
              ? 'bg-[#CAEED9] border-[#ACE5C4]'
              : 'bg-red-50 border-red-100'
          "
        >
          <div class="flex items-center gap-2">
            <CalendarDays
              class="w-4 h-4"
              :class="isDaysValid ? 'text-[#00A758]' : 'text-red-500'"
            />
            <div
              class="text-[10px] font-bold"
              :class="isDaysValid ? 'text-[#00A758]' : 'text-red-500'"
            >
              {{ selectedStart.toLocaleDateString("zh-CN") }}
              {{
                selectedEnd &&
                selectedEnd.toDateString() !== selectedStart.toDateString()
                  ? ` 至 ${selectedEnd.toLocaleDateString("zh-CN")}`
                  : ""
              }}
            </div>
          </div>
          <span
            class="text-[10px] font-black px-2 py-0.5 rounded-full text-white"
            :class="isDaysValid ? 'bg-[#00A758]' : 'bg-red-500'"
          >
            共 {{ leaveDays }} 天
          </span>
        </div>
        <p v-if="!isDaysValid" class="mt-2 text-[10px] text-red-500 font-bold">
          * 超出该类型最大申请天数 ({{ maxDays }}天)
        </p>
      </div>

      <!-- 第二步：休假类型与证明 / 请假详情 -->
      <template v-if="!showLeaveDetail">
        <div class="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
          <div class="flex flex-col mb-4">
            <h3 class="text-sm font-black text-gray-800">休假类型与证明</h3>
          </div>

          <div class="flex flex-wrap gap-2 mb-4">
            <van-button
              v-for="t in Object.keys(LeaveType)"
              :key="t"
              round
              size="small"
              :type="leaveType === t ? 'primary' : 'default'"
              :color="leaveType === t ? '#00a758' : ''"
              class="font-black text-[10px] px-4"
              @click="leaveType = t"
            >
              {{ LeaveType[t] }}
            </van-button>
          </div>
          <!-- 动态表单项 -->
          <div class="space-y-4 mb-4">
            <div
              v-if="leaveType === '03'"
              class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
            >
              <span class="text-xs font-bold text-gray-600">怀孕时长 (月)</span>
              <van-stepper v-model="miscarriageMonths" min="1" max="10" />
            </div>

            <div
              v-if="leaveType === '06'"
              class="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100"
            >
              <span class="text-xs font-bold text-gray-600">亲属关系</span>
              <van-radio-group
                v-model="bereavementType"
                direction="horizontal"
                class="mt-1"
              >
                <van-radio
                  name="immediate"
                  icon-size="14px"
                  checked-color="#00a758"
                >
                  <span class="text-[10px] font-bold">父母/配偶/子女</span>
                </van-radio>
                <van-radio
                  name="extended"
                  icon-size="14px"
                  checked-color="#00a758"
                >
                  <span class="text-[10px] font-bold">祖父母/兄弟姐妹</span>
                </van-radio>
              </van-radio-group>
            </div>
          </div>

          <div
            v-if="currentRule"
            class="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-4"
          >
            <p class="text-[10px] text-gray-500 font-bold leading-relaxed">
              <span class="text-[#00A758] uppercase tracking-widest block mb-1">
                规则说明:
              </span>
              {{ currentRule && currentRule.description }}
            </p>
          </div>
          <van-field
            v-model="reason"
            rows="3"
            autosize
            type="textarea"
            placeholder="请输入详细申请说明"
            class="bg-gray-50 rounded-lg border border-gray-100 mb-4"
          />
          <div class="space-y-2">
            <p
              class="text-[10px] font-black text-gray-400 uppercase tracking-widest"
            >
              证明材料上传 (最多3张)
            </p>
            <van-uploader
              accept="image/*"
              v-model="fileList"
              multiple
              class="bg-gray-50 p-3 rounded-lg border border-gray-100 w-full"
            />
          </div>
        </div>

        <van-button
          block
          round
          :loading="submitting"
          type="primary"
          color="#00a758"
          :disabled="!canSubmit"
          class="h-14 font-black text-sm uppercase tracking-widest shadow-lg"
          @click="handleSubmit"
        >
          确认申请
        </van-button>
      </template>

      <template v-else>
        <div
          class="bg-white p-5 rounded-lg shadow-sm border border-gray-100 space-y-4"
        >
          <h3 class="text-sm font-black text-gray-800">
            {{
              selectedLeaveDetail?.date
                ? new Date(
                    selectedLeaveDetail.date.replace(/-/g, "/"),
                  ).toLocaleDateString("zh-CN", {
                    month: "long",
                    day: "numeric",
                  }) + " 明细"
                : "请假详情"
            }}
          </h3>

          <div
            v-for="app in selectedLeaveDetail?.applications"
            :key="app.leaveId"
            class="p-4 rounded-xl border space-y-4"
            :class="getCardClass(app.currentPro)"
          >
            <!-- 头部 -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div
                  style="box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.15)"
                  class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  :class="[getIconBgClass(app.currentPro)]"
                >
                  <CalendarDays
                    class="w-6 h-6"
                    :class="getIconTextClass(app.currentPro)"
                  />
                </div>
                <div>
                  <div class="text-sm font-black text-gray-800">
                    请假申请：{{ LeaveType[app.leaveType] || "未知类型" }}
                  </div>
                  <div class="text-[10px] text-gray-500 font-bold mt-0.5">
                    申请人：{{ app.agentName || store.agentName || "-" }}
                  </div>
                </div>
              </div>
              <span
                class="text-[10px] font-black px-2 py-1 rounded-full shrink-0"
                :class="getStatusClass(app.currentPro)"
              >
                {{ getStatusLabel(app.currentPro) }}
              </span>
            </div>

            <!-- 时间与缘由 -->
            <div
              class="bg-white p-4 rounded-lg border space-y-2 border-gray-100"
            >
              <!-- :class="getReasonBoxClass(app.currentPro)" -->
              <div
                class="text-[10px] font-bold text-gray-400 uppercase tracking-widest"
              >
                请假时间与缘由
              </div>
              <div class="text-sm font-black text-gray-800">
                {{
                  app.startTime
                    ? formatDisplayDate(app.startTime)
                    : selectedLeaveDetail?.date?.slice(5).replace("-", "/")
                }}
                {{
                  app.endTime && app.endTime !== app.startTime
                    ? " 至 " + formatDisplayDate(app.endTime)
                    : ""
                }}
              </div>
              <div
                v-if="app.reason"
                class="text-xs font-bold text-gray-600 italic leading-relaxed"
              >
                "{{ app.reason }}"
              </div>
              <div
                v-if="app.rejectReasonNew"
                class="text-xs font-bold text-red-500 leading-relaxed"
              >
                驳回原因：{{ app.rejectReasonNew }}
              </div>
            </div>

            <!-- 凭证 -->
            <div v-if="getAppPhotos(app).length">
              <div
                class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2"
              >
                相关凭证
              </div>
              <div class="flex gap-2 overflow-x-auto pb-1">
                <img
                  v-for="(img, idx) in getAppPhotos(app)"
                  :key="idx"
                  :src="img"
                  class="w-20 h-20 rounded-lg object-cover border border-gray-100 shrink-0"
                  @click="previewImage(app)"
                />
              </div>
            </div>
          </div>

          <div
            v-if="!selectedLeaveDetail?.applications?.length"
            class="py-8 text-center text-gray-400 text-sm"
          >
            暂无请假详情
          </div>
        </div>
      </template>
    </div>
  </van-pull-refresh>
</template>
<style scoped>
.TypeMap {
  display: flex;
  align-items: center;
  margin-top: 4px;
}
.TypeMap > div {
  display: flex;
  align-items: center;
}
.TypeMap > div::before {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 5px;
  margin-top: 2px;
}
.TypeMap > div.item-selected::before {
  background: #cae9d8;
}
.TypeMap > div.item-approved::before {
  background: #00a758;
}
.TypeMap > div.item-pending::before {
  background: #f5a623;
}
.TypeMap > div.item-rejected::before {
  background: #e31b23;
}
</style>
