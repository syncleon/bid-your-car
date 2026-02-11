package com.oblapleon.bidapi.common.exception

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import java.time.Instant

@RestControllerAdvice
class GlobalExceptionHandler {

    // Handle Validation Errors (@Valid failure)
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

    // Handle Custom Exceptions (The ones we created earlier)
    @ExceptionHandler(UnauthorizedException::class)
    fun handleUnauthorized(ex: UnauthorizedException): ResponseEntity<Any> =
        buildResponse(HttpStatus.UNAUTHORIZED, ex.message)

    @ExceptionHandler(BadRequestException::class)
    fun handleBadRequest(ex: BadRequestException): ResponseEntity<Any> =
        buildResponse(HttpStatus.BAD_REQUEST, ex.message)
        
    @ExceptionHandler(AlreadyExistsException::class)
    fun handleConflict(ex: AlreadyExistsException): ResponseEntity<Any> =
        buildResponse(HttpStatus.CONFLICT, ex.message)

    @ExceptionHandler(NotFoundException::class)
    fun handleNotFound(ex: NotFoundException): ResponseEntity<Any> =
        buildResponse(HttpStatus.NOT_FOUND, ex.message)

    private fun buildResponse(status: HttpStatus, message: String?): ResponseEntity<Any> {
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