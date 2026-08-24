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
import java.net.URI


@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "Endpoints for user login, registration, and recovery")
class AuthController(
    private val authService: AuthService,
    @Value("\${app.cookie.secure:false}") private val secureCookie: Boolean,
    @Value("\${app.cookie.same-site:Lax}") private val sameSiteCookie: String,
    @Value("\${app.frontend-url}") private val frontendUrl: String
) {

    /**
     * Authenticates a user and sets a JWT token in an HTTP-only cookie.
     *
     * @param payload The login request containing credentials.
     * @return A success message upon valid authentication.
     */
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

    /**
     * Logs out the current user by clearing the JWT authentication cookie.
     *
     * @return A success message.
     */
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

    /**
     * Registers a new user account.
     * May trigger an email verification flow depending on configuration.
     *
     * @param payload The registration request data.
     * @return A message indicating registration success or next steps.
     */
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

    /**
     * Verifies a user's email address using a token.
     * Redirects the user to the frontend login page upon successful verification.
     *
     * @param token The verification token from the email link.
     */
    @Operation(summary = "Verify Email", description = "Validates the token sent via email and redirects to the frontend login page.")
    @GetMapping("/verify")
    fun verify(@RequestParam token: String): ResponseEntity<Void> { // <-- Changed return type
        // 1. Run the verification logic
        authService.verifyAccount(token)

        // 2. Build the redirect URL and send a 302 response
        return ResponseEntity
            .status(HttpStatus.FOUND)
            .location(URI.create("$frontendUrl/login?verified=true"))
            .build()
    }

    /**
     * Restores a previously deactivated/soft-deleted account.
     * Requires valid login credentials.
     *
     * @param payload The login credentials for the account to be restored.
     * @return A success message.
     */
    @Operation(summary = "Restore Account", description = "Reactivates a soft-deleted account using valid credentials.")
    @PostMapping("/restore")
    fun restore(@Valid @RequestBody payload: LoginReqDto): ResponseEntity<Map<String, String>> {
        authService.restoreAccount(payload)
        return ResponseEntity.ok(mapOf("message" to "Account restored successfully. You can now log in."))
    }

}