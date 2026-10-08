export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: unknown,
  ) {
    super(message)
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new HttpError(400, message, details)
export const unauthorized = (message = "Non connecté") => new HttpError(401, message)
export const notFound = (message = "Introuvable") => new HttpError(404, message)
export const conflict = (message: string) => new HttpError(409, message)
