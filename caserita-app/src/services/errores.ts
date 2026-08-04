/** Error uniforme para toda la capa de datos (remota o local). */
export class ErrorApi extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}
