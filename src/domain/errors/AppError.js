export class AppError extends Error {
  constructor(message, { code = "INTERNAL_ERROR", statusCode = 500 } = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class ValidationError extends AppError {
  constructor(message) { super(message, { code: "VALIDATION_ERROR", statusCode: 400 }); }
}
export class NotFoundError extends AppError {
  constructor(message) { super(message, { code: "NOT_FOUND", statusCode: 404 }); }
}
export class ConflictError extends AppError {
  constructor(message) { super(message, { code: "CONFLICT", statusCode: 409 }); }
}
