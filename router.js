import { createRouter, createWebHashHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'dashboard',
    meta: { title: '首页' },
    component: () => import('./views/DashboardView.vue')
  },
  {
    path: '/checkin-success',
    name: 'checkin_success',
    meta: { title: '打卡成功' },
    component: () => import('./views/CheckInSuccessView.vue')
  },
  {
    path: '/history',
    name: 'history',
    meta: { title: '打卡明细' },
    component: () => import('./views/HistoryView.vue')
  },
  {
    path: '/profile',
    name: 'profile',

    component: () => import('./views/ProfileView.vue')
  },
  {
    path: '/supervisor-inbox',
    name: 'supervisor_inbox',

    component: () => import('./views/SupervisorInboxView.vue')
  },
  {
    path: '/appeal-form',
    name: 'appeal_form',
    meta: { title: '申诉表单' },
    component: () => import('./views/AppealFormView.vue'),
    props: true
  },
  {
    path: '/leave-form',
    name: 'leave_form',
    meta: { title: '请假表单' },
    component: () => import('./views/LeaveFormView.vue')
  },
  {
    path: '/prototype',
    name: 'prototype',
    component: () => import('./views/PrototypeView.vue')
  },
  {
    path: '/attendance-tips',
    name: 'attendance_tips',
    meta: { title: '打卡小贴士' },
    component: () => import('./views/AttendanceTipsView.vue')
  }
];

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),  // 设置基础路径为相对路径
  routes
});

router.beforeEach((to, from, next) => {
  if (to.meta && to.meta.title) {
    document.title = to.meta.title
  } else {
    document.title = '宏掌门app'
  }
  next()
});
export default router;