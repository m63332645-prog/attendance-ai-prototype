<script setup>
import { onMounted, onUnmounted, computed, ref, watch, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { store } from "./store";
import { useSmartRouter } from "./utils/Composable";
import { formatDate } from "./utils/dateFormat";
import {
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from "lucide-vue-next";
import { throttle } from "./utils/throttle";
import ticket from "./assets/image/ticket.png";
const route = useRoute();
const router = useRouter();
const { push, back } = useSmartRouter();

// 获取主内容区域的引用
const mainContentRef = ref(null);

onMounted(() => {
  store.init();

  // iOS 键盘兼容处理
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) {
    let originalViewportHeight = window.innerHeight;

    // 监听视口大小变化（键盘弹出会导致视口缩小）
    window.addEventListener("resize", () => {
      const currentHeight = window.innerHeight;
      if (currentHeight < originalViewportHeight - 100) {
        // 键盘弹出
        document.body.classList.add("keyboard-open");
      } else {
        // 键盘收起
        document.body.classList.remove("keyboard-open");
        setTimeout(() => {
          window.scrollTo(0, 0);
        }, 50);
      }
    });
  }
});

onUnmounted(() => {
  // 清理事件监听
});

// 监听路由变化，滚动到顶部
watch(
  () => route.name,
  async (newRouteName, oldRouteName) => {
    // 只在路由名称变化时滚动（避免同一路由参数变化时重复滚动）
    if (newRouteName !== oldRouteName) {
      await nextTick();
      scrollToTop();
    }
  },
);

// 滚动到顶部的方法
const scrollToTop = () => {
  if (mainContentRef.value) {
    mainContentRef.value.scrollTo({
      top: 0,
      behavior: "smooth", // 平滑滚动
    });
  } else {
    // 备用方案：滚动 window
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }
};

const viewTitle = computed(() => {
  switch (route.name) {
    case "dashboard":
      return store.isSupervisorMode ? "管理看板" : "";
    case "history":
      return store.isSupervisorMode ? "团队考勤明细" : "出席管理";
    case "profile":
      return "个人中心";
    case "supervisor_inbox":
      return "审批中心";
    case "appeal_form":
      return "异常申诉";
    case "leave_form":
      return "出席管理";
    case "attendance_tips":
      return "打卡小贴士";
    case "prototype":
      return "交互原型图";
    default:
      return "中宏人寿";
  }
});

const showBackButton = computed(() => {
  return [
    "supervisor_inbox",
    "appeal_form",
    "dashboard",
    "leave_form",
    "attendance_tips",
    "prototype",
  ].includes(route.name);
});

const goBack = () => {
  if (route.name === "dashboard") {
    if (window.CordovaBridge && window.CordovaBridge.jsCallCordovaPlugin) {
      window.CordovaBridge.jsCallCordovaPlugin("browser", "close");
    }
  } else if (route.name === "history") {
    router.replace({
      path: "/",
      query: { token: store.token, agentCode: store.agentCode },
    });
  } else {
    back();
  }
};

const showExemptionPack = computed({
  get: () => store.showExemptionPack,
  set: (val) => (store.showExemptionPack = val),
});

const showSelectRecordForExemption = computed({
  get: () => store.showSelectRecordForExemption,
  set: (val) => (store.showSelectRecordForExemption = val),
});

const activeTab = ref(route.name || "dashboard");

watch(
  () => activeTab.value,
  (name) => {
    const token = router.currentRoute.value.query.token;
    const agentCode = router.currentRoute.value.query.agentCode;
    if (name === "dashboard") {
      router.replace({ name, query: { token, agentCode } });
    } else {
      router.replace({ name, query: router.currentRoute.value.query });
    }
  },
);

watch(
  () => router.currentRoute.value.name,
  (name) => {
    if (["dashboard", "history"].includes(name)) {
      activeTab.value = name;
    }
  },
);
const handleNavigate = (name) => {
  if (name === "dashboard") {
    window.sensorsH5?.track("AMAClick", {
      page_title: "首页",
      tab_name: "首页",
      module_name: "底部导航",
      click_type: "tab_click",
      click_name: "首页",
      element_click_value: "nav_home",
      agent_code: store.agentCode,

    });
  } else {
    window.sensorsH5?.track("AMAClick", {
      page_title: "首页",
      tab_name: "明细",
      module_name: "底部导航",
      click_type: "tab_click",
      click_name: "明细",
      element_click_value: "nav_history",
      agent_code: store.agentCode,
    });
  }
};
const useExemptionCard = throttle((exemptionId, date) => {
  const data = {
    agentCode: store.agentCode,
    startTime: formatDate(date, false),
    endTime: formatDate(date, false),
    leaveType: "14",
    reason: "星钻豁免",
    exemptionId,
  };
  store.useExemptionCard(data);
  window.sensorsH5?.track("AMAClick", {
    page_title: "首页",
    tab_name: "首页",
    module_name: "豁免卡包",
    click_type: "opr_click",
    click_name: "申请豁免",
    element_click_value: "apply_exemption",
    agent_code: store.agentCode,
  });
}, 5000);
const actionExemptionPack = () => {
  showExemptionPack.value = true;
  window.sensorsH5?.track("AMAClick", {
    page_title: "首页",
    tab_name: "首页",
    module_name: "豁免卡包",
    click_type: "filter_click",
    click_name: "豁免卡列表",
    element_click_value: "card_list",
    agent_code: store.agentCode,
  });
  store.queryClockIn();
};
</script>

<template>
  <div
    class="app-container flex flex-col h-screen overflow-hidden overscroll-none"
  >
    <!-- Top Header Area (Vant NavBar) - 固定吸顶，兼容刘海屏 -->
    <van-nav-bar
      class="flex-shrink-0 z-50 sticky top-0 overscroll-none"
      :style="{ paddingTop: 'env(safe-area-inset-top)' }"
      :title="viewTitle"
      left-arrow
      @click-left="goBack"
    >
      <template
        v-if="!store.isSupervisorMode && route.name === 'dashboard'"
        #right
      >
        <div class="relative cursor-pointer" @click="actionExemptionPack">
          <img :src="ticket" class="w-5 h-5 text-emerald-600" />
          <div
            v-if="store.exemptionCards.length > 0"
            class="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-bold px-1 rounded-full min-w-[14px] h-[14px] flex items-center justify-center border border-white"
          >
            {{ store.exemptionCards.length }}
          </div>
        </div>
      </template>
    </van-nav-bar>
    <div
      v-if="route.name === 'dashboard'"
      style="margin-bottom:10px"
      :class="[
        'p-5 rounded-b-lg text-white shadow-lg transition-all duration-700',
        store.isSupervisorMode
          ? 'bg-gradient-to-r from-slate-800 to-emerald-900'
          : 'bg-gradient-to-r from-emerald-600 to-teal-700',
      ]"
    >
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-lg font-bold">你好, 王枫枭</h1>
        </div>
      </div>
    </div>
    <!-- Middle Content Area (Auto) - 可滚动区域 -->
    <main
      ref="mainContentRef"
      class="flex-1 overflow-y-auto no-scrollbar scroll-smooth overscroll-contain"
    >
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Bottom Action Area (Vant Tabbar) - 固定在底部 -->
    <van-tabbar
      v-if="
        route.name !== 'prototype' &&
        ['dashboard', 'history', 'supervisor_inbox', 'profile', 'checkin_success'].includes(
          route.name,
        )
      "
      v-model="activeTab"
      active-color="#00a758"
      inactive-color="#9ca3af"
      class="flex-shrink-0 overscroll-none"
      safe-area-inset-bottom
    >
      <van-tabbar-item
        name="dashboard"
        icon="home-o"
        @click="handleNavigate('dashboard')"
      >
        首页
      </van-tabbar-item>
      <van-tabbar-item
        name="history"
        icon="notes-o"
        @click="handleNavigate('history')"
      >
        明细
      </van-tabbar-item>
    </van-tabbar>

    <!-- Exemption Pack Popup -->
    <van-popup
      v-model:show="showExemptionPack"
      position="bottom"
      round
      class="max-h-[70vh]"
    >
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2">
            <img :src="ticket" class="w-5 h-5 text-emerald-600" />
            豁免卡包
          </h3>
          <span class="text-xs text-gray-400 font-bold"
            >可用: {{ store.exemptionCards.length }}</span
          >
        </div>

        <div v-if="store.exemptionCards.length === 0" class="py-12 text-center">
          <img :src="ticket" class="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p class="text-sm text-gray-400 font-bold">暂无可用豁免卡</p>
        </div>

        <div v-else class="space-y-3" style="max-height: 30vh; overflow: auto">
          <div
            v-for="card in store.exemptionCards"
            :key="card.id"
            class="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 rounded-xl text-white shadow-md relative overflow-hidden group"
          >
            <div
              class="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform"
            >
              <img :src="ticket" class="w-20 h-20" />
            </div>
            <div class="flex justify-between items-start relative">
              <div>
                <p class="text-lg font-black tracking-widest uppercase">
                  考勤豁免卡
                </p>
                <div class="flex items-center gap-2 mt-0.5">
                  <span
                    class="text-[9px] bg-white/20 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter"
                    >可豁免
                    {{ card.exemptionDays - card.hasExemptionedDays }} 天</span
                  >
                  <p class="text-[10px] font-bold opacity-80">
                    有效期至:
                    {{ new Date(card.expireDate).toLocaleDateString() }}
                  </p>
                </div>
              </div>
              <van-button
                size="small"
                round
                class="bg-white/20 border-white/30 text-white font-bold"
                @click="
                  store.selectedExemptionCard = card;
                  store.showSelectRecordForExemption = true;
                "
              >
                立即使用
              </van-button>
            </div>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- Select Record for Exemption Popup -->
    <van-popup
      v-model:show="showSelectRecordForExemption"
      position="bottom"
      round
      class="max-h-[80vh]"
    >
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-bold text-gray-800">选择要豁免的考勤</h3>
          <van-button
            size="mini"
            icon="cross"
            @click="store.showSelectRecordForExemption = false"
          />
        </div>

        <div
          v-if="store.abnormalRecords.length === 0"
          class="py-12 text-center"
        >
          <CheckCircle2 class="w-12 h-12 text-emerald-100 mx-auto mb-3" />
          <p class="text-sm text-gray-400 font-bold">暂无异常考勤记录</p>
        </div>

        <div v-else class="space-y-3 overflow-y-auto max-h-[50vh] pr-1">
          <div
            v-for="r in store.abnormalRecords"
            :key="r.id"
            class="bg-gray-50 p-4 rounded-lg flex items-center justify-between border border-gray-100 active:bg-gray-100 transition-colors"
            @click="useExemptionCard(store.selectedExemptionCard.id, r.date)"
          >
            <div class="flex items-center gap-3">
              <div class="p-2 bg-red-100 text-red-600 rounded-lg">
                <AlertCircle class="w-5 h-5" />
              </div>
              <div>
                <p class="font-bold text-gray-800 text-sm">晨会</p>
                <p class="text-[10px] text-gray-400 font-bold">
                  {{ r.date }}
                </p>
              </div>
            </div>
            <ChevronRight class="w-4 h-4 text-gray-300" />
          </div>
        </div>

        <div class="mt-6">
          <p class="text-[10px] text-gray-400 text-center font-bold">
            * 仅能豁免"异常"状态的考勤记录
          </p>
        </div>
      </div>
    </van-popup>

    <!-- Exemption Success Popup -->
    <van-popup
      v-model:show="store.showExemptionSuccess"
      :z-index="999999"
      position="center"
      round
      class="w-[80%] overflow-hidden"
    >
      <div class="p-8 flex flex-col items-center text-center">
        <div
          class="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500"
        >
          <CheckCircle2 class="w-12 h-12 text-emerald-500" />
        </div>
        <h3
          class="text-lg font-black text-gray-800 mb-2 uppercase tracking-widest"
        >
          豁免申请成功
        </h3>
        <p class="text-xs text-gray-500 font-bold leading-relaxed mb-8">
          已纳入考勤审核，请关注考勤审核结果。
        </p>
        <van-button
          block
          round
          type="primary"
          color="#00a758"
          class="h-12 font-black uppercase tracking-widest"
          @click="store.showExemptionSuccess = false"
        >
          确认并返回
        </van-button>
      </div>
    </van-popup>
  </div>
</template>

<style scoped>
.ring-white {
  --tw-ring-color: #fff;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 确保主容器占满整个视口 */
.app-container {
  height: 100vh;
  height: 100dvh;
  overscroll-behavior: none;
  -webkit-overscroll-behavior: none;
}

/* 优化滚动条样式（如果需要显示） */
main::-webkit-scrollbar {
  width: 4px;
}

main::-webkit-scrollbar-track {
  background: transparent;
}

main::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

main::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}
</style>
