import {
  approveData,
  approveDynamicContentNotPass,
  approveDynamicContentPass,
  approvePhotoWallNotPass,
  approvePhotoWallPass,
  approveReportedNotPass,
  approveReportedPass,
  approveRoomTheme,
  approveUserBankCardNotPass,
  approveUserBankCardPass,
  batchProcessFeedback,
  getDynamicContentPage,
  getDynamicReportPage,
  getFamilyApprovalPage,
  getFeedbackPage,
  getPhotoWallApprovalPage,
  getReportedPage,
  getRoomApprovalPage,
  getRoomThemeApprovalPage,
  getUserBankCardPage,
  getUserProfileApprovalPage,
  getUserProfileDescApprovalPage,
  getViolationHistoryPage,
  markFamilyNotPass,
  processDynamicReport,
} from '#/api/legacy/approval';

type ApprovalActionType = 'danger' | 'primary';

type ApprovalFilterType = 'dateRange' | 'input' | 'member' | 'select' | 'sysOrigin';

type ApprovalCellType =
  | 'images'
  | 'link'
  | 'origin'
  | 'tag'
  | 'text'
  | 'user-profile';

type ApprovalRowActionType = 'account' | 'details' | 'edit' | 'feedback';

export interface ApprovalFilterOption {
  disabled?: boolean;
  label: string;
  value: number | string;
}

export interface ApprovalFilter {
  clearable?: boolean;
  endField?: string;
  field?: string;
  label: string;
  options?: ApprovalFilterOption[];
  placeholder: string;
  startField?: string;
  type: ApprovalFilterType;
}

export interface ApprovalBulkAction {
  label: string;
  show?: (query: Record<string, any>) => boolean;
  type?: ApprovalActionType;
  execute: (records: any[], query: Record<string, any>) => Promise<void>;
}

export interface ApprovalGalleryCard {
  actions?: ApprovalRowAction[];
  details?: Array<{ label: string; value: string }>;
  extraTag?: string;
  galleryImages?: string[];
  leadText?: string;
  lines: string[];
  overlay?: string;
  title: string;
  titleUserId?: number | string;
}

export interface ApprovalRowAction {
  label: string;
  type: ApprovalRowActionType;
  value?: number | string;
}

export interface ApprovalTableCell {
  color?: string;
  images?: string[];
  text?: string;
  type: ApprovalCellType;
  userId?: number | string;
}

export interface ApprovalTableColumn {
  align?: 'center' | 'left';
  key: string;
  render: (record: any) => ApprovalTableCell | ApprovalTableCell[];
  title: string;
  width?: number;
}

export interface ApprovalExpandedSection {
  label: string;
  type?: 'images' | 'text' | 'videos';
  value: string | string[];
}

export interface ApprovalTimelineItem {
  content: string | string[];
  contentType?: 'images' | 'text' | 'videos';
  extras?: string[];
  tag?: string;
  time: string;
  title: string;
}

interface ApprovalPageBase {
  actions?: ApprovalBulkAction[];
  defaultQuery: Record<string, any>;
  fetch: (query: Record<string, any>) => Promise<{ records: any[]; total: number }>;
  filters: ApprovalFilter[];
  rowActions?: (record: any) => ApprovalRowAction[];
  rowKey?: (record: any, index: number) => number | string;
  selectable?: (query: Record<string, any>) => boolean;
  title: string;
}

export interface ApprovalGalleryPage extends ApprovalPageBase {
  buildCard: (record: any, query: Record<string, any>) => ApprovalGalleryCard;
  kind: 'gallery';
}

export interface ApprovalTablePage extends ApprovalPageBase {
  columns: ApprovalTableColumn[];
  expandable?: (record: any) => ApprovalExpandedSection[];
  kind: 'table';
}

export interface ApprovalHistoryPage extends ApprovalPageBase {
  buildTimeline: (record: any) => ApprovalTimelineItem;
  kind: 'history';
}

export interface ApprovalFamilyPage {
  kind: 'family';
  tabs: Record<string, { label: string; page: ApprovalGalleryPage | ApprovalTablePage }>;
  title: string;
}

export type ApprovalPage =
  | ApprovalFamilyPage
  | ApprovalGalleryPage
  | ApprovalHistoryPage
  | ApprovalTablePage;

const COMMON_APPROVAL_OPTIONS: ApprovalFilterOption[] = [
  { label: '通过', value: 'PASS' },
  { disabled: true, label: '不通过', value: 'NOT_PASS' },
  { label: '等待审核', value: 'PENDING' },
];

const COMMON_APPROVAL_ALL_OPTIONS: ApprovalFilterOption[] = [
  { label: '通过', value: 'PASS' },
  { label: '不通过', value: 'NOT_PASS' },
  { label: '等待审核', value: 'PENDING' },
];

const GENDER_OPTIONS: ApprovalFilterOption[] = [
  { label: '女', value: 0 },
  { label: '男', value: 1 },
];

const PHOTO_WALL_STATUS_OPTIONS: ApprovalFilterOption[] = [
  { label: '正常的', value: 'NORMAL' },
  { label: '违规的', value: 'VIOLATION' },
  { label: '等待人工复审的', value: 'SUSPECTED' },
];

const REPORT_STATUS_OPTIONS: ApprovalFilterOption[] = [
  { label: '待审核', value: 0 },
  { label: '有效', value: 1 },
  { label: '无效', value: 2 },
];

const DYNAMIC_REPORT_STATUS_OPTIONS: ApprovalFilterOption[] = [
  { label: '待审核', value: 0 },
  { label: '违规', value: 1 },
  { label: '正常', value: 2 },
];

const REPORT_TYPE_OPTIONS: ApprovalFilterOption[] = [
  { label: '非法信息', value: 0 },
  { label: '人身攻击', value: 1 },
  { label: '不适当的内容', value: 2 },
  { label: '发送垃圾邮件', value: 3 },
  { label: '诈骗', value: 4 },
  { label: '涉及色情', value: 5 },
];

const FEEDBACK_STATUS_OPTIONS: ApprovalFilterOption[] = [
  { label: '未处理', value: 0 },
  { label: '已处理', value: 1 },
];

const APPROVAL_TYPE_OPTIONS: ApprovalFilterOption[] = [
  { label: '用户昵称', value: 'NICKNAME' },
  { label: '用户头像', value: 'AVATAR' },
  { label: '照片墙', value: 'PHOTO_WALL' },
  { label: 'live图', value: 'LIVE' },
  { label: '短视频', value: 'SHORT_VIDEO' },
  { label: '房间昵称', value: 'ROOM_NICKNAME' },
  { label: '房间头像', value: 'ROOM_AVATAR' },
  { label: '房间通知公告', value: 'ROOM_NOTICE' },
  { label: '个人资料签名', value: 'PROFILE_DESC' },
];

