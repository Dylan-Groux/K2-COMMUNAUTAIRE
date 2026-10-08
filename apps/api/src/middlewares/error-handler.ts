import type { NextFunction, Request, Response } from "express"
import { HttpError } from "../lib/http-error"

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Route inconnue" })
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message })
    return
  }
  console.error(error)
  res.status(500).json({ error: "Erreur interne" })
}
