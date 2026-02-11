package com.oblapleon.bidapi.user.service

import com.oblapleon.bidapi.common.exception.AlreadyExistsException
import com.oblapleon.bidapi.common.exception.BadRequestException
import com.oblapleon.bidapi.common.exception.UnauthorizedException
import com.oblapleon.bidapi.common.security.JwtTokenProvider
import com.oblapleon.bidapi.common.service.EmailService
import com.oblapleon.bidapi.feature.user.dto.LoginReqDto
import com.oblapleon.bidapi.feature.user.dto.RegisterReqDto
import com.oblapleon.bidapi.feature.user.entity.ERole
import com.oblapleon.bidapi.feature.user.entity.Role
import com.oblapleon.bidapi.feature.user.entity.User
import com.oblapleon.bidapi.feature.user.entity.VerificationToken
import com.oblapleon.bidapi.feature.user.repository.RoleRepository
import com.oblapleon.bidapi.feature.user.repository.UserRepository
import com.oblapleon.bidapi.feature.user.repository.VerificationTokenRepository
import com.oblapleon.bidapi.feature.user.service.AuthService
import com.oblapleon.bidapi.feature.user.service.UserService
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.InjectMocks
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.kotlin.any
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.springframework.security.crypto.password.PasswordEncoder

@ExtendWith(MockitoExtension::class)
class AuthServiceTest {

    @Mock lateinit var userRepository: UserRepository
    @Mock lateinit var roleRepository: RoleRepository
    @Mock lateinit var verificationTokenRepository: VerificationTokenRepository
    @Mock lateinit var emailService: EmailService
    @Mock lateinit var passwordEncoder: PasswordEncoder
    @Mock lateinit var jwtTokenProvider: JwtTokenProvider
    @Mock lateinit var userService: UserService

    @InjectMocks
    lateinit var authService: AuthService

    @Test
    fun `register - should succeed`() {
        val req = RegisterReqDto("newuser", "new@test.com", "password")
        val userRole = Role(id = 1, name = ERole.USER)

        whenever(userRepository.existsByUsername(req.username!!)).thenReturn(false)
        whenever(userRepository.existsByEmail(req.email!!)).thenReturn(false)
        whenever(roleRepository.findByName(ERole.USER)).thenReturn(userRole)
        whenever(passwordEncoder.encode(req.password)).thenReturn("encoded")
        
        // Mock saving user
        whenever(userRepository.save(any<User>())).thenAnswer { 
            val u = it.arguments[0] as User
            u.id = 1L
            u 
        }

        val result = authService.register(req)

        assertEquals("Registration successful. Please check your email to verify your account.", result)
        verify(emailService).sendVerificationEmail(any(), any())
        verify(verificationTokenRepository).save(any<VerificationToken>())
    }

    @Test
    fun `register - should fail if username taken`() {
        val req = RegisterReqDto("taken", "test@test.com", "pw")
        whenever(userRepository.existsByUsername("taken")).thenReturn(true)

        assertThrows<AlreadyExistsException> { authService.register(req) }
    }

    @Test
    fun `login - should return token if valid`() {
        val req = LoginReqDto("valid", "password")
        val user = User(id=1, username="valid", password="encoded_pw", email="t@t.com", enabled=true)

        whenever(userRepository.findByUsername("valid")).thenReturn(user)
        whenever(passwordEncoder.matches("password", "encoded_pw")).thenReturn(true)
        whenever(jwtTokenProvider.createToken(user)).thenReturn("jwt_token_123")

        val result = authService.login(req)
        assertEquals("jwt_token_123", result.token)
    }

    @Test
    fun `login - should fail if password wrong`() {
        val req = LoginReqDto("valid", "wrong")
        val user = User(id=1, username="valid", password="encoded_pw", email="t@t.com", enabled=true)

        whenever(userRepository.findByUsername("valid")).thenReturn(user)
        whenever(passwordEncoder.matches("wrong", "encoded_pw")).thenReturn(false)

        assertThrows<UnauthorizedException> { authService.login(req) }
    }
}