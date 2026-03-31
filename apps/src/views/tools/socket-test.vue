<script lang="ts" setup>
import { reactive } from 'vue';

import { Page } from '@vben/common-ui';

import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

import {
  Button,
  Card,
  Form,
  FormItem,
  Input,
  Space,
  TextArea,
  message,
} from 'antdv-next';

defineOptions({ name: 'ToolsSocketTest' });

type SocketFormField =
  | 'content'
  | 'meUserId'
  | 'repositoryData'
  | 'repositoryEndpoint'
  | 'sendEndpoint'
  | 'socketEndpoint'
  | 'subscribePatch'
  | 'subscribeUserPreffix'
  | 'targetUser';

interface SocketFormState {
  content: string;
  meUserId: string;
  message: string;
  msgContents: string[];
  repositoryData: string;
  repositoryEndpoint: string;
  ruleFormName: string;
  sendEndpoint: string;
  socketEndpoint: string;
  stompClient: null | ReturnType<typeof Stomp.over>;
  subscribePatch: string;
  subscribeUserPreffix: string;
  targetUser: string;
}

const DEFAULT_SOCKET_ENDPOINT = 'http://192.168.31.179:9000/socket_stomp/game';

const socketSubForm = reactive<SocketFormState>({
  content: '',
  meUserId: '',
  message: '',
  msgContents: [],
  repositoryData: '',
  repositoryEndpoint: '/app/repository_add',
  ruleFormName: 'socketSubForm',
  sendEndpoint: '/app/send_topic',
  socketEndpoint: DEFAULT_SOCKET_ENDPOINT,
  stompClient: null,
  subscribePatch: '/topic',
  subscribeUserPreffix: '',
  targetUser: '',
});

const socketToUserForm = reactive<SocketFormState>({
  content: '',
  meUserId: '',
  message: '',
  msgContents: [],
  repositoryData: '',
  repositoryEndpoint: '',
  ruleFormName: 'socketToUserForm',
  sendEndpoint: '/app/send_queue',
  socketEndpoint: DEFAULT_SOCKET_ENDPOINT,
  stompClient: null,
  subscribePatch: '/queue',
  subscribeUserPreffix: '/user',
  targetUser: '',
});

const fieldLabels: Record<SocketFormField, string> = {
  content: '消息内容',
  meUserId: '我的token',
  repositoryData: '仓库数据',
  repositoryEndpoint: '仓库端点',
  sendEndpoint: '发送接口',
  socketEndpoint: '连接端点',
  subscribePatch: '订阅地址',
  subscribeUserPreffix: '订阅前缀',
  targetUser: '接收用户ID',
};

function ensureFields(
  form: SocketFormState,
  fields: SocketFormField[],
) {
  for (const field of fields) {
    if (!String(form[field] || '').trim()) {
      message.warning(`请输入${fieldLabels[field]}`);
      return false;
    }
  }
  return true;
}

function createConnect(form: SocketFormState) {
  const requiredFields: SocketFormField[] = [
    'socketEndpoint',
    'subscribePatch',
    'sendEndpoint',
    'meUserId',
  ];
  if (form.ruleFormName === 'socketToUserForm') {
    requiredFields.push('subscribeUserPreffix', 'targetUser');
  }
  if (!ensureFields(form, requiredFields)) {
    return;
  }

  const socket = new SockJS(
    `${form.socketEndpoint}?token=${form.meUserId}&destination=${form.subscribePatch}`,
  );
  form.stompClient = Stomp.over(socket);
  form.stompClient.connect(
    {},
    () => {
      form.message = '连接成功';
      message.success('连接成功');
    },
    (error) => {
      form.message = '连接失败';
      message.error(String(error || '连接失败'));
    },
  );
}

function subscribeSocket(form: SocketFormState) {
  if (!form.stompClient) {
    message.error('请先进行连接.');
    return;
  }
  form.message = form.subscribePatch;
  form.stompClient.subscribe(
    form.subscribeUserPreffix
      ? form.subscribeUserPreffix + form.subscribePatch
      : form.subscribePatch,
    (responseBody) => {
      try {
        const receiveMessage = JSON.parse(responseBody.body || '{}');
        form.msgContents.push(String(receiveMessage.content || ''));
      } catch {
        form.msgContents.push(String(responseBody.body || ''));
      }
    },
  );
}

function disconnect(form: SocketFormState) {
  if (!form.stompClient) {
    return;
  }
  form.stompClient.disconnect(() => {
    form.message = '断开连接';
  });
}

function sendMessage(form: SocketFormState) {
  if (!form.stompClient) {
    message.error('请先创建连接.');
    return;
  }
  if (!form.content) {
    message.error('请输入消息内容.');
    return;
  }
  const payload = {
    content: form.content,
    destination: form.subscribePatch,
    targetUser: form.targetUser,
  };
  form.stompClient.send(form.sendEndpoint, {}, JSON.stringify(payload));
}

function addRepository(form: SocketFormState) {
  if (!form.stompClient) {
    message.error('请先创建连接.');
    return;
  }
  if (!form.repositoryData) {
    message.error('请输入消息内容.');
    return;
  }
  const payload = {
    body: form.repositoryData,
    key: 'TEST',
  };
  form.stompClient.send(form.repositoryEndpoint, {}, JSON.stringify(payload));
}
</script>

