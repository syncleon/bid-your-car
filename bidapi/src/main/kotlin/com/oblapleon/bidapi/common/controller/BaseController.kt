package com.oblapleon.bidapi.common.controller

import com.oblapleon.bidapi.common.exceptions.*
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.AccessDeniedException

abstract class BaseController {

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
