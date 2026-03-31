import { requestClient } from '#/api/request';

export namespace AuthApi {
  /** 登录接口参数 */
  export interface LoginParams {
    password?: string;
    username?: string;
  }

  /** 修改当前账号密码参数 */
  export interface UpdatePasswordParams {
    newPassword: string;
    oldPassword: string;
    rePassword: string;
  }

  /** 登录接口返回值 */
  export interface LoginResult {
    accessToken: string;
    userId: string;
  }
}

/**
 * 登录
 */
export async function loginApi(data: AuthApi.LoginParams) {
  const result = await requestClient.post<{ token?: string; uid?: string }>(
    '/account/login',
    data,
  );
  return {
    accessToken: result?.token ?? '',
    userId: String(result?.uid ?? ''),
  } as AuthApi.LoginResult;
}

/**
 * 退出登录
 */
export async function logoutApi() {
  return requestClient.post('/logout');
}

/**
 * 修改当前登录账号密码
 */
export async function updatePasswordApi(data: AuthApi.UpdatePasswordParams) {
  return requestClient.put('/account/password', data);
}

/**
 * 获取用户权限码
 */
export async function getAccessCodesApi() {
  return requestClient.get<string[]>('/account/buttons/aliases');
}
