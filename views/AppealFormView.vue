<script setup>
//  异常申诉页
import { computed, onMounted, ref, watch } from "vue";
import { store } from "../store";
import { creatLeave, uploadFileApi, getUuidApi } from "../services/api";
import { useRouter, useRoute } from "vue-router";
import { AlertCircle, Clock, MapPin, FileText, Send, CheckCircle2 } from "lucide-vue-next";
import { formatDate } from "../utils/dateFormat";
import { showToast, PullRefresh } from "vant";
const router = useRouter();
const route = useRoute();
const submitting = ref(false);
const refreshing = ref(false);

const record = computed(() => {
  return (
    store.records.find((r) => r.id === route.query.id) || {
      id: "",
      activityType: "",
      timestamp: "",
      address: "北京分公司",
      content: "",
    }
  );
});
const storedRecord = ref({});
const reason = ref("");
const fileList = ref([]);
const uuid = ref("");
const appealRecord = ref({});
const quickReasons = ["网络定位偏差", "职场设备故障", "陪同客户参加公司要求的体检", "营销员协助公司处理投诉"];
// 监听filelist是否发生变化上传文件
watch(
  () => fileList.value,
  (newValue) => {
    if (newValue.length) {
    }
  },
);
const handleLeaveSubmit = async () => {
  const formattedTimestamp = formatDate(appealRecord.value.timestamp, false);
  const request = {
    agentCode: store.agentCode,
    startTime: formattedTimestamp,
    endTime: formattedTimestamp,
    leaveType: appealRecord.value.atndTyp || "12",
    reason: reason.value,
    leaveId: uuid.value,
    exLeaveId: storedRecord.value.id || "",
  };
  submitting.value = true;
  try {
    const response = await creatLeave(request);
    console.log("response", response);
    if (response.code === 200) {
      showToast("申诉提交成功");
      setTimeout(() => {
        // 传递申诉日期参数
        router.push({
          path: "/history",
          query: {
            ...router.currentRoute.value.query,
          },
        });
      }, 1000);
    } else {
      showToast(response.message);
    }
    window.sensorsH5?.track("AMAClick", {
      page_title: "异常申诉",
      tab_name: "",
      module_name: "异常申诉",
      click_type: "opr_click",
      click_name: "提交申诉申请",
      element_click_value: "submit_appeal",
      agent_code: store.agentCode,
    });
  } catch (error) {
    console.error("Error creating leave:", error);
  } finally {
    submitting.value = false;
  }
  if (fileList.value.length) {
    uploadFile();
  }
};
const uploadFile = async (data) => {
  const formData = new FormData();
  formData.append("agentCode", store.agentCode);
  formData.append("leaveId", uuid.value);
  fileList.value.forEach((f) => {
    formData.append("files", f.file);
  });
  const response = await uploadFileApi(formData);
  if (response.code !== 200) {
    console.error("Error uploading file:", response.message);
  }
  window.sensorsH5?.track("AMAClick", {
    page_title: "异常申诉",
    tab_name: "",
    module_name: "异常申诉",
    click_type: "opr_click",
    click_name: "上传凭证",
    element_click_value: "upload_appeal_file",
    agent_code: store.agentCode,
  });
};

const loadData = () => {
  const recordStr = localStorage.getItem("appealRecord");
  appealRecord.value = recordStr ? JSON.parse(recordStr) : {};
};

const onRefresh = async () => {
  loadData();
  try {
    const response = await getUuidApi();
    uuid.value = response.data;
  } catch (e) {
    console.error("刷新UUID失败:", e);
  }
  refreshing.value = false;
  showToast("刷新成功");
};

onMounted(() => {
  loadData();
  getUuidApi().then((response) => {
    uuid.value = response.data;
  });
});
</script>

<template>
  <van-pull-refresh
    v-model="refreshing"
    success-text="刷新成功"
    @refresh="onRefresh"
  >
    <div class="p-6 pb-24 space-y-6">
      <div
        class="bg-white p-5 rounded-lg shadow-sm border border-gray-100 space-y-4"
      >
        <div class="flex items-center gap-3 pb-4 border-b border-gray-50">
          <div
            class="w-10 h-10 bg-red-50 text-red-500 rounded-lg flex items-center justify-center"
          >
            <AlertCircle class="w-6 h-6" />
          </div>
          <div>
            <p class="text-xs font-black text-gray-400 uppercase">待申诉记录</p>
            <p class="text-base font-bold text-black mt-1">晨会·异常</p>
          </div>
        </div>

        <div class="space-y-3 pt-4">
          <div
            class="flex items-center gap-2 text-[10px] font-bold text-gray-400"
          >
            <Clock class="w-3 h-3" />
            {{
              appealRecord && new Date(appealRecord.timestamp).toLocaleString()
            }}
          </div>
          <div
            class="flex items-center gap-2 text-[10px] font-bold text-gray-400"
          >
            <MapPin class="w-3 h-3" />
            {{ record.address }}
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <label
          class="text-xs font-black text-gray-400 uppercase tracking-widest block mb-4"
        >
          申诉理由
        </label>

        <div class="flex flex-wrap gap-2 mb-4">
          <van-tag
            v-for="r in quickReasons"
            :key="r"
            round
            size="large"
            :plain="reason !== r"
            :type="reason === r ? 'danger' : 'default'"
            color="#ef4444"
            class="px-3 py-1 cursor-pointer"
            @click="reason = r"
          >
            {{ r }}
          </van-tag>
        </div>

        <van-field
          v-model="reason"
          rows="4"
          autosize
          type="textarea"
          placeholder="请详细描述申诉原因，必要时上传凭证..."
          class="bg-gray-50 rounded-lg border border-gray-100 mb-4"
        />

        <label
          class="text-xs font-black text-gray-400 uppercase tracking-widest block mb-4"
          >上传凭证 (可选)</label
        >
        <van-uploader v-model="fileList" multiple />
      </div>

      <div
        class="bg-emerald-50 p-4 rounded-lg border border-emerald-100 flex items-start gap-3"
      >
        <FileText class="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
        <p class="text-[9px] text-emerald-700 font-bold leading-relaxed">
          申诉提交后将通过"消息推送"知会您的直属主管。主管审核通过后，该考勤记录将自动更新为"正常"状态。
        </p>
      </div>

      <van-button
        block
        round
        :loading="submitting"
        type="danger"
        :disabled="!reason"
        class="h-14 font-black text-sm uppercase tracking-widest shadow-lg shadow-red-100"
        @click="handleLeaveSubmit"
      >
        <div class="flex items-center justify-center gap-2">
          <Send class="w-4 h-4" />
          提交申诉申请
        </div>
      </van-button>
    </div>
  </van-pull-refresh>
</template>
