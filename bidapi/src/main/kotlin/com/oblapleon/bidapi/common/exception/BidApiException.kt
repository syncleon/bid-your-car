package com.oblapleon.bidapi.common.exception

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.ResponseStatus

/**
 * Base class for all application-specific exceptions.
 * Allows for easier catching of "all business logic errors" if needed.
 */
abstract class BidApiException(message: String) : RuntimeException(message)

/**
 * 400 Bad Request
 * Used when the client sends invalid data (e.g., password too short, invalid format).
 */
@ResponseStatus(HttpStatus.BAD_REQUEST)
class BadRequestException(message: String) : BidApiException(message)

/**
 * 401 Unauthorized
 * Used when authentication fails (e.g., wrong password, missing token, account disabled).
 */
@ResponseStatus(HttpStatus.UNAUTHORIZED)
class UnauthorizedException(message: String) : BidApiException(message)

/**
 * 403 Forbidden
 * Used when the user is authenticated but lacks permission (e.g., User trying to delete Admin).
 * Note: While not explicitly used in your snippet yet, it is essential for RBAC.
 */
@ResponseStatus(HttpStatus.FORBIDDEN)
class ForbiddenException(message: String) : BidApiException(message)

/**
 * 404 Not Found
 * Used when a resource ID does not exist (e.g., User ID 99 not found).
 */
@ResponseStatus(HttpStatus.NOT_FOUND)
class NotFoundException(message: String) : BidApiException(message)

/**
 * 409 Conflict
 * Used when a state conflict occurs (e.g., Email already taken, Deleting a user with active bids).
 */
@ResponseStatus(HttpStatus.CONFLICT)
class ConflictException(message: String) : BidApiException(message)

// Alias for consistency if your Service code uses 'AlreadyExistsException'
// This points to the same 409 Conflict status.
@ResponseStatus(HttpStatus.CONFLICT)
class AlreadyExistsException(message: String) : BidApiException(message)

/**
 * 500 Internal Server Error
 * Used for unexpected system failures (e.g., Database connection lost, File upload failed).
 */
@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
class InternalServerException(message: String) : BidApiException(message)