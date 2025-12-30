package com.oblapleon.bidapi.feature.user.controller

import com.oblapleon.bidapi.common.controller.BaseController
import com.oblapleon.bidapi.common.exceptions.AlreadyExistsException
import com.oblapleon.bidapi.common.exceptions.BadRequestException
import com.oblapleon.bidapi.common.exceptions.UnauthorizedException
import com.oblapleon.bidapi.common.security.Hashing
import com.oblapleon.bidapi.common.security.JwtTokenProvider
import com.oblapleon.bidapi.feature.user.dto.AuthRespDto
import com.oblapleon.bidapi.feature.user.dto.LoginReqDto
import com.oblapleon.bidapi.feature.user.dto.RegisterReqDto
import com.oblapleon.bidapi.feature.user.entity.ERole
import com.oblapleon.bidapi.feature.user.entity.User
import com.oblapleon.bidapi.feature.user.repo.RoleRepo
import com.oblapleon.bidapi.feature.user.service.UserService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Authentication", description = "Endpoints for user login and registration")
class AuthController(
    private val hashing: Hashing,
    private val jwtTokenProvider: JwtTokenProvider,
    private val userService: UserService,
    private val roleRepo: RoleRepo
) : BaseController() {

    @Operation(summary = "User login", description = "Authenticate user and return JWT token")
    @ApiResponses(
        value = [
            ApiResponse(responseCode = "200", description = "Login successful"),
            ApiResponse(responseCode = "400", description = "Bad request"),
            ApiResponse(responseCode = "401", description = "Unauthorized")
        ]
    )
    @PostMapping("/login")
    fun login(@RequestBody payload: LoginReqDto) =
        handleRequest {
            if (payload.username.isEmpty() || payload.password.isEmpty()) {
                throw BadRequestException("Username or password cannot be empty.")
            }

            val user = userService.findByName(payload.username)
            val userPassword = user.password

            if (!hashing.checkBcrypt(payload.password, userPassword)) {
                throw UnauthorizedException("Incorrect password.")
            }

            AuthRespDto(token = jwtTokenProvider.createToken(user))
        }

    @Operation(summary = "User registration", description = "Register a new user and return JWT token")
    @ApiResponses(
        value = [
            ApiResponse(responseCode = "200", description = "Registration successful"),
            ApiResponse(responseCode = "400", description = "Bad request"),
            ApiResponse(responseCode = "409", description = "Username already exists")
        ]
    )
    @PostMapping("/register")
    fun signup(@RequestBody payload: RegisterReqDto) =
        handleRequest {
            if (payload.username.isEmpty() || payload.password.isEmpty()) {
                throw BadRequestException("Username or password cannot be empty.")
            }

            if (userService.existsByName(payload.username)) {
                throw AlreadyExistsException("User with this name already exists.")
            }

            val userRole = roleRepo.findByName(ERole.ROLE_USER)
            val user = User(
                username = payload.username,
                password = hashing.hashBcrypt(payload.password),
                email = payload.email,
                roles = mutableSetOf(userRole)
            )

            val savedUser = userService.save(user)

            AuthRespDto(token = jwtTokenProvider.createToken(savedUser))
        }
}
