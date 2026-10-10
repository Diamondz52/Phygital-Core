export const logDateIso = (value: string) => {
  const match = value.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : value.slice(0, 10);
};
