package com.oblapleon.bidapi.feature.user.controller

import com.oblapleon.bidapi.common.controller.BaseController
import com.oblapleon.bidapi.common.exceptions.BadRequestException
import com.oblapleon.bidapi.feature.user.dto.LoginReqDto
import com.oblapleon.bidapi.feature.user.dto.RegisterReqDto
import com.oblapleon.bidapi.feature.user.service.AuthService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Authentication", description = "Endpoints for user login, registration, and recovery")
class AuthController(
    private val authService: AuthService
) : BaseController() {

    @Operation(summary = "User login", description = "Authenticate user and return JWT token")
    @ApiResponses(
        value = [
            ApiResponse(responseCode = "200", description = "Login successful"),
            ApiResponse(responseCode = "400", description = "Bad request"),
            ApiResponse(responseCode = "401", description = "Unauthorized (Wrong password or Account Deleted)")
        ]
    )
    @PostMapping("/login")
    fun login(@RequestBody payload: LoginReqDto) =
        handleRequest {
            if (payload.username.isEmpty() || payload.password.isEmpty()) {
                throw BadRequestException("Username or password cannot be empty.")
            }
            authService.login(payload)
        }

    @Operation(summary = "User registration", description = "Register a new user and send verification email")
    @ApiResponses(
        value = [
            ApiResponse(responseCode = "200", description = "Registration successful"),
            ApiResponse(responseCode = "409", description = "User already exists")
        ]
    )
    @PostMapping("/register")
    fun signup(@RequestBody payload: RegisterReqDto) =
        handleRequest {
            if (payload.username.isEmpty() || payload.password.isEmpty()) {
                throw BadRequestException("Username or password cannot be empty.")
            }
            authService.register(payload)
        }

    @Operation(summary = "Verify Account", description = "Verifies email token")
    @GetMapping("/verify")
    fun verify(@RequestParam token: String) =
        handleRequest {
            authService.verifyAccount(token)
        }

    // --- NEW ENDPOINT ---
    @Operation(
        summary = "Restore deleted account",
        description = "Reactivates a soft-deleted account. Requires valid Username and Password."
    )
    @ApiResponses(
        value = [
            ApiResponse(responseCode = "200", description = "Account restored successfully"),
            ApiResponse(responseCode = "401", description = "Invalid credentials"),
            ApiResponse(responseCode = "400", description = "Account is already active")
        ]
    )
    @PostMapping("/restore")
    fun restore(@RequestBody payload: LoginReqDto) =
        handleRequest {
            authService.restoreAccount(payload)
            mapOf("message" to "Account restored successfully. You can now log in.")
        }
}