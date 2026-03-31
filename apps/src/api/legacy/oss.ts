import OSS from 'ali-oss';

import { requestClient } from '#/api/request';

export const OSS_FILE_BUCKETS = {
  apk: 'apk',
  avatar: 'avatar',
  back: 'back',
  feedback: 'feedback',
  other: 'other',
  startPage: 'start_page',
  svgaCover: 'svga_cover',
  svgasource: 'svgasource',
} as const;

const OSS_BUCKET = import.meta.env.VITE_GLOB_OSS_BUCKET || 'tkm-likei';
const OSS_URL = import.meta.env.VITE_GLOB_OSS_URL || '';

export function randomFilename(filename?: string) {
  const suffix = filename ? filename.slice(filename.lastIndexOf('.')) : '';
  const uuid =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `manager-${uuid}${suffix}`;
}

export const radmonFilename = randomFilename;

export function getAccessImgUrl(key?: string) {
  if (!key) {
    return '';
  }
  if (/^https?:\/\//.test(key)) {
    return key;
  }
  if (key.startsWith('/')) {
    return `${OSS_URL}${key}`;
  }
  return `${OSS_URL}/${key}`;
}

export async function getOssSts() {
  return requestClient.get<Record<string, string>>('/ali-yun/oss/sts');
}

export async function simpleUploadFile(
  file: File,
  dir: string = OSS_FILE_BUCKETS.other,
  customFilename?: string,
) {
  const stsResult = await getOssSts();
  const client = new OSS({
    accessKeyId: stsResult.AccessKeyId,
    accessKeySecret: stsResult.AccessKeySecret,
    bucket: OSS_BUCKET,
    endpoint: 'oss-accelerate.aliyuncs.com',
    stsToken: stsResult.SecurityToken,
  });
  const filename = customFilename || randomFilename(file.name);
  return client.put(`${dir}/${filename}`, file);
}
