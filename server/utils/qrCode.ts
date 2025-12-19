export const generateQRFilePath = (menuId: string) => {
  return `menu/${menuId}/qr_${menuId}-${Date.now()}.png`;
};
