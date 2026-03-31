import type { LegacyPageResult } from '#/api/legacy/system';

import { requestClient } from '#/api/request';

export async function pageAgentActivity(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/activity/agent-count/page',
    {
      params,
    },
  );
}

export async function pageRoomContribution(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/activity/room-contribution/page',
    {
      params,
    },
  );
}

export async function activityPicture(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/activity-picture/config',
    {
      params,
    },
  );
}

export async function updateActivityPicture(data: Record<string, any>) {
  return requestClient.put('/activity-picture/config', data);
}

export async function deleteActivityPicture(id: number | string) {
  return requestClient.delete(`/activity-picture/config/delete/${id}`);
}

export async function addActivityPicture(data: Record<string, any>) {
  return requestClient.post('/activity-picture/config', data);
}

export async function hallFameTable(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/activity/hall-fame/page',
    {
      params,
    },
  );
}

export async function addOrUpdateHallFame(data: Record<string, any>) {
  return requestClient.post('/activity/hall-fame/add-or-update', data);
}

export async function globalizationDelete(id: number | string) {
  return requestClient.get('/activity/globalization/description/del', {
    params: { id },
  });
}

export async function globalizationTable(id: number | string) {
  return requestClient.get<Array<Record<string, any>>>(
    '/activity/globalization/description/list',
    {
      params: { id },
    },
  );
}

export async function addOrUpdateGlobalization(data: Record<string, any>) {
  return requestClient.post(
    '/activity/globalization/description/add-or-update',
    data,
  );
}
