import { requestClient } from '#/api/request';

export async function newPush(data: Record<string, any>) {
  return requestClient.post('/push', data);
}

export async function messageCopywritingPage(params: Record<string, any>) {
  return requestClient.get<Record<string, any>>('/message/copywriting/page', {
    params,
  });
}

export async function pushTaskPage(params: Record<string, any>) {
  return requestClient.get<Record<string, any>>('/push/task/page', {
    params,
  });
}

export async function savePushTask(data: Record<string, any>) {
  return requestClient.post('/push/task/save', data);
}

export async function deletePushTask(id: number | string) {
  return requestClient.get(`/push/task/delete/${id}`);
}

export async function pushLogTable(params: Record<string, any>) {
  return requestClient.get<Record<string, any>>('/push/page', {
    params,
  });
}

export async function addMessageCopywriting(data: Record<string, any>) {
  return requestClient.post('/message/copywriting', data);
}

export async function removeMessageCopywriting(id: number | string) {
  return requestClient.delete(`/message/copywriting/${id}`);
}

export async function getPushTextHistory(id: number | string) {
  return requestClient.get<Array<Record<string, any>>>(
    `/sys/push/text/content/${id}`,
  );
}

export async function synchronPushText() {
  return requestClient.get('/sys/push/text/content/synchronize');
}
