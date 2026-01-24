package com.oblapleon.bidapi.common.controller

import com.oblapleon.bidapi.common.exceptions.BadRequestException
import com.oblapleon.bidapi.common.exceptions.NotFoundException
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity

abstract class BaseController {
    protected fun handleRequest(action: () -> Any?): ResponseEntity<Any> {
        return try {
            val response = action()
            ResponseEntity.ok(response ?: mapOf("message" to "Success"))
        } catch (e: BadRequestException) {
            ResponseEntity.badRequest().body(e.message)
        } catch (e: NotFoundException) {
            ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.message)
        } catch (e: IllegalStateException) {
            ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(e.message)
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().body(e.message)
        } catch (e: Exception) {
            e.printStackTrace()
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("An unexpected error occurred: ${e.message}")
        }
    }
}