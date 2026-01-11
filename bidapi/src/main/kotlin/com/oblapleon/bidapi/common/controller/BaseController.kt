package com.oblapleon.bidapi.common.controller

import com.oblapleon.bidapi.common.exceptions.*
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.AccessDeniedException
import software.amazon.awssdk.services.s3.model.S3Exception // Import this!

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

        } catch (e: S3Exception) {
            e.printStackTrace() // Print logs so you can see them in Docker!
            ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(
                mapOf("error" to "S3 Upload Failed", "details" to e.awsErrorDetails().errorMessage())
            )
        } catch (e: Exception) {
            e.printStackTrace() // IMPORTANT: Without this, you are flying blind
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("An unexpected error occurred: ${e.message}")
        }
    }
}