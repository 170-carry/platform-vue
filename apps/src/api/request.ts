/**
 * 该文件可自行根据业务逻辑进行调整
 */
import type { RequestClientOptions } from '@vben/request';

import { useAppConfig } from '@vben/hooks';
import { preferences } from '@vben/preferences';
import {
  errorMessageResponseInterceptor,
  RequestClient,
} from '@vben/request';
import { useAccessStore } from '@vben/stores';

import { message } from 'antdv-next';

import { useAuthStore } from '#/store';

const { apiURL: rawApiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);
const apiURL =
  import.meta.env.DEV && rawApiURL === '/console'
    ? 'http://127.0.0.1:2700/console'
    : rawApiURL;

function createRequestClient(baseURL: string, options?: RequestClientOptions) {
  const client = new RequestClient({
    ...options,
    baseURL,
  });

  /**
   * 重新认证逻辑
   */
  async function doReAuthenticate() {
    console.warn('Access token or refresh token is invalid or expired. ');
    const accessStore = useAccessStore();
    const authStore = useAuthStore();
    accessStore.setAccessToken(null);
    if (
      preferences.app.loginExpiredMode === 'modal' &&
      accessStore.isAccessChecked
    ) {
      accessStore.setLoginExpired(true);
    } else {
      await authStore.logout();
    }
  }

  function formatToken(token: null | string) {
    return token ? `Bearer ${token}` : null;
  }

  // 请求头处理
  client.addRequestInterceptor({
    fulfilled: async (config) => {
      const accessStore = useAccessStore();
      const accessToken = accessStore.accessToken;
      if (accessToken) {
        config.headers.Authorization = formatToken(accessToken);
      } else {
        delete config.headers.Authorization;
      }
      config.headers['Accept-Language'] = preferences.app.locale;
      config.headers['Req-Client'] = 'Ops';
      config.headers['Req-Version'] = 'v2';
      return config;
    },
  });

  client.addResponseInterceptor(
    {
      fulfilled: async (response) => {
        const { config, data, status } = response;

        if (config.responseReturn === 'raw') {
          return response;
        }

        if (data instanceof Blob) {
          return data;
        }

        if (status !== 200) {
          throw Object.assign(new Error(data?.errorMsg || 'Error'), {
            response,
          });
        }

        if (config.responseReturn === 'body') {
          return data;
        }

        if (data?.errorCode === 401) {
          await doReAuthenticate();
          throw Object.assign(new Error(data?.errorMsg || 'Unauthorized'), {
            response,
          });
        }

        if (data?.errorCode !== 0) {
          throw Object.assign(new Error(data?.errorMsg || 'Error'), {
            response,
          });
        }

        return data?.body;
      },
    },
  );

  client.addResponseInterceptor(
    errorMessageResponseInterceptor((msg: string, error) => {
      const responseData = error?.response?.data ?? {};
      const errorMessage =
        responseData?.errorMsg ??
        responseData?.error ??
        responseData?.message ??
        error?.message ??
        '';
      message.error(errorMessage || msg);
    }),
  );

  return client;
}

export const requestClient = createRequestClient(apiURL, {
  responseReturn: 'data',
});

export const baseRequestClient = requestClient;
