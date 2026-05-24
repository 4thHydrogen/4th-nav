import pinyin from 'pinyin-match';
import type { Category } from "../types";

export const getOptions = (rawList: Category[]) => {
  return rawList.map((item) => {
    return {
      label: item.name,
      value: item.name,
      key: item.id,
    }
  })
}
export const getFilter = (rawList: Category[]) => {
  return rawList.map((item) => {
    return {
      text: item.name,
      value: item.name,
    }
  })
}

export const mutiSearch = (s: string, t: string) => {
  const source = s.toLowerCase();
  const target = t.toLowerCase();
  const rawInclude = source.includes(target);
  const pinYinInlcude = Boolean(pinyin.match(source, target));
  return rawInclude || pinYinInlcude;
};
