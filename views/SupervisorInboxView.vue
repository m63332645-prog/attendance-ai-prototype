<script setup>
// 审批页面(废弃，在管理端审核) http://localhost:3000/#/supervisor-inbox
import { store } from '../store';
import SupervisorInbox from '../components/SupervisorInbox.vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const handleApproval = (id, approved) => {
  store.handleApproval(id, approved);
};

const handleLeaveApproval = (id, approved) => {
  store.handleLeaveApproval(id, approved);
};
</script>

<template>
  <div>
    <SupervisorInbox 
      :pending-records="store.pendingApprovals" 
      :pending-leaves="store.pendingLeaves"
      @back="router.push('/profile')" 
      @approve="handleApproval"
      @approve-leave="handleLeaveApproval"
    />
  </div>
</template>
