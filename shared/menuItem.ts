import { z } from "zod";

export const ITEM_NAME_LIMIT = 40;
export const ITEM_PRIMARY_TAG_LIMIT = 16;
export const ITEM_TAG_LIMIT = 24;
export const ITEM_TAGS_LIMIT = 5;
export const ITEM_TAGLINE_LIMIT = 60;
export const ITEM_DESCRIPTION_LIMIT = 250;
export const ITEM_DETAIL_KEY_LIMIT = 24;
export const ITEM_DETAIL_VALUE_LIMIT = 60;
export const ITEM_DETAILS_LIMIT = 6;

export const menuItemDetailSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1, {
      message: "Please add a detail label.",
    })
    .max(ITEM_DETAIL_KEY_LIMIT, {
      message: `Detail labels must be ${ITEM_DETAIL_KEY_LIMIT} characters or fewer.`,
    }),
  value: z
    .string()
    .trim()
    .min(1, {
      message: "Please add a detail value.",
    })
    .max(ITEM_DETAIL_VALUE_LIMIT, {
      message: `Detail values must be ${ITEM_DETAIL_VALUE_LIMIT} characters or fewer.`,
    }),
});

export type MenuItemDetail = z.infer<typeof menuItemDetailSchema>;

const itemTagSchema = z
  .string()
  .trim()
  .max(ITEM_TAG_LIMIT, {
    message: `Each tag must be ${ITEM_TAG_LIMIT} characters or fewer.`,
  });

export const normalizeMenuItemTags = (tags: string[] | null | undefined) =>
  (tags ?? []).map((tag) => tag.trim()).filter(Boolean);

export const normalizeMenuItemDetails = (
  details: unknown,
): MenuItemDetail[] => {
  if (!Array.isArray(details)) {
    return [];
  }

  return details
    .map((detail) => {
      const parsedDetail = menuItemDetailSchema.safeParse(detail);
      return parsedDetail.success ? parsedDetail.data : null;
    })
    .filter((detail): detail is MenuItemDetail => detail !== null);
};

export const menuItemTagsSchema = z.array(itemTagSchema).max(ITEM_TAGS_LIMIT, {
  message: `You can add up to ${ITEM_TAGS_LIMIT} tags.`,
});

export const menuItemDetailsSchema = z
  .array(menuItemDetailSchema)
  .max(ITEM_DETAILS_LIMIT, {
    message: `You can add up to ${ITEM_DETAILS_LIMIT} detail rows.`,
  })
  .superRefine((details, ctx) => {
    const seenKeys = new Set<string>();

    details.forEach((detail, index) => {
      const normalizedKey = detail.key.trim().toLocaleLowerCase();

      if (!normalizedKey) {
        return;
      }

      if (seenKeys.has(normalizedKey)) {
        ctx.addIssue({
          code: "custom",
          message: "Each detail label must be unique.",
          path: [index, "key"],
        });
        return;
      }

      seenKeys.add(normalizedKey);
    });
  });

export const menuItemFieldsSchema = z.object({
  name: z
    .string()
    .min(1, {
      message: "Please add an item name.",
    })
    .max(ITEM_NAME_LIMIT, {
      message: `Item name must be ${ITEM_NAME_LIMIT} characters or fewer.`,
    }),
  primaryTag: z
    .string()
    .trim()
    .max(ITEM_PRIMARY_TAG_LIMIT, {
      message: `Primary tag must be ${ITEM_PRIMARY_TAG_LIMIT} characters or fewer.`,
    })
    .optional(),
  tags: menuItemTagsSchema,
  tagline: z
    .string()
    .trim()
    .max(ITEM_TAGLINE_LIMIT, {
      message: `Tagline must be ${ITEM_TAGLINE_LIMIT} characters or fewer.`,
    })
    .optional(),
  description: z
    .string()
    .trim()
    .max(ITEM_DESCRIPTION_LIMIT, {
      message: `Description must be ${ITEM_DESCRIPTION_LIMIT} characters or fewer.`,
    })
    .optional(),
  details: menuItemDetailsSchema,
  price: z
    .number()
    .min(0, { message: "Price must be a positive number." })
    .refine((val) => /^\d+(\.\d{1,2})?$/.test(val.toString()), {
      message: "Price can have up to 2 decimal places.",
    }),
});

export const menuItemImageFieldsSchema = z.object({
  imagePath: z.string().nullable().optional(),
  imageUrl: z.url().nullable().optional(),
});

export const refineMenuItemImageFields = (
  input: z.infer<typeof menuItemImageFieldsSchema>,
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
