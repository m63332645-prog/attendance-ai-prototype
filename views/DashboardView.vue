<script setup>
//  首页
import { computed, onMounted, ref } from "vue";
import { store } from "../store";
import { BarChart3, ShieldCheck, FileText } from "lucide-vue-next";
import AttendanceButton from "../components/AttendanceButton.vue";
import { showToast } from "vant";
import { MOCK_WORKPLACES } from "../constants";
import router from "../router";

const todayRecord = computed(() => {
  console.log("Today Records:", store.records);
  if (store.records.length === 0) return null;
  // Find the first record of today that is NOT abnormal, or the latest abnormal one if no successful one exists
  const today = store.currentTime.toDateString();
  const todayRecords = store.records.filter(
    (r) => new Date(r.timestamp).toDateString() === today,
  );
  console.log("Today Records:", todayRecords);
  if (todayRecords.length === 0) return null;

  const successfulRecord = todayRecords.find((r) => r.status !== "ABNORMAL");
  console.log("Successful Record:", successfulRecord);

  return successfulRecord || todayRecords[0];
});
const isLoading = ref(false);

const handleCheck = (type, activityType, method, data) => {
  store.handleCheck(type, activityType, method, data);
};

/**
 * 下拉刷新处理
 */
const onRefresh = async () => {
  try {
    isLoading.value = true;
    await store.loadUserConfig();
    await store.getExemptionCard();
  } catch (error) {
    console.error("刷新失败:", error);
  } finally {
    isLoading.value = false;
  }
};
// 处理跳转
const handleNavigate = (path) => {
  router.push({
    path,
    query: {
      ...router.currentRoute.value.query,
      appeal: path === "/history" ? true : undefined,
    },
  });
  window.sensorsH5?.track("AMAClick", {
    page_title: "首页",
    tab_name: "首页",
    module_name: "功能跳转",
    click_type: "link_click",
    click_name: path === "/history" ? "申诉中心" : "在线请假",
    element_click_value:
      path === "/history" ? "appeal_entry" : "leave_application",
    agent_code: store.agentCode,
  });
};
onMounted(() => {});
</script>

<template>
  <van-pull-refresh
    v-model="isLoading"
    @refresh="onRefresh"
    style="min-height: 80vh; overflow: auto"
  >
    <div class="px-4">
      <!-- 主功能区，上面可忽略 -->
      <AttendanceButton
        :last-action="store.records.length > 0 ? store.records[0].type : null"
        :today-record="todayRecord"
        :workplaces="MOCK_WORKPLACES"
        :mock-location="store.mockWorkplace"
        :demo-time="store.currentTime"
        :detected-workplace="store.detectedWorkplace"
        :is-scanning="store.isScanning"
        @check="handleCheck"
      />
    </div>

    <div class="px-4 flex justify-between mt-4">
      <van-button
        block
        round
        class="h-auto py-4 shadow-sm border-gray-100"
        @click="handleNavigate('/leave-form')"
      >
        <div class="flex items-center">
          <div class="p-1.5 rounded-lg bg-emerald-50 text-emerald-500">
            <ShieldCheck v-if="store.isSupervisorMode" class="w-4 h-4" />
            <FileText v-else class="w-4 h-4" />
          </div>
          <span
            class="font-bold text-gray-700 text-xs"
            style="margin-left: 10px"
          >
            在线请假
          </span>
        </div>
      </van-button>
      <van-button
        style="margin-left: 10px"
        block
        round
        class="h-auto py-4 shadow-sm border-gray-100"
        @click="handleNavigate('/history')"
      >
        <div class="flex items-center">
          <div class="p-1.5 bg-amber-50 text-amber-500 rounded-lg">
            <ShieldCheck class="w-4 h-4" />
          </div>
          <span
            class="font-bold text-gray-700 text-xs"
            style="margin-left: 10px"
          >
            申诉中心
          </span>
        </div>
      </van-button>
    </div>
  </van-pull-refresh>
</template>
