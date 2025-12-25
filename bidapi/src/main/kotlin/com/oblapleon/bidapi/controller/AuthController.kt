package com.oblapleon.bidapi.controller

import com.oblapleon.bidapi.dto.LoginResponseDto
import com.oblapleon.bidapi.dto.LoginUserDto
import com.oblapleon.bidapi.dto.RegisterNewUserDto
import com.oblapleon.bidapi.entity.ERole
import com.oblapleon.bidapi.entity.RoleEntity
import com.oblapleon.bidapi.entity.UserEntity
import com.oblapleon.bidapi.exceptions.AlreadyExistsException
import com.oblapleon.bidapi.exceptions.InvalidDataException
import com.oblapleon.bidapi.exceptions.NotFoundException
import com.oblapleon.bidapi.exceptions.UnauthorizedException
import com.oblapleon.bidapi.repository.RoleRepository
import com.oblapleon.bidapi.security.Hashing
import com.oblapleon.bidapi.security.JwtTokenProvider
import com.oblapleon.bidapi.service.UserService
import org.apache.coyote.BadRequestException
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
    private val roleRepository: RoleRepository
) {

    @PostMapping("/login")
    fun login(@RequestBody payload: LoginUserDto): ResponseEntity<Any> {
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
            LoginResponseDto(
                token = jwtTokenProvider.createToken(user)
            )
        }
    }

    @PostMapping("/register")
    fun signup(@RequestBody payload: RegisterNewUserDto): ResponseEntity<Any> {
        return handleAuthRequest {
            val userRole = roleRepository.findByName(ERole.ROLE_USER)
            val roles = mutableSetOf<RoleEntity>()
            if (payload.username.isEmpty() || payload.password.isEmpty()) {
                throw BadRequestException("Username or password cannot be empty.")
            }
            if (userService.existsByName(payload.username)) {
                throw AlreadyExistsException("User with this name already exists.")
            }
            val user = UserEntity(
                username = payload.username,
                password = hashing.hashBcrypt(payload.password),
                email = payload.email
            )
            roles.add(userRole)
            user.roles = roles
            val savedUser = userService.save(user)

            LoginResponseDto(
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