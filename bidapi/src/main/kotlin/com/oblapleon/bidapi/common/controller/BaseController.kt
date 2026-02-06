package com.oblapleon.bidapi.common.controller

import com.oblapleon.bidapi.common.exceptions.ApiException
import org.springframework.http.ResponseEntity


data class ErrorResponse(
    val status: Int,
    val error: String,
    val message: String?,
    val timestamp: Long = System.currentTimeMillis()
)

abstract class BaseController {

    protected fun handleRequest(action: () -> Any?): ResponseEntity<Any> {
        return try {
            val response = action()
            ResponseEntity.ok(response ?: mapOf("message" to "Success"))
        } catch (e: ApiException) {
            // Transform the exception into the ErrorResponse DTO
            val errorBody = ErrorResponse(
                status = e.status.value(),
                error = e.status.reasonPhrase,
                message = e.message
            )
            ResponseEntity.status(e.status).body(errorBody)
        } catch (e: Exception) {
            e.printStackTrace()
            val errorBody = ErrorResponse(
                status = 500,
                error = "Internal Server Error",
                message = "An unexpected error occurred"
            )
            ResponseEntity.internalServerError().body(errorBody)
        }
    }
}