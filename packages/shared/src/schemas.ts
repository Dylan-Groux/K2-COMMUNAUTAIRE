import { z } from "zod"
import { GAME_SLUGS, isAllowedTrackerUrl, isUrl } from "./games"

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalide"),
  pseudo: z
    .string()
    .trim()
    .min(2, "Pseudo trop court")
    .max(32, "Pseudo trop long")
    .regex(/^[\w.\-]+$/u, "Lettres, chiffres, point, tiret ou underscore uniquement"),
  phone: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((value) => value || undefined),
  password: z.string().min(8, "8 caractères minimum").max(128),
})

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
})

export const gameAccountInputSchema = z
  .object({
    id: z.string().optional(),
    slug: z.enum(GAME_SLUGS as [string, ...string[]]),
    identifier: z.string().trim().max(160),
    url: z.string().trim().max(300).nullish(),
    friendCode: z.string().trim().max(40).nullish(),
    isMain: z.boolean(),
    rankTier: z.string().trim().min(1).max(40),
    rankDivision: z.string().trim().max(10).nullish(),
    rankLp: z.number().int().min(0).max(100000).nullish(),
  })
  .superRefine((account, ctx) => {
    for (const field of ["identifier", "url"] as const) {
      const value = account[field]
      if (value && isUrl(value) && !isAllowedTrackerUrl(account.slug, value)) {
        ctx.addIssue({
          code: "custom",
          path: [field],
          message: "Lien non autorisé pour ce jeu",
        })
      }
    }
  })

export const saveAccountsSchema = z
  .object({ accounts: z.array(gameAccountInputSchema).max(100) })
  .superRefine(({ accounts }, ctx) => {
    const mains = new Set<string>()
    for (const account of accounts.filter((a) => a.isMain)) {
      if (mains.has(account.slug)) {
        ctx.addIssue({
          code: "custom",
          path: ["accounts"],
          message: `Un seul compte principal par jeu (${account.slug})`,
        })
      }
      mains.add(account.slug)
    }
    for (const account of accounts.filter((a) => !a.isMain)) {
      if (!mains.has(account.slug)) {
        ctx.addIssue({
          code: "custom",
          path: ["accounts"],
          message: `Un smurf nécessite un compte principal (${account.slug})`,
        })
      }
    }
  })

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type GameAccountInput = z.infer<typeof gameAccountInputSchema>
export type SaveAccountsInput = z.infer<typeof saveAccountsSchema>
