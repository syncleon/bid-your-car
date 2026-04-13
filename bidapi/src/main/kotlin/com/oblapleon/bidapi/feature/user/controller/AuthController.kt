package com.oblapleon.bidapi.feature.user.controller

import com.oblapleon.bidapi.feature.user.dto.LoginReqDto
import com.oblapleon.bidapi.feature.user.dto.RegisterReqDto
import com.oblapleon.bidapi.feature.user.service.AuthService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseCookie
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "Endpoints for user login, registration, and recovery")
class AuthController(
    private val authService: AuthService,
    @Value("\${app.cookie.secure:false}") private val secureCookie: Boolean,
    @Value("\${app.cookie.same-site:Lax}") private val sameSiteCookie: String
) {

    @Operation(summary = "User Login")
    @PostMapping("/login")
    fun login(
        @Valid @RequestBody payload: LoginReqDto
    ): ResponseEntity<Map<String, String>> {
        val response = authService.login(payload)
        val jwtCookie = ResponseCookie.from("__session", response.token)
            .httpOnly(true)
            .secure(secureCookie)
            .path("/")
            .maxAge((30 * 24 * 60 * 60).toLong())
            .sameSite(sameSiteCookie)
            .build()

        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, jwtCookie.toString())
            .body(mapOf("message" to "Login successful"))
    }

    @Operation(summary = "User Logout")
    @PostMapping("/logout")
    fun logout(): ResponseEntity<Map<String, String>> {
        val clearCookie = ResponseCookie.from("__session", "")
            .httpOnly(true)
            .secure(secureCookie)
            .path("/")
            .maxAge(0)
            .sameSite(sameSiteCookie)
            .build()

        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, clearCookie.toString())
            .body(mapOf("message" to "Logged out successfully"))
    }

    @Operation(summary = "Register User", description = "Creates a new account and sends a verification email.")
    @ApiResponses(
        value = [
            ApiResponse(responseCode = "201", description = "User created successfully"),
            ApiResponse(responseCode = "409", description = "Username or Email already exists"),
            ApiResponse(responseCode = "400", description = "Validation failed")
        ]
    )
    @PostMapping("/register")
    fun register(@Valid @RequestBody payload: RegisterReqDto): ResponseEntity<Map<String, String>> {
        val message = authService.register(payload)
        return ResponseEntity.status(HttpStatus.CREATED).body(mapOf("message" to message))
    }

    @Operation(summary = "Verify Email", description = "Validates the token sent via email.")
    @GetMapping("/verify")
    fun verify(@RequestParam token: String): ResponseEntity<Map<String, String>> {
        val message = authService.verifyAccount(token)
        return ResponseEntity.ok(mapOf("message" to message))
    }

    @Operation(summary = "Restore Account", description = "Reactivates a soft-deleted account using valid credentials.")
    @PostMapping("/restore")
    fun restore(@Valid @RequestBody payload: LoginReqDto): ResponseEntity<Map<String, String>> {
        authService.restoreAccount(payload)
        return ResponseEntity.ok(mapOf("message" to "Account restored successfully. You can now log in."))
    }
}