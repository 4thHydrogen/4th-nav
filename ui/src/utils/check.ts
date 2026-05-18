export const isLogin = () => {
  return localStorage.getItem('_token') ? true : false
}

export const isInlineSvg = (value: string): boolean => {
  return !!value && value.trim().startsWith('<svg');
}

export const getLogoUrl = (url: string) => {
  if (!url) return '';
  if (isInlineSvg(url)) return url;
  if (url.startsWith('http')) return `/api/img?url=${url}`;
  return url;
} 