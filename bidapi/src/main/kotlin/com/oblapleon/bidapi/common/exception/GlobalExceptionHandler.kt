package com.oblapleon.bidapi.common.exception

import org.springframework.data.mapping.PropertyReferenceException
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import java.time.Instant
import org.slf4j.LoggerFactory

@RestControllerAdvice
class GlobalExceptionHandler {

    private val logger = LoggerFactory.getLogger(GlobalExceptionHandler::class.java)

    @ExceptionHandler(PropertyReferenceException::class)
    fun handlePropertyReferenceException(ex: PropertyReferenceException): ResponseEntity<Map<String, Any>> {
        return buildResponse(
            HttpStatus.BAD_REQUEST,
            "Invalid sort property: '${ex.propertyName}'. This field does not exist on the requested resource."
        )
    }

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidationErrors(ex: MethodArgumentNotValidException): ResponseEntity<Map<String, Any>> {
        val errors = ex.bindingResult.fieldErrors.map { "${it.field}: ${it.defaultMessage}" }
        return ResponseEntity.badRequest().body(
            mapOf(
                "timestamp" to Instant.now(),
                "status" to HttpStatus.BAD_REQUEST.value(),
                "error" to "Validation Failed",
                "details" to errors
            )
        )
    }

    @ExceptionHandler(UnauthorizedException::class)
    fun handleUnauthorized(ex: UnauthorizedException) = buildResponse(HttpStatus.UNAUTHORIZED, ex.message)

    @ExceptionHandler(ForbiddenException::class)
    fun handleForbidden(ex: ForbiddenException) = buildResponse(HttpStatus.FORBIDDEN, ex.message)

    @ExceptionHandler(BadRequestException::class)
    fun handleBadRequest(ex: BadRequestException) = buildResponse(HttpStatus.BAD_REQUEST, ex.message)

    @ExceptionHandler(AlreadyExistsException::class)
    fun handleConflict(ex: AlreadyExistsException) = buildResponse(HttpStatus.CONFLICT, ex.message)

    @ExceptionHandler(ConflictException::class) // Support both naming styles
    fun handleConflictAlt(ex: ConflictException) = buildResponse(HttpStatus.CONFLICT, ex.message)

    @ExceptionHandler(NotFoundException::class)
    fun handleNotFound(ex: NotFoundException) = buildResponse(HttpStatus.NOT_FOUND, ex.message)

    @ExceptionHandler(Exception::class)
    fun handleGenericException(ex: Exception): ResponseEntity<Map<String, Any>> {
        // This will print the exact line of code causing the crash to your terminal
        logger.error("Unhandled exception caught by GlobalExceptionHandler:", ex)

        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred.")
    }

    @ExceptionHandler(AccessDeniedException::class)
    fun handleSpringSecurityAccessDenied(ex: AccessDeniedException): ResponseEntity<Map<String, Any>> {
        return buildResponse(HttpStatus.FORBIDDEN, "Access Denied: You do not have permission to access this endpoint.")
    }


    private fun buildResponse(status: HttpStatus, message: String?): ResponseEntity<Map<String, Any>> {
        return ResponseEntity.status(status).body(
            mapOf(
                "timestamp" to Instant.now(),
                "status" to status.value(),
                "error" to status.reasonPhrase,
                "message" to (message ?: "Unknown error")
            )
        )
    }
}