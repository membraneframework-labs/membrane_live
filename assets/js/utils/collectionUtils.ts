export const groupBy = <T extends any>(arr: T[], fn: (item: T) => any) => arr.reduce<Record<string, T[]>>((prev, curr) => {
  const groupKey = fn(curr);
  const group = prev[groupKey] || [];
  group.push(curr);
  return {...prev, [groupKey]: group};
}, {});
