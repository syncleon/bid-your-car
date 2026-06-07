package com.oblapleon.bidapi.feature.user.controller

import com.fasterxml.jackson.databind.ObjectMapper
import com.oblapleon.bidapi.common.config.SecurityConfig
import com.oblapleon.bidapi.common.security.JwtTokenProvider
import com.oblapleon.bidapi.feature.user.dto.AuthRespDto
import com.oblapleon.bidapi.feature.user.dto.LoginReqDto
import com.oblapleon.bidapi.feature.user.dto.RegisterReqDto
import com.oblapleon.bidapi.feature.user.security.OAuth2LoginSuccessHandler
import com.oblapleon.bidapi.feature.user.service.AuthService
import org.junit.jupiter.api.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.whenever
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.context.annotation.Import
import org.springframework.http.MediaType
import org.springframework.security.oauth2.jwt.JwtDecoder
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*

@WebMvcTest(AuthController::class)
@Import(SecurityConfig::class)
class AuthControllerTest {

    @Autowired
    lateinit var mockMvc: MockMvc

    @Autowired
    lateinit var objectMapper: ObjectMapper

    @MockBean
    lateinit var authService: AuthService

    @MockBean
    lateinit var jwtTokenProvider: JwtTokenProvider

    @MockBean
    lateinit var jwtDecoder: JwtDecoder

    @MockBean
    lateinit var oAuth2LoginSuccessHandler: OAuth2LoginSuccessHandler

    @Test
    fun `login should return success and set cookie on valid credentials`() {
        val reqDto = LoginReqDto("testuser", "password123")
        val tokenResponse = AuthRespDto("fake-jwt-token")

        whenever(authService.login(any())).thenReturn(tokenResponse)

        mockMvc.perform(
            post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reqDto))
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.message").value("Login successful"))
            .andExpect(cookie().exists("__session"))
            .andExpect(cookie().value("__session", "fake-jwt-token"))
    }

    @Test
    fun `register should return created status on valid payload`() {
        val reqDto = RegisterReqDto("testuser", "password123", "test@test.com")
        
        whenever(authService.register(any())).thenReturn("Registration successful.")

        mockMvc.perform(
            post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reqDto))
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.message").value("Registration successful."))
    }

    @Test
    fun `login should fail on validation error`() {
        val reqDto = LoginReqDto("", "") // Invalid: empty fields

        mockMvc.perform(
            post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reqDto))
        )
            .andExpect(status().isBadRequest)
    }
}
