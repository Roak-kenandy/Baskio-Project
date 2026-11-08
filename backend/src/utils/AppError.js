class AppError extends Error {
  constructor(statusCode, message, { code, details } = {}) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code || AppError.defaultCode(statusCode);
    this.details = details;
    this.isOperational = true;
  }

  static defaultCode(statusCode) {
    switch (statusCode) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHENTICATED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      case 429:
        return 'TOO_MANY_REQUESTS';
      case 503:
        return 'SERVICE_UNAVAILABLE';
      default:
        return 'INTERNAL_ERROR';
    }
  }
}

module.exports = AppError;
