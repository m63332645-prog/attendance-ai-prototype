<script setup>
import {
  MapPin,
  Camera,
  FileText,
  Smartphone,
} from 'lucide-vue-next';
</script>

<template>
  <div class="bg-gray-50 min-h-full">
    <!-- 页面滚动内容区 -->
    <div class="px-4 py-4 space-y-5 no-scrollbar pb-10">
      <!-- 模块 1：出席打卡小贴士 -->
      <div>
        <h3 class="text-base font-black text-gray-900 tracking-tight mb-3">
          出席打卡小贴士
        </h3>

        <div class="space-y-3">
          <!-- 卡片 1：范围外 -->
          <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div class="flex items-center gap-2.5 mb-3">
              <div class="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                <MapPin class="w-4 h-4 text-rose-500" />
              </div>
              <h4 class="text-sm font-bold text-gray-800">
                范围外
              </h4>
            </div>

            <div class="space-y-2 text-xs text-gray-600 pl-1">
              <div class="flex items-start gap-2.5">
                <span class="w-4 h-4 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                <span class="leading-relaxed font-medium">手机定位服务已开启</span>
              </div>
              <div class="flex items-start gap-2.5">
                <span class="w-4 h-4 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                <span class="leading-relaxed font-medium">仅使用手机打卡</span>
              </div>
              <div class="flex items-start gap-2.5">
                <span class="w-4 h-4 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                <span class="leading-relaxed font-medium">身处中宏保险职场范围内</span>
              </div>
            </div>
          </div>

          <!-- 卡片 2：未识别到职场环境或人脸 -->
          <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div class="flex items-center gap-2.5 mb-3">
              <div class="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                <Camera class="w-4 h-4 text-amber-500" />
              </div>
              <h4 class="text-sm font-bold text-gray-800">
                未识别到职场环境或人脸
              </h4>
            </div>

            <div class="space-y-2.5 text-xs text-gray-600 pl-1">
              <div class="flex items-start gap-2.5">
                <span class="w-4 h-4 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                <div class="leading-relaxed font-medium">
                  <strong class="text-gray-800">人脸完整清晰出镜：</strong>拍摄时请露出完整面部，不要佩戴帽子、口罩，避开强光、阴影遮挡
                </div>
              </div>
              <div class="flex items-start gap-2.5">
                <span class="w-4 h-4 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                <div class="leading-relaxed font-medium">
                  <strong class="text-gray-800">职场环境特征清晰可见：</strong>自拍画面里需要拍到中宏保险职场标志性环境
                </div>
              </div>
            </div>
          </div>

          <!-- 卡片 3：无法正常打卡提交申诉 -->
          <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div class="flex items-center gap-2.5 mb-3">
              <div class="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                <FileText class="w-4 h-4 text-blue-500" />
              </div>
              <h4 class="text-sm font-bold text-gray-800">
                无法正常打卡提交申诉
              </h4>
            </div>

            <div class="space-y-2.5 text-xs text-gray-600 pl-1">
              <div class="flex items-start gap-2.5">
                <span class="w-4 h-4 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                <div class="leading-relaxed font-medium">
                  <strong class="text-gray-800">申诉时需要提交：</strong>申诉原因
                </div>
              </div>
              <div class="flex items-start gap-2.5">
                <span class="w-4 h-4 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                <div class="leading-relaxed font-medium">
                  系统无法正常打卡截屏和包含职场环境及人像的自拍照
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 模块 2：如何开启定位 -->
      <div>
        <div class="flex items-center gap-2 mb-3">
          <div class="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-[#00A758]">
            <Smartphone class="w-4 h-4 text-[#00A758]" />
          </div>
          <h3 class="text-base font-black text-gray-900 tracking-tight">
            如何开启定位
          </h3>
        </div>

        <div class="space-y-3">
          <!-- 苹果 iPhone (iOS) -->
          <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div class="inline-block px-3 py-1 bg-[#00A758] text-white rounded-lg text-xs font-bold mb-3 shadow-sm">
              苹果 iPhone（iOS）
            </div>

            <div class="space-y-2.5 text-xs text-gray-700 leading-relaxed pl-0.5 font-medium">
              <div class="flex items-start gap-2">
                <span class="text-[#00A758] font-bold">1.</span>
                <span>打开"设置"App → 向下滑动找到"隐私与安全性"（旧版 iOS 为"隐私"）→ 点击顶部的"定位服务"，确保总开关已开启。</span>
              </div>
              <div class="flex items-start gap-2">
                <span class="text-[#00A758] font-bold">2.</span>
                <span>在下方应用列表中找到"宏掌门"并点击。</span>
              </div>
              <div class="flex items-start gap-2">
                <span class="text-[#00A758] font-bold">3.</span>
                <div>
                  <p class="font-bold text-gray-800">选择授权方式：</p>
                  <p class="text-gray-500 mt-0.5">· 使用 App 期间：推荐，仅在使用时获取位置。</p>
                  <p class="text-gray-500 mt-0.5">· 始终：允许后台获取位置（一般不常用）。</p>
                  <p class="text-gray-500 mt-0.5">· 永不：拒绝定位。</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 华为 / 荣耀 (HarmonyOS / EMUI) -->
          <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div class="inline-block px-3 py-1 bg-[#00A758] text-white rounded-lg text-xs font-bold mb-3 shadow-sm">
              华为 / 荣耀（HarmonyOS / EMUI）
            </div>

            <div class="space-y-2.5 text-xs text-gray-700 leading-relaxed pl-0.5 font-medium">
              <div class="flex items-start gap-2">
                <span class="text-[#00A758] font-bold">1.</span>
                <span><strong class="text-gray-800">快捷方式：</strong>长按"宏掌门"图标 → 点击"应用信息" → "权限" → 开启"位置信息"。</span>
              </div>
              <div class="flex items-start gap-2">
                <span class="text-[#00A758] font-bold">2.</span>
                <span><strong class="text-gray-800">标准路径：</strong>设置 → 隐私（或"隐私和安全"）→ 定位服务 开启总开关 → 在"定位服务"页面管理应用权限，找到"宏掌门"选择权限（如"仅使用期间允许"）。</span>
              </div>
            </div>
          </div>

          <!-- 小米 / Redmi (HyperOS / MIUI) -->
          <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div class="inline-block px-3 py-1 bg-[#00A758] text-white rounded-lg text-xs font-bold mb-3 shadow-sm">
              小米 / Redmi（HyperOS / MIUI）
            </div>

            <div class="space-y-2.5 text-xs text-gray-700 leading-relaxed pl-0.5 font-medium">
              <div class="flex items-start gap-2">
                <span class="text-[#00A758] font-bold">1.</span>
                <span><strong class="text-gray-800">路径：</strong>设置 → 应用设置 → 授权管理 → 应用权限管理 → 在列表中找到"宏掌门" → 点击"定位权限" → 选择"仅在使用期间允许"或"始终允许"。</span>
              </div>
              <div class="flex items-start gap-2">
                <span class="text-[#00A758] font-bold">2.</span>
                <span>也可以从"设置" → "隐私保护" → "位置信息" 开启总开关。</span>
              </div>
            </div>
          </div>

          <!-- 小米 / Redmi 卡片结束 -->
        </div>
      </div>
    </div>
  </div>
</template>
