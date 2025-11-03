export type ClothingItemWithDetails = {
  id: string;
  name: string | null;
  brand: string | null;
  description: string | null;
  imageUrlFront: string;
  imageUrlBack: string;
  type: string | null;
  color: string | null;
  price: number | null;
  datePurchased: string | Date | null;
  size: string | null;
  inCapsule: boolean;
};
