package com.oblapleon.bidapi.feature.user.controller

import com.oblapleon.bidapi.feature.user.dto.LoginReqDto
import com.oblapleon.bidapi.feature.user.dto.RegisterReqDto
import com.oblapleon.bidapi.feature.user.service.AuthService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseCookie
import org.springframework.http.ResponseEntity
import org.springframework.security.core.Authentication
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "Endpoints for user login, registration, profile, and recovery")
class AuthController(
    private val authService: AuthService
) {

    @Operation(summary = "User Login", description = "Authenticates user and sets an HttpOnly JWT cookie.")
    @ApiResponses(
        value = [
            ApiResponse(responseCode = "200", description = "Login successful",
                content = [Content(schema = Schema(implementation = Map::class))]),
            ApiResponse(responseCode = "400", description = "Invalid input or missing fields"),
            ApiResponse(responseCode = "401", description = "Invalid credentials or account not verified")
        ]
    )
    @PostMapping("/login")
    fun login(@Valid @RequestBody payload: LoginReqDto): ResponseEntity<Map<String, String>> {
        val response = authService.login(payload)

        val jwtCookie = ResponseCookie.from("jwt", response.token)
            .httpOnly(true)
            .secure(false)
            .path("/")
            .maxAge(30 * 24 * 60 * 60)
            .sameSite("Lax")
            .build()

        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, jwtCookie.toString())
            .body(mapOf("message" to "Login successful"))
    }

    @Operation(summary = "Get Current User Profile", description = "Returns profile data based on HttpOnly JWT cookie.")
    @GetMapping("/me")
    fun me(authentication: Authentication): ResponseEntity<Map<String, Any>> {
        val roles = authentication.authorities.map { it.authority.replace("ROLE_", "") }
        val jwt = authentication.principal as Jwt
        val userId = jwt.claims["uid"] ?: 0

        return ResponseEntity.ok(mapOf(
            "id" to userId,
            "username" to authentication.name,
            "roles" to roles.map { mapOf("name" to it) }
        ))
    }

    @Operation(summary = "User Logout", description = "Clears the JWT HttpOnly cookie.")
    @PostMapping("/logout")
    fun logout(): ResponseEntity<Map<String, String>> {
        val clearCookie = ResponseCookie.from("jwt", "")
            .httpOnly(true)
            .secure(false)
            .path("/")
            .maxAge(0)
            .sameSite("Lax")
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