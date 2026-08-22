import { z } from "zod";

export const CATEGORY_NAME_LIMIT = 40;
export const CATEGORY_NAME_WARNING_THRESHOLD = 10;
export const CATEGORY_DESCRIPTION_LIMIT = 160;
export const CATEGORY_DESCRIPTION_WARNING_THRESHOLD = 20;

export const storeCategoryFieldsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, {
      message: "Please add a category name.",
    })
    .max(CATEGORY_NAME_LIMIT, {
      message: `Category name must be ${CATEGORY_NAME_LIMIT} characters or fewer.`,
    }),
  description: z
    .string()
    .trim()
    .max(CATEGORY_DESCRIPTION_LIMIT, {
      message: `Description must be ${CATEGORY_DESCRIPTION_LIMIT} characters or fewer.`,
    })
    .optional(),
});
