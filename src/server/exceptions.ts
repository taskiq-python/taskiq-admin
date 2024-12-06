export class NotFoundError extends Error {
  status: number
  constructor(message: string, status = 404) {
    super(message)
    this.name = "ValidationError"
    this.status = status
  }
}
