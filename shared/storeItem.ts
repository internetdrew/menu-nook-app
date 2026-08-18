import { z } from "zod";

export const ITEM_NAME_LIMIT = 40;
export const ITEM_DESCRIPTION_LIMIT = 160;

export const storeItemFieldsSchema = z.object({
  name: z
    .string()
    .min(1, {
      message: "Please add an item name.",
    })
    .max(ITEM_NAME_LIMIT, {
      message: `Item name must be ${ITEM_NAME_LIMIT} characters or fewer.`,
    }),
  description: z
    .string()
    .trim()
    .max(ITEM_DESCRIPTION_LIMIT, {
      message: `Description must be ${ITEM_DESCRIPTION_LIMIT} characters or fewer.`,
    })
    .optional(),
  price: z
    .number()
    .min(0, { message: "Price must be a positive number." })
    .refine((val) => /^\d+(\.\d{1,2})?$/.test(val.toString()), {
      message: "Price can have up to 2 decimal places.",
    }),
});

export const storeItemImageFieldsSchema = z.object({
  imagePath: z.string().nullable().optional(),
  imageUrl: z.url().nullable().optional(),
});

export const refineStoreItemImageFields = (
  input: z.infer<typeof storeItemImageFieldsSchema>,
  ctx: z.RefinementCtx,
) => {
  const imageUrlProvided = input.imageUrl !== undefined;
  const imagePathProvided = input.imagePath !== undefined;

  if (imageUrlProvided !== imagePathProvided) {
    ctx.addIssue({
      code: "custom",
      message: "Image updates must include both imageUrl and imagePath",
      path: ["imageUrl"],
    });
  }

  if (input.imageUrl === null && input.imagePath !== null) {
    ctx.addIssue({
      code: "custom",
      message: "Removing an image must clear both imageUrl and imagePath",
      path: ["imagePath"],
    });
  }

  if (input.imagePath === null && input.imageUrl !== null) {
    ctx.addIssue({
      code: "custom",
      message: "Removing an image must clear both imageUrl and imagePath",
      path: ["imageUrl"],
    });
  }
};
