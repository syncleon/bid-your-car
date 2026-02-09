package com.oblapleon.bidapi.common.exceptions

import org.springframework.http.HttpStatus

abstract class ApiException(
    val status: HttpStatus,
    message: String
) : RuntimeException(message)



open class BadRequestException(message: String) :
    ApiException(HttpStatus.BAD_REQUEST, message)

class InvalidDataException(message: String) :
    BadRequestException(message)

class UnauthorizedException(message: String) :
    ApiException(HttpStatus.UNAUTHORIZED, message)

class NotFoundException(message: String) :
    ApiException(HttpStatus.NOT_FOUND, message)

open class ConflictException(message: String) :
    ApiException(HttpStatus.CONFLICT, message)

class AlreadyExistsException(message: String) :
    ConflictException(message)

class OwnItemBidException(message: String) :
    ApiException(HttpStatus.UNPROCESSABLE_ENTITY, message)