const BANK_CARD_OPTIONS: ApprovalFilterOption[] = [
  { label: 'PayPal', value: 'PAY_PAL' },
  { label: 'Payoneer', value: 'PAYONEER' },
  { label: 'Bank', value: 'BANK' },
];

const SYS_ORIGIN_OPTIONS: ApprovalFilterOption[] = [
  { label: 'LIKEI', value: 'LIKEI' },
];

const DEFAULT_SYS_ORIGIN = SYS_ORIGIN_OPTIONS[0]?.value ?? '';

function splitCsv(value: any) {
  if (!value || value === 'null') {
    return [];
  }
  if (Array.isArray(value)) {
    return value.filter(Boolean).map((item) => String(item));
  }
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildApprovalDataAction(
  approvalType: string,
  approvalStatus: 'NOT_PASS' | 'PASS',
  mapRecord: (record: any) => Record<string, any>,
): ApprovalBulkAction {
  return {
    execute: async (records) => {
      await approveData({
        approvalStatus,
        approvalType,
        waitApprovalUser: records.map(mapRecord),
      });
    },
    label: approvalStatus === 'PASS' ? '鉴定通过' : '鉴定违规',
    type: approvalStatus === 'PASS' ? 'primary' : 'danger',
  };
}

function familyNotPassAction(
  approvalType: 'FAMILY_AVATAR' | 'FAMILY_NICKNAME' | 'FAMILY_NOTICE',
  mapRecord: (record: any) => Record<string, any>,
): ApprovalBulkAction {
  return {
    execute: async (records) => {
      const approvalRecords = records.map(mapRecord);
      await approveData({
        approvalStatus: 'NOT_PASS',
        approvalType,
        waitApprovalUser: approvalRecords,
      });
      await markFamilyNotPass({
        familyIds: approvalRecords.map((item) => item.familyId),
        type: approvalType,
      });
    },
    label: '鉴定违规',
    type: 'danger',
  };
}

const approvalPages: Record<string, ApprovalPage> = {
  '/approval/manager/user/avatatphoto/approval': {
    actions: [
      buildApprovalDataAction('AVATAR', 'PASS', (record) => ({
        content: record.userAvatar,
        contentId: record.userId,
        tags: record.machineLabel,
        userId: record.userId,
      })),
      buildApprovalDataAction('AVATAR', 'NOT_PASS', (record) => ({
        content: record.userAvatar,
        contentId: record.userId,
        tags: record.machineLabel,
        userId: record.userId,
      })),
    ],
    buildCard: (record) => ({
      actions: [
        { label: '编辑用户', type: 'edit', value: record.userId },
        { label: '账号处理', type: 'account', value: record.userId },
      ],
      extraTag: record.approvalUserName || '',
      galleryImages: splitCsv(record.userAvatar),
      lines: [`性别：${record.userSexName || '-'}`, `年龄：${record.age || '-'}`],
      overlay: record.machineLabel || '',
      title: record.userNickname || '-',
      titleUserId: record.userId,
    }),
    defaultQuery: {
      approveStatus: 'PENDING',
      approveType: 'AVATAR',
      cursor: 1,
      endDateTime: '',
      limit: 30,
      startDateTime: '',
      sysOrigin: DEFAULT_SYS_ORIGIN,
      userId: '',
      userSex: '',
    },
    fetch: getUserProfileApprovalPage,
    filters: [
      { field: 'sysOrigin', label: '归属系统', placeholder: '归属系统', type: 'sysOrigin' },
      {
        field: 'approveStatus',
        label: '审批状态',
        options: COMMON_APPROVAL_OPTIONS,
        placeholder: '审批状态',
        type: 'select',
      },
      {
        endField: 'endDateTime',
        label: '时间范围',
        placeholder: '时间范围',
        startField: 'startDateTime',
        type: 'dateRange',
      },
      { field: 'userId', label: '用户ID', placeholder: '用户ID', type: 'input' },
      {
        clearable: true,
        field: 'userSex',
        label: '性别',
        options: GENDER_OPTIONS,
        placeholder: '性别',
        type: 'select',
      },
    ],
    kind: 'gallery',
    selectable: (query) => query.approveStatus === 'PENDING',
    title: '头像审核',
  },
  '/approval/manager/user/nickname/approval': {
    actions: [
      buildApprovalDataAction('NICKNAME', 'PASS', (record) => ({
        content: record.userNickname,
        contentId: record.userId,
        userId: record.userId,
      })),
      buildApprovalDataAction('NICKNAME', 'NOT_PASS', (record) => ({
        content: record.userNickname,
        contentId: record.userId,
        userId: record.userId,
      })),
    ],
    columns: [
      {
        key: 'userId',
        render: (record) => ({ text: String(record.userId || '-'), type: 'text' }),
        title: '用户ID',
        width: 160,
      },
      {
        key: 'nickname',
        render: (record) => ({
          text: record.userNickname || '-',
          type: 'link',
          userId: record.userId,
        }),
        title: '昵称',
      },
      {
        key: 'updateTime',
        render: (record) => ({ text: record.updateTime || '-', type: 'text' }),
        title: '修改时间',
        width: 180,
      },
    ],
    defaultQuery: {
      approveStatus: 'PENDING',
      approveType: 'NICKNAME',
      cursor: 1,
      endDateTime: '',
      limit: 30,
      startDateTime: '',
      sysOrigin: DEFAULT_SYS_ORIGIN,
      userId: '',
    },
    fetch: getUserProfileApprovalPage,
    filters: [
      { field: 'sysOrigin', label: '归属系统', placeholder: '归属系统', type: 'sysOrigin' },
      {
        endField: 'endDateTime',
        label: '时间范围',
        placeholder: '时间范围',
        startField: 'startDateTime',
        type: 'dateRange',
      },
      { field: 'userId', label: '用户ID', placeholder: '用户ID', type: 'input' },
      {
        field: 'approveStatus',
        label: '审批状态',
        options: COMMON_APPROVAL_OPTIONS,
        placeholder: '审批状态',
        type: 'select',
      },
    ],
    kind: 'table',
    rowActions: (record) => [
      { label: '用户详情', type: 'details', value: record.userId },
      { label: '账号处理', type: 'account', value: record.userId },
    ],
    selectable: (query) => query.approveStatus === 'PENDING',
    title: '昵称审核',
  },
  '/approval/manager/user/photowall/approval': {
    actions: [
      {
        execute: async (records) => {
          await approvePhotoWallPass(
            records.map((record) => ({
              content: record.resourceUrl,
              contentId: record.id,
              tags: record.labelNames,
              userId: record.userId,
            })),
          );
        },
        label: '鉴定通过',
        show: (query) => query.status === 'SUSPECTED',
        type: 'primary',
      },
      {
        execute: async (records) => {
          await approvePhotoWallNotPass(
            records.map((record) => ({
              content: record.resourceUrl,
              contentId: record.id,
              tags: record.labelNames,
              userId: record.userId,
            })),
          );
        },
        label: '鉴定违规',
        show: (query) => query.status === 'SUSPECTED',
        type: 'danger',
      },
    ],
    buildCard: (record) => ({
      actions: [{ label: '编辑用户', type: 'edit', value: record.userId }],
      galleryImages: splitCsv(record.resourceUrl),
      lines: [
        `性别：${record.userSexName || '-'}`,
        `年龄：${record.age || '-'}`,
        `标签：${record.labelNames || '-'}`,
      ],
      title: record.userNickname || '-',
      titleUserId: record.userId,
    }),
    defaultQuery: {
      cursor: 1,
      endTime: '',
      limit: 30,
      startTime: '',
      status: 'SUSPECTED',
      userId: '',
      userNickname: '',
      userSex: '',
    },
    fetch: getPhotoWallApprovalPage,
    filters: [
      {
        field: 'status',
        label: '状态',
        options: PHOTO_WALL_STATUS_OPTIONS,
        placeholder: '状态',
        type: 'select',
      },
      {
        endField: 'endTime',
        label: '时间范围',
        placeholder: '时间范围',
        startField: 'startTime',
        type: 'dateRange',
      },
      { field: 'userId', label: '用户ID', placeholder: '用户ID', type: 'input' },
      {
        field: 'userNickname',
        label: '昵称',
        placeholder: '昵称',
        type: 'input',
      },
      {
        clearable: true,
        field: 'userSex',
        label: '性别',
        options: GENDER_OPTIONS,
        placeholder: '性别',
        type: 'select',
      },
    ],
    kind: 'gallery',
    selectable: (query) => query.status === 'SUSPECTED',
    title: '照片墙审核',
  },
  '/approval/manager/room/cover/approval': {
    actions: [
      buildApprovalDataAction('ROOM_AVATAR', 'PASS', (record) => ({
        content: record.roomCover,
        contentId: record.roomId,
        tags: record.machineLabel,
        userId: record.userId,
      })),
      buildApprovalDataAction('ROOM_AVATAR', 'NOT_PASS', (record) => ({
        content: record.roomCover,
        contentId: record.roomId,
        tags: record.machineLabel,
        userId: record.userId,
      })),
    ],
    buildCard: (record) => ({
      actions: [
        { label: '编辑用户', type: 'edit', value: record.userId },
        { label: '账号处理', type: 'account', value: record.userId },
      ],
      details: [
        { label: '房间ID', value: String(record.roomId || '-') },
        { label: '用户ID', value: String(record.userId || '-') },
      ],
      galleryImages: splitCsv(record.roomCover),
      lines: [
        `性别：${record.userBaseInfo?.userSexName || '-'}`,
        `年龄：${record.userBaseInfo?.age || '-'}`,
      ],
      overlay: record.machineLabel || '',
      title: record.userBaseInfo?.userNickname || '-',
      titleUserId: record.userId,
    }),
    defaultQuery: {
      approveStatus: 'PENDING',
      approveType: 'ROOM_AVATAR',
      cursor: 1,
      endDateTime: '',
      limit: 30,
      roomAccount: '',
      startDateTime: '',
      sysOrigin: DEFAULT_SYS_ORIGIN,
      userId: '',
    },
    fetch: getRoomApprovalPage,
    filters: [
      { field: 'sysOrigin', label: '归属系统', placeholder: '归属系统', type: 'sysOrigin' },
      {
        endField: 'endDateTime',
        label: '时间范围',
        placeholder: '时间范围',
        startField: 'startDateTime',
        type: 'dateRange',
      },
      {
        field: 'roomAccount',
        label: '房间账号',
        placeholder: '房间账号',
        type: 'input',
      },
      { field: 'userId', label: '用户ID', placeholder: '用户ID', type: 'input' },
      {
        field: 'approveStatus',
        label: '审批状态',
        options: COMMON_APPROVAL_OPTIONS,
        placeholder: '审批状态',
        type: 'select',
      },
    ],
    kind: 'gallery',
    selectable: (query) => query.approveStatus === 'PENDING',
    title: '房间封面审批',
  },
  '/approval/manager/user/profile_desc/approval': {
    actions: [
      buildApprovalDataAction('PROFILE_DESC', 'PASS', (record) => ({
        content: record.profileDesc,
        contentId: record.userId,
        userId: record.userId,
      })),
      buildApprovalDataAction('PROFILE_DESC', 'NOT_PASS', (record) => ({
        content: record.profileDesc,
        contentId: record.userId,
        userId: record.userId,
      })),
    ],
    columns: [
      {
        key: 'nickname',
        render: (record) => ({
          text: record.userBaseInfo?.userNickname || '-',
          type: 'link',
          userId: record.userId,
        }),
        title: '昵称',
      },
      {
        key: 'profileDesc',
        render: (record) => ({ text: record.profileDesc || '-', type: 'text' }),
        title: '签名',
      },
      {
        key: 'updateTime',
        render: (record) => ({ text: record.updateTime || '-', type: 'text' }),
        title: '修改时间',
        width: 180,
      },
    ],
    defaultQuery: {
      approveStatus: 'PENDING',
      cursor: 1,
      endDateTime: '',
      limit: 30,
      startDateTime: '',
      userId: '',
    },
    fetch: getUserProfileDescApprovalPage,
    filters: [
      {
        endField: 'endDateTime',
        label: '时间范围',
        placeholder: '时间范围',
        startField: 'startDateTime',
        type: 'dateRange',
      },
      { field: 'userId', label: '用户ID', placeholder: '用户ID', type: 'input' },
      {
        field: 'approveStatus',
        label: '审批状态',
        options: COMMON_APPROVAL_OPTIONS,
        placeholder: '审批状态',
        type: 'select',
      },
    ],
    kind: 'table',
    rowActions: (record) => [
      { label: '用户详情', type: 'details', value: record.userId },
    ],
    selectable: (query) => query.approveStatus === 'PENDING',
    title: '用户个性签名审批',
  },
  '/approval/manager/room/notice/approval': {
    actions: [
      buildApprovalDataAction('ROOM_NOTICE', 'PASS', (record) => ({
        content: record.roomDesc,
        contentId: record.roomId,
        userId: record.userId,
      })),
      buildApprovalDataAction('ROOM_NOTICE', 'NOT_PASS', (record) => ({
        content: record.roomDesc,
        contentId: record.roomId,
        userId: record.userId,
      })),
    ],
    columns: [
      {
        key: 'room',
        render: (record) => ({
          text: `${record.roomId || '-'} / ${record.roomAccount || '-'}`,
          type: 'text',
        }),
        title: '房间ID/账号',
      },
      {
        key: 'nickname',
        render: (record) => ({
          text: record.userBaseInfo?.userNickname || '-',
          type: 'link',
          userId: record.userId,
        }),
        title: '昵称',
      },
      {
        key: 'roomDesc',
        render: (record) => ({ text: record.roomDesc || '-', type: 'text' }),
        title: '房间公告',
      },
      {
        key: 'updateTime',
        render: (record) => ({ text: record.updateTime || '-', type: 'text' }),
        title: '修改时间',
        width: 180,
      },
    ],
    defaultQuery: {
      approveStatus: 'PENDING',
      approveType: 'ROOM_NOTICE',
      cursor: 1,
      endDateTime: '',
      limit: 30,
      roomAccount: '',
      startDateTime: '',
      sysOrigin: DEFAULT_SYS_ORIGIN,
      userId: '',
    },
    fetch: getRoomApprovalPage,
    filters: [
      { field: 'sysOrigin', label: '归属系统', placeholder: '归属系统', type: 'sysOrigin' },
      {
        endField: 'endDateTime',
        label: '时间范围',
        placeholder: '时间范围',
        startField: 'startDateTime',
        type: 'dateRange',
      },
      {
        field: 'roomAccount',
        label: '房间账号',
        placeholder: '房间账号',
        type: 'input',
      },
      { field: 'userId', label: '用户ID', placeholder: '用户ID', type: 'input' },
      {
        field: 'approveStatus',
        label: '审批状态',
        options: COMMON_APPROVAL_OPTIONS,
        placeholder: '审批状态',
        type: 'select',
      },
    ],
    kind: 'table',
    rowActions: (record) => [
      { label: '用户详情', type: 'details', value: record.userId },
      { label: '账号处理', type: 'account', value: record.userId },
    ],
    selectable: (query) => query.approveStatus === 'PENDING',
    title: '房间通知审批',
  },
  '/approval/manager/room/nickanme/approval': {
    actions: [
      buildApprovalDataAction('ROOM_NICKNAME', 'PASS', (record) => ({
        content: record.roomName,
        contentId: record.roomId,
        userId: record.userId,
      })),
      buildApprovalDataAction('ROOM_NICKNAME', 'NOT_PASS', (record) => ({
        content: record.roomName,
        contentId: record.roomId,
        userId: record.userId,
      })),
    ],
    columns: [
      {
        key: 'room',
        render: (record) => ({
          images: splitCsv(record.roomCover),
          text: `ID: ${record.roomId || '-'} / 账号: ${record.roomAccount || '-'}`,
          type: 'images',
        }),
        title: '房间ID/账号',
        width: 220,
      },
      {
        key: 'user',
        render: (record) => ({
          text: record.userBaseInfo?.userNickname || '-',
          type: 'user-profile',
          userId: record.userId,
        }),
        title: '用户',
      },
      {
        key: 'roomName',
        render: (record) => ({ text: record.roomName || '-', type: 'text' }),
        title: '房间名称',
      },
      {
        key: 'updateTime',
        render: (record) => ({ text: record.updateTime || '-', type: 'text' }),
        title: '修改时间',
        width: 180,
      },
    ],
    defaultQuery: {
      approveStatus: 'PENDING',
      approveType: 'ROOM_NICKNAME',
      cursor: 1,
      endDateTime: '',
      limit: 30,
      roomId: '',
      startDateTime: '',
      sysOrigin: DEFAULT_SYS_ORIGIN,
      userId: '',
    },
    fetch: getRoomApprovalPage,
    filters: [
      { field: 'sysOrigin', label: '归属系统', placeholder: '归属系统', type: 'sysOrigin' },
      {
        endField: 'endDateTime',
        label: '时间范围',
        placeholder: '时间范围',
        startField: 'startDateTime',
        type: 'dateRange',
      },
      { field: 'roomId', label: '房间ID', placeholder: '房间ID', type: 'input' },
      { field: 'userId', label: '用户ID', placeholder: '用户ID', type: 'input' },
      {
        field: 'approveStatus',
        label: '审批状态',
        options: COMMON_APPROVAL_OPTIONS,
        placeholder: '审批状态',
        type: 'select',
      },
    ],
    kind: 'table',
    rowActions: (record) => [
      { label: '用户详情', type: 'details', value: record.userId },
      { label: '账号处理', type: 'account', value: record.userId },
    ],
    selectable: (query) => query.approveStatus === 'PENDING',
    title: '房间名称审批',
  },
  '/approval/manager/room/theme/approval': {
    actions: [
      {
        execute: async (records) => {
          await approveRoomTheme({
            approvalStatus: 'PASS',
            waitApprovalUser: records.map((record) => ({
              content: record.customize?.themeMoney,
              contentId: record.customize?.id,
              userId: record.userProfile?.id,
            })),
          });
        },
        label: '鉴定通过',
        show: (query) => query.themeStatus === 'PENDING',
        type: 'primary',
      },
      {
        execute: async (records) => {
          await approveRoomTheme({
            approvalStatus: 'NOT_PASS',
            waitApprovalUser: records.map((record) => ({
              content: record.customize?.themeMoney,
              contentId: record.customize?.id,
              userId: record.userProfile?.id,
            })),
          });
        },
        label: '鉴定违规',
        show: () => true,
        type: 'danger',
      },
    ],
    buildCard: (record, query) => ({
      actions: [
        { label: '编辑用户', type: 'edit', value: record.userProfile?.id },
        { label: '账号处理', type: 'account', value: record.userProfile?.id },
      ],
      galleryImages: splitCsv(record.customize?.themeBack),
      lines: [
        `性别：${record.userProfile?.userSexName || '-'}`,
        `年龄：${record.userProfile?.age || '-'}`,
        `创建时间：${record.createTime || '-'}`,
        `修改时间：${record.updateTime || '-'}`,
        ...(query.themeStatus !== 'PENDING'
          ? [`审核人：${record.optUserNickname || '-'}`]
          : []),
      ],
      title: record.userProfile?.userNickname || '-',
      titleUserId: record.userProfile?.id,
    }),
    defaultQuery: {
      cursor: 1,
      endDateTime: '',
      limit: 30,
      startDateTime: '',
      sysOrigin: DEFAULT_SYS_ORIGIN,
      themeStatus: 'PENDING',
      userId: '',
    },
    fetch: getRoomThemeApprovalPage,
    filters: [
      { field: 'sysOrigin', label: '归属系统', placeholder: '归属系统', type: 'sysOrigin' },
      {
        endField: 'endDateTime',
        label: '时间范围',
        placeholder: '时间范围',
        startField: 'startDateTime',
        type: 'dateRange',
      },
      { field: 'userId', label: '用户ID', placeholder: '用户ID', type: 'input' },
      {
        field: 'themeStatus',
        label: '审批状态',
        options: COMMON_APPROVAL_ALL_OPTIONS,
        placeholder: '审批状态',
        type: 'select',
      },
    ],
    kind: 'gallery',
    selectable: (query) => query.themeStatus === 'PENDING',
    title: '房间主题审批',
  },
  '/approval/manager/report': {
    actions: [
      {
        execute: async (records) => {
          await approveReportedPass(
            records
              .filter((record) => record.reportUserId && record.reportedUserId)
              .map((record) => ({
                contentId: record.id,
                ext: record.reportedUserId,
                userId: record.reportUserId,
              })),
          );
        },
        label: '有效',
        show: (query) => query.approvalStatus === 0,
        type: 'primary',
      },
      {
        execute: async (records) => {
          await approveReportedNotPass(
            records
              .filter((record) => record.reportUserId && record.reportedUserId)
              .map((record) => ({
                contentId: record.id,
                ext: record.reportedUserId,
                userId: record.reportUserId,
              })),
          );
        },
        label: '无效',
        show: (query) => query.approvalStatus === 0,
        type: 'danger',
      },
    ],
    columns: [
      {
        key: 'reportTypeName',
        render: (record) => ({ text: record.reportTypeName || '-', type: 'text' }),
        title: '举报类型',
      },
      {
        key: 'createTime',
        render: (record) => ({ text: record.createTime || '-', type: 'text' }),
        title: '创建时间',
        width: 180,
      },
      {
        key: 'updateTime',
        render: (record) => ({ text: record.updateTime || '-', type: 'text' }),
        title: '修改时间',
        width: 180,
      },
    ],
    defaultQuery: {
      approvalStatus: 0,
      cursor: 1,
      endTime: '',
      limit: 20,
      reportType: '',
      reportUserId: '',
      reportedUserId: '',
      startTime: '',
      sysOrigin: DEFAULT_SYS_ORIGIN,
      updateUserId: '',
    },
    expandable: (record) => [
      {
        label: '举报关系',
        value: `${record.reportUser?.userNickname || '-'} 举报 ${
          record.reportedUser?.userNickname || '-'
        }，类型 ${record.reportTypeName || '-'}`,
      },
      {
        label: '举报图片',
        type: 'images',
        value: splitCsv(record.imageUrls),
      },
      {
        label: '举报视频',
        type: 'videos',
        value: splitCsv(record.videoUrls),
      },
      {
        label: '举报内容',
        value: record.reportedContent || '-',
      },
      ...(record.updateNickname
        ? [{ label: '最近处理人', value: record.updateNickname }]
        : []),
    ],
    fetch: getReportedPage,
    filters: [
      { field: 'sysOrigin', label: '系统', placeholder: '系统', type: 'sysOrigin' },
      {
        field: 'approvalStatus',
        label: '状态',
        options: REPORT_STATUS_OPTIONS,
        placeholder: '状态',
        type: 'select',
      },
      {
        clearable: true,
        field: 'reportType',
        label: '举报类型',
        options: REPORT_TYPE_OPTIONS,
        placeholder: '举报类型',
        type: 'select',
      },
      {
        field: 'reportUserId',
        label: '举报人ID',
        placeholder: '举报人ID',
        type: 'input',
      },
      {
        field: 'reportedUserId',
        label: '被举报人ID',
        placeholder: '被举报人ID',
        type: 'input',
      },
      {
        endField: 'endTime',
        label: '时间范围',
        placeholder: '时间范围',
        startField: 'startTime',
        type: 'dateRange',
      },
      {
        clearable: true,
        field: 'updateUserId',
        label: '后台成员',
        placeholder: '后台成员',
        type: 'member',
      },
    ],
    kind: 'table',
    rowActions: (record) => [
      {
        label: '账号处理',
        type: 'account',
        value: record.reportedUser?.id,
      },
    ],
    selectable: (query) => query.approvalStatus === 0,
    title: '举报管理',
  },
  '/approval/manager/feedback': {
    actions: [
      {
        execute: async (records) => {
          await batchProcessFeedback({
            processFeedbacks: records.map((record) => ({
              approvalRemarks: '感谢您的反馈意见',
              approvalStatus: 1,
              id: record.id,
              userId: record.userId,
            })),
          });
        },
        label: '批量处理',
        show: (query) => query.approvalStatus === 0,
        type: 'primary',
      },
    ],
    columns: [
      {
        key: 'sysOrigin',
        render: (record) => ({
          text: record.sysOrigin || '-',
          type: 'origin',
        }),
        title: '系统',
        width: 90,
      },
      {
        key: 'user',
        render: (record) =>
          record.userProfile
            ? {
                text: `${record.userProfile.userNickname || '-'} / ${
                  record.userProfile.actualAccount || record.userProfile.id || '-'
                }`,
                type: 'user-profile',
                userId: record.userProfile.id,
              }
            : {
                text: '未登录',
                type: 'text',
              },
        title: '反馈用户',
      },
      {
        key: 'approvalStatus',
        render: (record) => ({
          color: record.approvalStatus === 1 ? 'success' : 'default',
          text: record.approvalStatus === 1 ? '已处理' : '未处理',
          type: 'tag',
        }),
        title: '处理状态',
        width: 120,
      },
      {
        key: 'createTime',
        render: (record) => ({ text: record.createTime || '-', type: 'text' }),
        title: '创建时间',
        width: 180,
      },
      {
        key: 'updateTime',
        render: (record) => ({ text: record.updateTime || '-', type: 'text' }),
        title: '修改时间',
        width: 180,
      },
    ],
    defaultQuery: {
      approvalStatus: 0,
      cursor: 1,
      limit: 20,
      sysOrigin: DEFAULT_SYS_ORIGIN,
      updateUserId: '',
      userId: '',
    },
    expandable: (record) => [
      { label: '截图', type: 'images', value: splitCsv(record.imageUrls) },
      { label: '视频', type: 'videos', value: splitCsv(record.videoUrls) },
      { label: '手机型号', value: record.originPhoneModel || '-' },
      { label: 'App版本', value: record.appVersion || '-' },
      { label: '设备号', value: record.imei || '-' },
      { label: '反馈内容', value: record.content || '-' },
      ...(record.approvalRemarks
        ? [{ label: '备注', value: record.approvalRemarks }]
        : []),
      ...(record.updateNickname
        ? [{ label: '最近处理人', value: record.updateNickname }]
        : []),
    ],
    fetch: getFeedbackPage,
    filters: [
      { field: 'sysOrigin', label: '归属系统', placeholder: '归属系统', type: 'sysOrigin' },
      { field: 'userId', label: '反馈用户ID', placeholder: '反馈用户ID', type: 'input' },
      {
        clearable: true,
        field: 'approvalStatus',
        label: '审核状态',
        options: FEEDBACK_STATUS_OPTIONS,
        placeholder: '审核状态',
        type: 'select',
      },
      {
        clearable: true,
        field: 'updateUserId',
        label: '后台成员',
        placeholder: '后台成员',
        type: 'member',
      },
    ],
    kind: 'table',
    rowActions: (record) =>
      record.approvalStatus === 0
        ? [{ label: '处理', type: 'feedback', value: record.id }]
        : [],
    selectable: (query) => query.approvalStatus === 0,
    title: '意见反馈',
  },
  '/approval/manager/not_pass_history/table': {
    buildTimeline: (record) => {
      const operator =
        record.originType
          ? record.approvalUserBaseInfo?.userNickname
          : record.approvalNickname;
      const target = record.userBaseInfo?.userNickname || '-';
      const contentType =
        record.violationType === 'AVATAR' ||
        record.violationType === 'PHOTO_WALL' ||
        record.violationType === 'ROOM_AVATAR'
          ? 'images'
          : record.violationType === 'LIVE' ||
              record.violationType === 'SHORT_VIDEO'
            ? 'videos'
            : 'text';
      return {
        content:
          contentType === 'text' ? record.content || '-' : splitCsv(record.content),
        contentType,
        extras: [
          ...(record.labelNames && record.labelNames !== '-'
            ? [`机器标签：${record.labelNames}`]
            : []),
          ...(record.description ? [`审核描述：${record.description}`] : []),
        ],
        tag: `${record.violationTypeName || '-'} ${record.approvalResultName || '-'}`,
        time: record.createTime || '-',
        title: `${operator || '-'} 审批 ${target}`,
      };
    },
    defaultQuery: {
      cursor: 1,
      endDateTime: '',
      limit: 20,
      startDateTime: '',
      userId: '',
      violationType: '',
    },
    fetch: getViolationHistoryPage,
    filters: [
      {
        endField: 'endDateTime',
        label: '时间范围',
        placeholder: '时间范围',
        startField: 'startDateTime',
        type: 'dateRange',
      },
      { field: 'userId', label: '用户ID', placeholder: '用户ID', type: 'input' },
      {
        clearable: true,
        field: 'violationType',
        label: '审批类型',
        options: APPROVAL_TYPE_OPTIONS,
        placeholder: '审批类型',
        type: 'select',
      },
    ],
    kind: 'history',
    title: '违规历史记录',
  },
  '/approval/manager/family/approval': {
    kind: 'family',
    tabs: {
      FAMILY_AVATAR: {
        label: '家族头像审批',
        page: {
          actions: [
            buildApprovalDataAction('FAMILY_AVATAR', 'PASS', (record) => ({
              content: record.familyAvatar,
              contentId: record.userId,
              familyId: record.familyId,
              tags: record.machineLabel,
              userId: record.userId,
            })),
            familyNotPassAction('FAMILY_AVATAR', (record) => ({
              content: record.familyAvatar,
              contentId: record.userId,
              familyId: record.familyId,
              tags: record.machineLabel,
              userId: record.userId,
            })),
          ],
          buildCard: (record) => ({
            actions: [
              { label: '编辑用户', type: 'edit', value: record.userId },
              { label: '账号处理', type: 'account', value: record.userId },
            ],
            galleryImages: splitCsv(record.familyAvatar),
            lines: [
              `家族ID：${record.familyId || '-'}`,
              `家族账号：${record.familyAccount || '-'}`,
            ],
            overlay: record.machineLabel || '',
            title: record.userBaseInfo?.userNickname || '-',
            titleUserId: record.userId,
          }),
          defaultQuery: {
            approveStatus: 'PENDING',
            approveType: 'FAMILY_AVATAR',
            cursor: 1,
            endDateTime: '',
            limit: 30,
            startDateTime: '',
            sysOrigin: DEFAULT_SYS_ORIGIN,
            userId: '',
          },
          fetch: getFamilyApprovalPage,
          filters: [
            { field: 'sysOrigin', label: '归属系统', placeholder: '归属系统', type: 'sysOrigin' },
            {
              field: 'approveStatus',
              label: '审批状态',
              options: COMMON_APPROVAL_OPTIONS,
              placeholder: '审批状态',
              type: 'select',
            },
            {
              endField: 'endDateTime',
              label: '时间范围',
              placeholder: '时间范围',
              startField: 'startDateTime',
              type: 'dateRange',
            },
            { field: 'userId', label: '用户ID', placeholder: '用户ID', type: 'input' },
          ],
          kind: 'gallery',
          selectable: (query) => query.approveStatus === 'PENDING',
          title: '家族头像审批',
        },
      },
      FAMILY_NICKNAME: {
        label: '家族名称审批',
        page: {
          actions: [
            buildApprovalDataAction('FAMILY_NICKNAME', 'PASS', (record) => ({
              content: record.userNickname,
              contentId: record.userId,
              familyId: record.familyId,
              userId: record.userId,
            })),
            familyNotPassAction('FAMILY_NICKNAME', (record) => ({
              content: record.userNickname,
              contentId: record.userId,
              familyId: record.familyId,
              userId: record.userId,
            })),
          ],
          columns: [
            {
              key: 'familyAccount',
              render: (record) => ({
                text: record.familyAccount || '-',
                type: 'text',
              }),
              title: '家族账号',
              width: 180,
            },
            {
              key: 'familyName',
              render: (record) => ({
                text: record.familyName || '-',
                type: 'text',
              }),
              title: '家族昵称',
            },
            {
              key: 'updateTime',
              render: (record) => ({
                text: record.updateTime || '-',
                type: 'text',
              }),
              title: '修改时间',
              width: 180,
            },
          ],
          defaultQuery: {
            approveStatus: 'PENDING',
            approveType: 'FAMILY_NICKNAME',
            cursor: 1,
            endDateTime: '',
            limit: 30,
            startDateTime: '',
            sysOrigin: DEFAULT_SYS_ORIGIN,
            userId: '',
          },
          fetch: getFamilyApprovalPage,
          filters: [
            { field: 'sysOrigin', label: '归属系统', placeholder: '归属系统', type: 'sysOrigin' },
            {
              endField: 'endDateTime',
              label: '时间范围',
              placeholder: '时间范围',
              startField: 'startDateTime',
              type: 'dateRange',
            },
            { field: 'userId', label: '用户ID', placeholder: '用户ID', type: 'input' },
            {
              field: 'approveStatus',
              label: '审批状态',
              options: COMMON_APPROVAL_OPTIONS,
              placeholder: '审批状态',
              type: 'select',
            },
          ],
          kind: 'table',
          rowActions: (record) => [
            { label: '用户详情', type: 'details', value: record.userId },
            { label: '账号处理', type: 'account', value: record.userId },
          ],
          selectable: (query) => query.approveStatus === 'PENDING',
          title: '家族名称审批',
        },
      },
      FAMILY_NOTICE: {
        label: '家族公告审批',
        page: {
          actions: [
            buildApprovalDataAction('FAMILY_NOTICE', 'PASS', (record) => ({
              content: record.userNickname,
              contentId: record.userId,
              familyId: record.familyId,
              userId: record.userId,
            })),
            familyNotPassAction('FAMILY_NOTICE', (record) => ({
              content: record.userNickname,
              contentId: record.userId,
              familyId: record.familyId,
              userId: record.userId,
            })),
          ],
          columns: [
            {
              key: 'familyAccount',
              render: (record) => ({
                text: record.familyAccount || '-',
                type: 'text',
              }),
              title: '家族账号',
              width: 180,
            },
            {
              key: 'familyNotice',
              render: (record) => ({
                text: record.familyNotice || '-',
                type: 'text',
              }),
              title: '家族公告',
            },
            {
              key: 'updateTime',
              render: (record) => ({
                text: record.updateTime || '-',
                type: 'text',
              }),
              title: '修改时间',
              width: 180,
            },
          ],
          defaultQuery: {
            approveStatus: 'PENDING',
            approveType: 'FAMILY_NOTICE',
            cursor: 1,
            endDateTime: '',
            limit: 30,
            startDateTime: '',
            sysOrigin: DEFAULT_SYS_ORIGIN,
            userId: '',
          },
          fetch: getFamilyApprovalPage,
          filters: [
            { field: 'sysOrigin', label: '归属系统', placeholder: '归属系统', type: 'sysOrigin' },
            {
              endField: 'endDateTime',
              label: '时间范围',
              placeholder: '时间范围',
              startField: 'startDateTime',
              type: 'dateRange',
            },
            { field: 'userId', label: '用户ID', placeholder: '用户ID', type: 'input' },
            {
              field: 'approveStatus',
              label: '审批状态',
              options: COMMON_APPROVAL_OPTIONS,
              placeholder: '审批状态',
              type: 'select',
            },
          ],
          kind: 'table',
          rowActions: (record) => [
            { label: '用户详情', type: 'details', value: record.userId },
            { label: '账号处理', type: 'account', value: record.userId },
          ],
          selectable: (query) => query.approveStatus === 'PENDING',
          title: '家族公告审批',
        },
      },
    },
    title: '家族审批',
  },
  '/approval/manager/dynamic/content/approval': {
    actions: [
      {
        execute: async (records) => {
          await approveDynamicContentPass(records.map((record) => record.dynamicId));
        },
        label: '鉴定通过',
        show: (query) => query.approveStatus === 'PENDING',
        type: 'primary',
      },
      {
        execute: async (records) => {
          await approveDynamicContentNotPass(
            records.map((record) => record.dynamicId),
          );
        },
        label: '鉴定违规',
        show: (query) =>
          query.approveStatus === 'PENDING' || query.approveStatus === 'PASS',
        type: 'danger',
      },
    ],
    buildCard: (record, query) => ({
      actions: [{ label: '账号处理', type: 'account', value: record.userId }],
      galleryImages: (record.pictures || [])
        .map((item: any) => item.resourceUrl)
        .filter(Boolean),
      leadText: record.dynamicContent || '',
      lines: [
        `性别：${record.userSexName || record.userBaseInfo?.userSexName || '-'}`,
        `年龄：${record.userBaseInfo?.age || '-'}`,
        `创建时间：${record.createTime || '-'}`,
        ...(query.approveStatus !== 'PENDING'
          ? [`审批时间：${record.updateTime || '-'}`]
          : []),
      ],
      overlay:
        (record.pictures || [])
          .map((item: any) => item.labelNames)
          .filter(Boolean)
          .join(' / ') || '',
      title: record.userBaseInfo?.userNickname || '-',
      titleUserId: record.userId,
    }),
    defaultQuery: {
      approveStatus: 'PENDING',
      cursor: 1,
      endDateTime: '',
      limit: 20,
      startDateTime: '',
      sysOrigin: DEFAULT_SYS_ORIGIN,
      userId: '',
    },
    fetch: getDynamicContentPage,
    filters: [
      { field: 'sysOrigin', label: '系统', placeholder: '系统', type: 'sysOrigin' },
      {
        field: 'approveStatus',
        label: '审核',
        options: COMMON_APPROVAL_ALL_OPTIONS,
        placeholder: '审核',
        type: 'select',
      },
      {
        endField: 'endDateTime',
        label: '时间范围',
        placeholder: '时间范围',
        startField: 'startDateTime',
        type: 'dateRange',
      },
      { field: 'userId', label: '用户ID', placeholder: '用户ID', type: 'input' },
    ],
    kind: 'gallery',
    selectable: (query) =>
      query.approveStatus === 'PENDING' || query.approveStatus === 'PASS',
    title: '动态内容审批',
  },
  '/approval/manager/dynamic/report': {
    actions: [
      {
        execute: async (records) => {
          await processDynamicReport({
            approvalStatus: 2,
            contentIds: records.map((record) => record.dynamicContentId),
          });
        },
        label: '正常',
        show: (query) => query.approvalStatus === 0,
        type: 'primary',
      },
      {
        execute: async (records) => {
          await processDynamicReport({
            approvalStatus: 1,
            contentIds: records.map((record) => record.dynamicContentId),
          });
        },
        label: '违规',
        show: (query) => query.approvalStatus === 0,
        type: 'danger',
      },
    ],
    columns: [
      {
        key: 'sysOrigin',
        render: (record) => ({
          text: record.sysOrigin || '-',
          type: 'origin',
        }),
        title: '系统',
        width: 90,
      },
      {
        key: 'reportUser',
        render: (record) => ({
          text: record.reportUser?.userNickname || '-',
          type: 'link',
          userId: record.reportUser?.id,
        }),
        title: '举报人',
      },
      {
        key: 'reportedUser',
        render: (record) => ({
          text: record.reportedUser?.userNickname || '-',
          type: 'link',
          userId: record.reportedUser?.id,
        }),
        title: '被举报人',
      },
      {
        key: 'reportType',
        render: (record) => ({
          text:
            REPORT_TYPE_OPTIONS.find((item) => item.value === record.reportType)
              ?.label || '-',
          type: 'text',
        }),
        title: '举报类型',
      },
      {
        key: 'dynamicContent',
        render: (record) => ({
          text: record.dynamicContent || '-',
          type: 'text',
        }),
        title: '动态内容',
      },
      {
        key: 'time',
        render: (record) => ({
          text:
            record.createTime && record.updateTime
              ? `${record.createTime} / ${record.updateTime}`
              : record.createTime || '-',
          type: 'text',
        }),
        title: '时间',
        width: 240,
      },
    ],
    defaultQuery: {
      approvalStatus: 0,
      cursor: 1,
      endTime: '',
      limit: 20,
      reportType: '',
      reportUserId: '',
      reportedUserId: '',
      startTime: '',
      sysOrigin: DEFAULT_SYS_ORIGIN,
    },
    expandable: (record) => [
      { label: '举报图片', type: 'images', value: splitCsv(record.reportedUrls) },
      {
        label: '动态图片',
        type: 'images',
        value: (record.dynamicPictures || [])
          .map((item: any) => item.resourceUrl)
          .filter(Boolean),
      },
      { label: '举报内容', value: record.reportedContent || '-' },
    ],
    fetch: getDynamicReportPage,
    filters: [
      { field: 'sysOrigin', label: '系统', placeholder: '系统', type: 'sysOrigin' },
      {
        field: 'approvalStatus',
        label: '状态',
        options: DYNAMIC_REPORT_STATUS_OPTIONS,
        placeholder: '状态',
        type: 'select',
      },
      {
        clearable: true,
        field: 'reportType',
        label: '举报类型',
        options: REPORT_TYPE_OPTIONS,
        placeholder: '举报类型',
        type: 'select',
      },
      {
        field: 'reportUserId',
        label: '举报人ID',
        placeholder: '举报人ID',
        type: 'input',
      },
      {
        field: 'reportedUserId',
        label: '被举报人ID',
        placeholder: '被举报人ID',
        type: 'input',
      },
      {
        endField: 'endTime',
        label: '时间范围',
        placeholder: '时间范围',
        startField: 'startTime',
        type: 'dateRange',
      },
    ],
    kind: 'table',
    rowActions: (record) => [
      {
        label: '被举报账号处理',
        type: 'account',
        value: record.reportedUser?.id,
      },
    ],
    selectable: (query) => query.approvalStatus === 0,
    title: '动态举报审批',
  },
  '/approval/manager/user/bank-card/approval': {
    actions: [
      {
        execute: async (records) => {
          await approveUserBankCardPass(records.map((record) => record.id));
        },
        label: '鉴定通过',
        show: (query) => query.status === 'PENDING',
        type: 'primary',
      },
      {
        execute: async (records) => {
          await approveUserBankCardNotPass(records.map((record) => record.id));
        },
        label: '鉴定违规',
        show: (query) => query.status === 'PENDING',
        type: 'danger',
      },
    ],
    columns: [
      {
        key: 'cardNo',
        render: (record) => ({ text: record.cardNo || '-', type: 'text' }),
        title: '卡号',
      },
      {
        key: 'payee',
        render: (record) => ({ text: record.payee || '-', type: 'text' }),
        title: '收款人',
      },
      {
        key: 'cardName',
        render: (record) => ({ text: record.cardName || '-', type: 'text' }),
        title: '银行',
      },
      {
        key: 'cardType',
        render: (record) => ({ text: record.cardType || '-', type: 'text' }),
        title: '卡片类型',
      },
      {
        key: 'userProfile',
        render: (record) => ({
          text: `${record.userProfile?.userNickname || '-'} / ${
            record.userProfile?.actualAccount || '-'
          }`,
          type: 'user-profile',
          userId: record.userProfile?.id,
        }),
        title: '归属人',
      },
      {
        key: 'status',
        render: (record) => ({
          color:
            record.status === 'PENDING'
              ? 'default'
              : record.status === 'PASS'
                ? 'success'
                : 'error',
          text:
            record.status === 'PENDING'
              ? '待审核'
              : record.status === 'PASS'
                ? '通过'
                : '驳回',
          type: 'tag',
        }),
        title: '状态',
        width: 120,
      },
      {
        key: 'createTime',
        render: (record) => ({ text: record.createTime || '-', type: 'text' }),
        title: '创建时间',
        width: 180,
      },
    ],
    defaultQuery: {
      cardType: '',
      cursor: 1,
      limit: 30,
      ownUserId: '',
      status: 'PENDING',
      sysOrigin: DEFAULT_SYS_ORIGIN,
    },
    fetch: getUserBankCardPage,
    filters: [
      { field: 'sysOrigin', label: '归属系统', placeholder: '归属系统', type: 'sysOrigin' },
      { field: 'ownUserId', label: '归属人ID', placeholder: '归属人ID', type: 'input' },
      {
        field: 'status',
        label: '审批状态',
        options: COMMON_APPROVAL_ALL_OPTIONS,
        placeholder: '审批状态',
        type: 'select',
      },
      {
        clearable: true,
        field: 'cardType',
        label: '银行类型',
        options: BANK_CARD_OPTIONS,
        placeholder: '银行类型',
        type: 'select',
      },
    ],
    kind: 'table',
    rowActions: (record) => [
      { label: '用户详情', type: 'details', value: record.userProfile?.id },
      { label: '账号处理', type: 'account', value: record.userProfile?.id },
    ],
    selectable: (query) => query.status === 'PENDING',
    title: '用户银行卡审批',
  },
};

export {
  APPROVAL_TYPE_OPTIONS,
  BANK_CARD_OPTIONS,
  DYNAMIC_REPORT_STATUS_OPTIONS,
  FEEDBACK_STATUS_OPTIONS,
  PHOTO_WALL_STATUS_OPTIONS,
  REPORT_STATUS_OPTIONS,
  REPORT_TYPE_OPTIONS,
  SYS_ORIGIN_OPTIONS,
  approvalPages,
};
