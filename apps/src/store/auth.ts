import type { Recordable } from '@vben/types';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { defineStore } from 'pinia';

import { getUserInfoApi, loginApi, logoutApi } from '#/api';

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();

  const loginLoading = ref(false);

  /**
   * 异步处理登录操作
   * Asynchronously handle the login process
   * @param params 登录表单数据
   */
  async function authLogin(
    params: Recordable<any>,
    onSuccess?: () => Promise<void> | void,
  ) {
    try {
      loginLoading.value = true;
      const { accessToken } = await loginApi({
        password: String(params?.password ?? ''),
        username: String(params?.username ?? '').trim(),
      });

      if (accessToken) {
        accessStore.setAccessToken(accessToken);
        accessStore.setRefreshToken(null);
        accessStore.setAccessCodes([]);
        accessStore.setIsAccessChecked(false);
        userStore.setUserInfo(null);

        if (accessStore.loginExpired) {
          accessStore.setLoginExpired(false);
        }

        onSuccess
          ? await onSuccess?.()
          : await router.push(preferences.app.defaultHomePath);
      }
      return {
        userInfo: null,
      };
    } catch (error) {
      accessStore.setAccessToken(null);
      accessStore.setRefreshToken(null);
      accessStore.setAccessCodes([]);
      accessStore.setIsAccessChecked(false);
      userStore.setUserInfo(null);
      throw error;
    } finally {
      loginLoading.value = false;
    }
  }

  async function logout(redirect: boolean = true) {
    try {
      await logoutApi();
    } catch {
      // 不做任何处理
    }
    resetAllStores();
    accessStore.setLoginExpired(false);

    // 回登录页带上当前路由地址
    await router.replace({
      path: LOGIN_PATH,
      query: redirect
        ? {
            redirect: encodeURIComponent(router.currentRoute.value.fullPath),
          }
        : {},
    });
  }

  async function fetchUserInfo() {
    const userInfo = await getUserInfoApi();
    userStore.setUserInfo(userInfo);
    return userInfo;
  }

  function $reset() {
    loginLoading.value = false;
  }

  return {
    $reset,
    authLogin,
    fetchUserInfo,
    loginLoading,
    logout,
  };
});
