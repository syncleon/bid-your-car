package com.oblapleon.bidapi.common.exception

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.ResponseStatus

abstract class BidApiException(message: String) : RuntimeException(message)

@ResponseStatus(HttpStatus.BAD_REQUEST)
class BadRequestException(message: String) : BidApiException(message)

@ResponseStatus(HttpStatus.UNAUTHORIZED)
class UnauthorizedException(message: String) : BidApiException(message)

@ResponseStatus(HttpStatus.FORBIDDEN)
class ForbiddenException(message: String) : BidApiException(message)

@ResponseStatus(HttpStatus.NOT_FOUND)
class NotFoundException(message: String) : BidApiException(message)

@ResponseStatus(HttpStatus.CONFLICT)
class ConflictException(message: String) : BidApiException(message)

@ResponseStatus(HttpStatus.CONFLICT)
class AlreadyExistsException(message: String) : BidApiException(message)

@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
class InternalServerException(message: String) : BidApiException(message)