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
@Tag(name = "Authentication", description = "Endpoints for user login and registration")
class AuthController(
    private val authService: AuthService
) : BaseController() {

    @Operation(summary = "User login", description = "Authenticate user and return JWT token")
    @ApiResponses(
        value = [
            ApiResponse(responseCode = "200", description = "Login successful"),
            ApiResponse(responseCode = "400", description = "Bad request"),
            ApiResponse(responseCode = "401", description = "Unauthorized or Unverified")
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
            ApiResponse(responseCode = "200", description = "Registration successful (Email sent)"),
            ApiResponse(responseCode = "400", description = "Bad request"),
            ApiResponse(responseCode = "409", description = "Username/Email already exists")
        ]
    )
    @PostMapping("/register")
    fun signup(@RequestBody payload: RegisterReqDto) =
        handleRequest {
            if (payload.username.isEmpty() || payload.password.isEmpty()) {
                throw BadRequestException("Username or password cannot be empty.")
            }
            // Returns a string message instead of a token
            authService.register(payload)
        }

    @Operation(summary = "Verify Account", description = "Verifies email token")
    @GetMapping("/verify")
    fun verify(@RequestParam token: String) =
        handleRequest {
            authService.verifyAccount(token)
        }
}