package com.oblapleon.bidapi.feature.user.controller

import com.fasterxml.jackson.databind.ObjectMapper
import com.oblapleon.bidapi.common.config.SecurityConfig
import com.oblapleon.bidapi.common.helpers.AuthorizationHelper
import com.oblapleon.bidapi.common.security.JwtTokenProvider
import com.oblapleon.bidapi.common.service.RateLimitingService
import com.oblapleon.bidapi.feature.item.service.ItemService
import com.oblapleon.bidapi.feature.user.entity.User
import com.oblapleon.bidapi.feature.user.security.HttpCookieOAuth2AuthorizationRequestRepository
import com.oblapleon.bidapi.feature.user.security.OAuth2LoginSuccessHandler
import com.oblapleon.bidapi.feature.user.service.UserService
import com.oblapleon.bidapi.feature.user.repository.UserRepository
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
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@WebMvcTest(UserController::class)
@Import(SecurityConfig::class)
class UserControllerTest {

    @Autowired
    lateinit var mockMvc: MockMvc

    @MockBean
    lateinit var userRepository: UserRepository

    @Autowired
    lateinit var objectMapper: ObjectMapper

    @MockBean
    lateinit var userService: UserService

    @MockBean
    lateinit var itemService: ItemService

    @MockBean
    lateinit var rateLimitingService: RateLimitingService

    @MockBean
    lateinit var authorizationHelper: AuthorizationHelper

    @MockBean
    lateinit var jwtTokenProvider: JwtTokenProvider

    @MockBean
    lateinit var jwtDecoder: JwtDecoder

    @MockBean
    lateinit var oAuth2LoginSuccessHandler: OAuth2LoginSuccessHandler

    @MockBean
    lateinit var httpCookieOAuth2AuthorizationRequestRepository: HttpCookieOAuth2AuthorizationRequestRepository

    @Test
    @org.springframework.security.test.context.support.WithMockUser
    fun `getCurrentUser should return user profile`() {
        val user = User(username = "testuser", email = "test@example.com", password = "pw")
        user.id = 1L

        whenever(authorizationHelper.getCurrentUser()).thenReturn(user)

        mockMvc.perform(
            get("/api/v1/users/me")
                .contentType(MediaType.APPLICATION_JSON)
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.id").value(user.id))
            .andExpect(jsonPath("$.username").value(user.username))
            .andExpect(jsonPath("$.email").value(user.email))
    }
}
