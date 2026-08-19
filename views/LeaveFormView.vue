<script setup>
//  请假申请表 http://localhost:3000/#/leave-form
import LeaveApplicationView from "../components/LeaveApplicationView.vue";
import { useRouter } from "vue-router";
import { creatLeave, uploadFileApi, getUuidApi } from "../services/api";
import { showToast } from "vant";
import { onMounted, ref } from "vue";
import { store } from "../store";

const router = useRouter();
const uuid = ref("");
const handleLeaveSubmit = async (request, submitting) => {
  const req = { ...request, leaveId: uuid.value };
  submitting.value = true;
  try {
    const response = await creatLeave(req);
    if (response.code === 200) {
      showToast("请假申请成功");
      setTimeout(() => {
        router.go(-1);
      }, 500);
    } else {
      showToast(response.message);
    }
    window.sensorsH5?.track("AMAClick", {
      page_title: "我要请假",
      tab_name: "",
      module_name: "我要请假",
      click_type: "opr_click",
      click_name: "确认申请",
      element_click_value: "submit_leave",
      agent_code: store.agentCode,
    });
  } catch (error) {
    console.error("Error creating leave:", error);
  } finally {
    submitting.value = false;
  }
};
const uploadFile = async (data) => {
  data.append("leaveId", uuid.value);
  const response = await uploadFileApi(data);
  if (response.code !== 200) {
    console.error("Error uploading file:", response.message);
  }
      window.sensorsH5?.track("AMAClick", {
      page_title: "我要请假",
      tab_name: "",
      module_name: "我要请假",
      click_type: "opr_click",
      click_name: "上传材料",
      element_click_value: "upload_leave_file",
      agent_code: store.agentCode,
    });
};
onMounted(() => {
  getUuidApi().then((response) => {
    uuid.value = response.data;
  });
});
</script>

<template>
  <div>
    <LeaveApplicationView
      @back="router.push('/profile')"
      @submit="handleLeaveSubmit"
      @upload-file="uploadFile"
    />
  </div>
</template>
