export const FAMILY_LEVEL_OPTIONS = [
  { value: 'BLACK_IRON', name: '黑铁' },
  { value: 'BRONZE_I', name: '青铜1' },
  { value: 'BRONZE_II', name: '青铜2' },
  { value: 'BRONZE_III', name: '青铜3' },
  { value: 'BRONZE_IIII', name: '青铜4' },
  { value: 'BRONZE_IIIII', name: '青铜5' },
  { value: 'SILVER_I', name: '白银1' },
  { value: 'SILVER_II', name: '白银2' },
  { value: 'SILVER_III', name: '白银3' },
  { value: 'SILVER_IIII', name: '白银4' },
  { value: 'SILVER_IIIII', name: '白银5' },
  { value: 'GOLD_I', name: '黄金1' },
  { value: 'GOLD_II', name: '黄金2' },
  { value: 'GOLD_III', name: '黄金3' },
  { value: 'GOLD_IIII', name: '黄金4' },
  { value: 'GOLD_IIIII', name: '黄金5' },
  { value: 'PLATINUM_I', name: '铂金1' },
  { value: 'PLATINUM_II', name: '铂金2' },
  { value: 'PLATINUM_III', name: '铂金3' },
  { value: 'PLATINUM_IIII', name: '铂金4' },
  { value: 'PLATINUM_IIIII', name: '铂金5' },
] as const;

export const FAMILY_ROLE_OPTIONS = [
  { value: 'ADMIN', name: '族长' },
  { value: 'MANAGE', name: '管理员' },
  { value: 'MEMBER', name: '成员' },
] as const;

export const FAMILY_TYPE_OPTIONS = [
  { value: 'BLACK_IRON', name: '黑铁' },
  { value: 'BRONZE', name: '青铜' },
  { value: 'SILVER', name: '白银' },
  { value: 'GOLD', name: '黄金' },
  { value: 'PLATINUM', name: '铂金' },
] as const;

export function buildLabelMap(
  list: ReadonlyArray<{ name: string; value: string }>,
) {
  return list.reduce<Record<string, string>>((result, item) => {
    result[item.value] = item.name;
    return result;
  }, {});
}
