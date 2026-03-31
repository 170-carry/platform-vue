import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:clipboard-check',
      order: 10,
      title: '审批管理',
    },
    name: 'ApprovalManager',
    path: '/approval/manager',
    children: [
      {
        name: 'ApprovalAvatar',
        path: 'user/avatatphoto/approval',
        component: () => import('#/views/approval/index.vue'),
        meta: { title: '头像审核' },
      },
      {
        name: 'ApprovalNickname',
        path: 'user/nickname/approval',
        component: () => import('#/views/approval/index.vue'),
        meta: { title: '昵称审核' },
      },
      {
        name: 'ApprovalPhotoWall',
        path: 'user/photowall/approval',
        component: () => import('#/views/approval/index.vue'),
        meta: { title: '照片墙审核' },
      },
      {
        name: 'ApprovalRoomCover',
        path: 'room/cover/approval',
        component: () => import('#/views/approval/index.vue'),
        meta: { title: '房间封面审批' },
      },
      {
        name: 'ApprovalProfileDesc',
        path: 'user/profile_desc/approval',
        component: () => import('#/views/approval/index.vue'),
        meta: { title: '用户个性签名审批' },
      },
      {
        name: 'ApprovalRoomNotice',
        path: 'room/notice/approval',
        component: () => import('#/views/approval/index.vue'),
        meta: { title: '房间通知审批' },
      },
      {
        name: 'ApprovalRoomNickname',
        path: 'room/nickanme/approval',
        component: () => import('#/views/approval/index.vue'),
        meta: { title: '房间名称审批' },
      },
      {
        name: 'ApprovalRoomTheme',
        path: 'room/theme/approval',
        component: () => import('#/views/approval/index.vue'),
        meta: { title: '房间主题审批' },
      },
      {
        name: 'ApprovalReport',
        path: 'report',
        component: () => import('#/views/approval/index.vue'),
        meta: { title: '举报管理' },
      },
      {
        name: 'ApprovalFeedback',
        path: 'feedback',
        component: () => import('#/views/approval/index.vue'),
        meta: { title: '意见反馈' },
      },
      {
        name: 'ApprovalNotPassHistory',
        path: 'not_pass_history/table',
        component: () => import('#/views/approval/index.vue'),
        meta: { title: '违规历史记录' },
      },
      {
        name: 'ApprovalFamily',
        path: 'family/approval',
        component: () => import('#/views/approval/index.vue'),
        meta: { title: '家族头像审批' },
      },
      {
        name: 'ApprovalDynamicContent',
        path: 'dynamic/content/approval',
        component: () => import('#/views/approval/index.vue'),
        meta: { title: '动态内容审批' },
      },
      {
        name: 'ApprovalDynamicReport',
        path: 'dynamic/report',
        component: () => import('#/views/approval/index.vue'),
        meta: { title: '动态举报审批' },
      },
      {
        name: 'ApprovalUserBankCard',
        path: 'user/bank-card/approval',
        component: () => import('#/views/approval/index.vue'),
        meta: { title: '用户银行卡审批' },
      },
    ],
  },
];

export default routes;
