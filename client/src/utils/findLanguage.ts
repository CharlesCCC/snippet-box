import aliasesData from '../data/aliases_raw.json';

export const findLanguage = (language: string): boolean => {
  const search = language.toLowerCase();
  return aliasesData.aliases.some(alias => alias === search);
};