<template>
  <Page title="Socket测试">
    <div class="socket-grid">
      <Card title="订阅广播消息">
        <template #extra>
          <Space wrap>
            <Button type="primary" @click="createConnect(socketSubForm)">进行连接</Button>
            <Button danger @click="disconnect(socketSubForm)">断开连接</Button>
            <Button @click="subscribeSocket(socketSubForm)">订阅主题</Button>
            <Button @click="sendMessage(socketSubForm)">发送消息</Button>
            <Button @click="addRepository(socketSubForm)">添加仓库</Button>
          </Space>
        </template>

        <div class="card-tip">创建连接 -> 订阅主题 -> 发送消息</div>

        <Form layout="vertical">
          <FormItem label="连接端点">
            <Input v-model:value="socketSubForm.socketEndpoint" placeholder="连接端点" />
          </FormItem>
          <FormItem label="订阅地址">
            <Input v-model:value="socketSubForm.subscribePatch" placeholder="订阅地址" />
          </FormItem>
          <FormItem label="发送接口">
            <Input v-model:value="socketSubForm.sendEndpoint" placeholder="发送接口" />
          </FormItem>
          <FormItem label="我的token">
            <Input v-model:value="socketSubForm.meUserId" placeholder="我的token" />
          </FormItem>
          <FormItem label="消息内容">
            <TextArea
              v-model:value="socketSubForm.content"
              :maxlength="300"
              :rows="4"
              placeholder="消息内容"
              show-count
            />
          </FormItem>
          <FormItem label="仓库端点">
            <Input v-model:value="socketSubForm.repositoryEndpoint" placeholder="仓库端点" />
          </FormItem>
          <FormItem label="仓库数据">
            <TextArea
              v-model:value="socketSubForm.repositoryData"
              :maxlength="300"
              :rows="4"
              placeholder="插入仓库数据"
              show-count
            />
          </FormItem>
          <FormItem label="状态描述">
            <div class="status-panel">{{ socketSubForm.message || '-' }}</div>
          </FormItem>
          <FormItem label="消息内容">
            <div class="message-panel">
              <div
                v-for="(item, index) in socketSubForm.msgContents"
                :key="`${item}-${index}`"
                class="message-row"
              >
                {{ item }}
              </div>
            </div>
          </FormItem>
        </Form>
      </Card>

      <Card title="点对点">
        <template #extra>
          <Space wrap>
            <Button type="primary" @click="createConnect(socketToUserForm)">进行连接</Button>
            <Button danger @click="disconnect(socketToUserForm)">断开连接</Button>
            <Button @click="subscribeSocket(socketToUserForm)">订阅主题</Button>
            <Button @click="sendMessage(socketToUserForm)">发送消息</Button>
          </Space>
        </template>

        <div class="card-tip">创建连接 -> 订阅主题 -> 发送消息</div>

        <Form layout="vertical">
          <FormItem label="连接端点">
            <Input v-model:value="socketToUserForm.socketEndpoint" placeholder="连接端点" />
          </FormItem>
          <FormItem label="订阅前缀">
            <Input v-model:value="socketToUserForm.subscribeUserPreffix" placeholder="订阅前缀" />
          </FormItem>
          <FormItem label="订阅地址">
            <Input v-model:value="socketToUserForm.subscribePatch" placeholder="订阅地址" />
          </FormItem>
          <FormItem label="发送接口">
            <Input v-model:value="socketToUserForm.sendEndpoint" placeholder="发送接口" />
          </FormItem>
          <FormItem label="我的token">
            <Input v-model:value="socketToUserForm.meUserId" placeholder="我的token" />
          </FormItem>
          <FormItem label="接收用户ID">
            <Input v-model:value="socketToUserForm.targetUser" placeholder="接收用户，长ID" />
          </FormItem>
          <FormItem label="消息内容">
            <TextArea
              v-model:value="socketToUserForm.content"
              :maxlength="300"
              :rows="4"
              placeholder="消息内容"
              show-count
            />
          </FormItem>
          <FormItem label="状态描述">
            <div class="status-panel">{{ socketToUserForm.message || '-' }}</div>
          </FormItem>
          <FormItem label="消息内容">
            <div class="message-panel">
              <div
                v-for="(item, index) in socketToUserForm.msgContents"
                :key="`${item}-${index}`"
                class="message-row"
              >
                {{ item }}
              </div>
            </div>
          </FormItem>
        </Form>
      </Card>
    </div>
  </Page>
</template>

<style scoped>
.socket-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.card-tip {
  color: #64748b;
  margin-bottom: 16px;
}

.status-panel,
.message-panel {
  background: #f8fafc;
  border: 1px solid rgb(148 163 184 / 18%);
  border-radius: 14px;
  color: #334155;
}

.status-panel {
  min-height: 44px;
  padding: 10px 14px;
}

.message-panel {
  max-height: 220px;
  min-height: 180px;
  overflow: auto;
  padding: 12px 14px;
}

.message-row + .message-row {
  border-top: 1px solid rgb(148 163 184 / 15%);
  margin-top: 8px;
  padding-top: 8px;
}

@media (width <= 1200px) {
  .socket-grid {
    grid-template-columns: 1fr;
  }
}
</style>
