import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères")
    .max(20, "Le nom d'utilisateur ne peut pas dépasser 20 caractères")
    .regex(/^[a-zA-Z0-9_-]+$/, "Lettres, chiffres, tirets et underscores uniquement"),
  password: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères")
    .max(100, "Le mot de passe est trop long"),
});

export const loginSchema = z.object({
  username: z.string().min(1, "Veuillez entrer votre nom d'utilisateur"),
  password: z.string().min(1, "Veuillez entrer votre mot de passe"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
