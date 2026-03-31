<script setup lang="ts">
import type { Recordable } from '@vben/types';
import type { VbenFormSchema } from '#/adapter/form';

import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { ProfilePasswordSetting, z } from '@vben/common-ui';
import { resetAllStores, useAccessStore } from '@vben/stores';

import { message } from 'antdv-next';

import { updatePasswordApi } from '#/api/core/auth';

const router = useRouter();
const accessStore = useAccessStore();
const submitting = ref(false);

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      fieldName: 'oldPassword',
      label: '原始密码',
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: '请输入原始密码',
      },
      rules: z.string({ required_error: '请输入原始密码' }).trim().min(4, {
        message: '密码不能少于4位',
      }),
    },
    {
      fieldName: 'newPassword',
      label: '新密码',
      component: 'VbenInputPassword',
      componentProps: {
        passwordStrength: true,
        placeholder: '请输入新密码',
      },
      rules: z.string({ required_error: '请输入新密码' }).trim().min(4, {
        message: '密码不能少于4位',
      }),
    },
    {
      fieldName: 'confirmPassword',
      label: '确认密码',
      component: 'VbenInputPassword',
      componentProps: {
        passwordStrength: true,
        placeholder: '请输入确认密码',
      },
      dependencies: {
        rules(values) {
          const newPassword = String(values.newPassword ?? '').trim();
          return z
            .string({ required_error: '请输入确认密码' })
            .trim()
            .min(4, { message: '密码不能少于4位' })
            .refine((value) => value === newPassword, {
              message: '两次输入的密码不一致',
            });
        },
        triggerFields: ['newPassword'],
      },
    },
  ];
});

async function handleSubmit(values: Recordable<any>) {
  if (submitting.value) {
    return;
  }

  try {
    submitting.value = true;
    await updatePasswordApi({
      newPassword: String(values.newPassword ?? '').trim(),
      oldPassword: String(values.oldPassword ?? '').trim(),
      rePassword: String(values.confirmPassword ?? '').trim(),
    });
    message.success('密码修改成功，请重新登录');
    resetAllStores();
    accessStore.setLoginExpired(false);
    await router.replace({
      path: LOGIN_PATH,
    });
  } finally {
    submitting.value = false;
  }
}
</script>
<template>
  <ProfilePasswordSetting
    class="w-1/3"
    :form-schema="formSchema"
    :loading="submitting"
    @submit="handleSubmit"
  />
</template>
