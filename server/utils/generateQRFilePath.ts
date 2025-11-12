export const generateQRFilePath = (restaurantId: string) => {
  return `restaurants/${restaurantId}/qr_${restaurantId}-${Date.now()}.png`;
};
