export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

export const notFound = (message = "Introuvable") => new HttpError(404, message)
