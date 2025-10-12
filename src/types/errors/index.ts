export class AppError extends Error {
    constructor(
        public statusCode: number,
        message: string,
        public isOperational = true
    ) {
        super(message);
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

export class ValidationError extends AppError {
    constructor(message: string) {
        super(400, message);
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}

export class AuthenticationError extends AppError {
    constructor(message: string = "Authentication failed") {
        super(401, message);
        Object.setPrototypeOf(this, AuthenticationError.prototype);
    }
}

export class AuthorizationError extends AppError {
    constructor(message: string = "Not authorized") {
        super(403, message);
        Object.setPrototypeOf(this, AuthorizationError.prototype);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = "Resource not found") {
        super(404, message);
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}

export class UnprocessableEntityError extends AppError {
    constructor(message: string = "Unprocessable entity") {
        super(422, message);
        Object.setPrototypeOf(this, UnprocessableEntityError.prototype);
    }
}
