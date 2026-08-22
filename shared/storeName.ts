import { z } from "zod";

export const STORE_NAME_MIN_LENGTH = 3;
export const STORE_NAME_MAX_LENGTH = 32;

export const storeNameSchema = z
  .string()
  .trim()
  .min(
    STORE_NAME_MIN_LENGTH,
    `Store name must be at least ${STORE_NAME_MIN_LENGTH} characters.`,
  )
  .max(
    STORE_NAME_MAX_LENGTH,
    `Store name must be ${STORE_NAME_MAX_LENGTH} characters or fewer.`,
  );
