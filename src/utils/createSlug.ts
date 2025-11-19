export const createSlug = (text: string) => {
  return text.toLowerCase().replace(/\s+/g, "-");
};
