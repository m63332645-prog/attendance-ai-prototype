<template>
  <div class="flex items-start justify-between mb-3">
    <div class="flex items-center gap-3">
      <div
        :class="[
          'w-10 h-10 rounded-lg flex items-center justify-center',
          switchStyle.bg,
        ]"
      >
        <CheckCircle2 class="w-5 h-5 text-[#FF6777]" />
      </div>
      <div>
        <h4 class="font-bold text-gray-800 text-base">晨会</h4>
        <p class="text-[11px] font-bold text-gray-400 mt-0.5">
          {{ props.tempType === 'Q' ? '请假' : '异常' }}
        </p>
      </div>
    </div>
    <span
      v-if="props.tempType === 'I'"
      class="text-[9px] font-black text-[#FF6777] bg-[#FFF5F5] px-2 py-1 rounded-md uppercase"
    >
      异常
    </span>
    <span
      v-else
      :class="[
        'text-[9px] font-black px-2 py-1 rounded-md uppercase',
        switchStyle.text,
        switchStyle.bg,
      ]"
    >
      {{ props.tempType === 'Q' ? '请假' : '异常' }}
    </span>
  </div>
</template>
<script setup>
import { computed } from "vue";
import { CheckCircle2 } from "lucide-vue-next";

const props = defineProps({
  tempType: { type: String, default: "I" },
});
const switchStyle = computed(() => {
  switch (props.tempType) {
    case "Q":
      return { bg: "bg-teal-50", text: "text-teal-600" };
    case "I":
      return { bg: "bg-[#FFF5F5]", text: "text-[#FFE5E5]" };
    default:
      return { bg: "bg-yellow-50", text: "text-yellow-600" };
  }
});
</script>
