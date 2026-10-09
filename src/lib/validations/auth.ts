import { z } from "zod";
import { i18nKey } from "@/lib/i18n";

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, i18nKey("validation.usernameMin"))
    .max(20, i18nKey("validation.usernameMax"))
    .regex(/^[a-zA-Z0-9_-]+$/, i18nKey("validation.usernameChars")),
  password: z
    .string()
    .min(6, i18nKey("validation.passwordMin"))
    .max(100, i18nKey("validation.passwordMax")),
});

export const loginSchema = z.object({
  username: z.string().min(1, i18nKey("validation.usernameRequired")),
  password: z.string().min(1, i18nKey("validation.passwordRequired")),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
