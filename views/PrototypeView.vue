<script setup>
  // 原型页面 http://localhost:3000/#/prototype 与功能开发无关
import PrototypeView from '../components/PrototypeView.vue';
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<template>
  <div>
    <PrototypeView @back="router.push('/profile')" />
  </div>
</template>
