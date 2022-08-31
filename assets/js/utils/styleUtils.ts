export const getFontColor = (colorName: string): string => {
  const style = getComputedStyle(document.body);
  return style.getPropertyValue(colorName);
};
