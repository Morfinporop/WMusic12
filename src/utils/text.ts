export function transliterateRuToEn(input: string): string {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i', й: 'y',
    к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
    х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  };

  return input
    .split('')
    .map((ch) => {
      const low = ch.toLowerCase();
      const val = map[low];
      if (!val) return ch;
      return ch === low ? val : val.charAt(0).toUpperCase() + val.slice(1);
    })
    .join('');
}

export function localizeTitle(title: string, lang: 'ru' | 'en'): string {
  if (lang === 'ru') return title;
  return transliterateRuToEn(title);
}
