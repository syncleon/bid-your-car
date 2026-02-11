package com.oblapleon.bidapi.feature.user.service

import com.oblapleon.bidapi.common.exception.ConflictException
import com.oblapleon.bidapi.feature.auction.repository.AuctionRepository
import com.oblapleon.bidapi.feature.user.dto.UpdateUserReqDto
import com.oblapleon.bidapi.feature.user.entity.User
import com.oblapleon.bidapi.feature.user.repository.UserRepository
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
import java.util.*

@ExtendWith(MockitoExtension::class)
class UserServiceTest {

    @Mock lateinit var userRepository: UserRepository
    @Mock lateinit var auctionRepository: AuctionRepository
    @Mock lateinit var passwordEncoder: PasswordEncoder

    @InjectMocks
    lateinit var userService: UserService

    @Test
    fun `updateUser - should update fields`() {
        val user = User(id = 1L, username = "old", email = "old@test.com", password = "pw")
        val req = UpdateUserReqDto(username = "new", email = "new@test.com", password = null)

        whenever(userRepository.findById(1L)).thenReturn(Optional.of(user))
        whenever(userRepository.existsByUsername("new")).thenReturn(false)
        whenever(userRepository.existsByEmail("new@test.com")).thenReturn(false)
        whenever(userRepository.save(any<User>())).thenAnswer { it.arguments[0] }

        val updated = userService.updateUser(1L, req, isSelfUpdate = true)

        assertEquals("new", updated.username)
        assertEquals("new@test.com", updated.email)
    }

    @Test
    fun `deleteMyAccount - should soft delete if password correct`() {
        val user = User(id = 1L, username = "del", email = "del@test.com", password = "encoded_pw", deletedAt = null)

        whenever(userRepository.findById(1L)).thenReturn(Optional.of(user))
        whenever(passwordEncoder.matches("password", "encoded_pw")).thenReturn(true)
        whenever(auctionRepository.existsBySellerIdAndStatusAndBidsIsNotEmpty(1L)).thenReturn(false)

        userService.deleteMyAccount(1L, "password")

        assertNotNull(user.deletedAt) // Verify Soft Delete timestamp
        verify(auctionRepository).cancelAllActiveAuctionsBySellerId(1L)
        verify(userRepository).save(user)
    }

    @Test
    fun `deleteMyAccount - should fail if active bids exist`() {
        val user = User(id = 1L, username = "del", email = "del@test.com", password = "encoded_pw")

        whenever(userRepository.findById(1L)).thenReturn(Optional.of(user))
        whenever(passwordEncoder.matches("password", "encoded_pw")).thenReturn(true)
        // Simulate active auctions with bids
        whenever(auctionRepository.existsBySellerIdAndStatusAndBidsIsNotEmpty(1L)).thenReturn(true)

        assertThrows<ConflictException> {
            userService.deleteMyAccount(1L, "password")
        }
    }
}