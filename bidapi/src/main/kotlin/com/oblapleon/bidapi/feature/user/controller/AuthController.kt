package com.oblapleon.bidapi.feature.user.controller

import com.oblapleon.bidapi.common.exceptions.*
import com.oblapleon.bidapi.common.security.Hashing
import com.oblapleon.bidapi.common.security.JwtTokenProvider
import com.oblapleon.bidapi.feature.user.dto.AuthRespDto
import com.oblapleon.bidapi.feature.user.dto.LoginReqDto
import com.oblapleon.bidapi.feature.user.dto.RegisterReqDto
import com.oblapleon.bidapi.feature.user.entity.ERole
import com.oblapleon.bidapi.feature.user.entity.Role
import com.oblapleon.bidapi.feature.user.entity.User
import com.oblapleon.bidapi.feature.user.repo.RoleRepo
import com.oblapleon.bidapi.feature.user.service.UserService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1")
class AuthController (
    private val hashing: Hashing,
    private val jwtTokenProvider: JwtTokenProvider,
    private val userService: UserService,
    private val roleRepo: RoleRepo
) {

    @PostMapping("/login")
    fun login(@RequestBody payload: LoginReqDto): ResponseEntity<Any> {
        return handleAuthRequest {
            if (payload.username.isEmpty() || payload.password.isEmpty()) {
                throw BadRequestException("Username or password cannot be empty.")
            }
            if (!userService.existsByName(payload.username)) {
                throw NotFoundException("User not found.")
            }
            val user = userService.findByName(payload.username)
            if (!hashing.checkBcrypt(payload.password, user.password)) {
                throw UnauthorizedException("Incorrect password.")
            }
            AuthRespDto(
                token = jwtTokenProvider.createToken(user)
            )
        }
    }

    @PostMapping("/register")
    fun signup(@RequestBody payload: RegisterReqDto): ResponseEntity<Any> {
        return handleAuthRequest {
            val userRole = roleRepo.findByName(ERole.ROLE_USER)
            val roles = mutableSetOf<Role>()
            if (payload.username.isEmpty() || payload.password.isEmpty()) {
                throw BadRequestException("Username or password cannot be empty.")
            }
            if (userService.existsByName(payload.username)) {
                throw AlreadyExistsException("User with this name already exists.")
            }
            val user = User(
                username = payload.username,
                password = hashing.hashBcrypt(payload.password),
                email = payload.email
            )
            roles.add(userRole)
            user.roles = roles
            val savedUser = userService.save(user)

            AuthRespDto(
                token = jwtTokenProvider.createToken(savedUser)
            )
        }
    }

    private fun handleAuthRequest(action: () -> Any): ResponseEntity<Any> {
        return try {
            val response = action()
            ResponseEntity.ok().body(response)
        } catch (e: BadRequestException) {
            ResponseEntity.badRequest().body(e.message)
        } catch (e: NotFoundException) {
            ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.message)
        } catch (e: UnauthorizedException) {
            ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.message)
        } catch (e: AlreadyExistsException) {
            ResponseEntity.status(HttpStatus.CONFLICT).body(e.message)
        } catch (e: InvalidDataException) {
            ResponseEntity.badRequest().body(e.message)
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An unexpected error occurred.")
        }
    }
}