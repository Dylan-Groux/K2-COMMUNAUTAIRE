import type { z } from "zod"
import { badRequest } from "./http-error"

/** Valide `data` avec un schéma Zod ou lève une 400 avec les erreurs par champ. */
export function validate<S extends z.ZodType>(schema: S, data: unknown): z.output<S> {
  const result = schema.safeParse(data)
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Données invalides"
    throw badRequest(message, result.error.issues)
  }
  return result.data
}
