export const getImageUrl = (path: string) => {
  return new URL(`../assets/${path}.png`, import.meta.url).href;
};

export const getFontUrl = (path: string) => {
  return new URL(`../assets/${path}.ttf`, import.meta.url).href;
};
