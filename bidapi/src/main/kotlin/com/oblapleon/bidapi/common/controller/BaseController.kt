package com.oblapleon.bidapi.common.controller

import com.oblapleon.bidapi.common.exceptions.*
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.AccessDeniedException

/**
 * Abstract foundation for API controllers providing a unified request handling mechanism.
 * Standardizes the transformation of functional logic results and domain-specific
 * exceptions into consistent HTTP responses.
 */
abstract class BaseController {

    /**
     * Executes a functional block and wraps the result in a [ResponseEntity].
     * Intercepts various domain exceptions to return the appropriate HTTP status
     * codes and error messages.
     * * @param action The functional block to execute, typically a service call.
     * @return A [ResponseEntity] containing the result or an error message.
     */
    protected fun handleRequest(action: () -> Any?): ResponseEntity<Any> {
        return try {
            val response = action()
            if (response == null) {
                ResponseEntity.ok().build()
            } else {
                ResponseEntity.ok(response)
            }
        } catch (e: BadRequestException) {
            ResponseEntity.badRequest().body(e.message)
        } catch (e: NotFoundException) {
            ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.message)
        } catch (e: UnauthorizedException) {
            ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.message)
        } catch (e: AlreadyExistsException) {
            ResponseEntity.status(HttpStatus.CONFLICT).body(e.message)
        } catch (e: ConflictException) {
            ResponseEntity.status(HttpStatus.CONFLICT).body(e.message)
        } catch (e: InvalidDataException) {
            ResponseEntity.badRequest().body(e.message)
        } catch (e: AccessDeniedException) {
            ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied")
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("An unexpected error occurred.")
        }
    }
}