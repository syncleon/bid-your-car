package com.oblapleon.bidapi.feature.item.service

import com.oblapleon.bidapi.common.exception.AlreadyExistsException
import com.oblapleon.bidapi.common.exception.ForbiddenException
import com.oblapleon.bidapi.common.service.StorageService
import com.oblapleon.bidapi.feature.item.dto.ItemCreateRequest
import com.oblapleon.bidapi.feature.item.dto.ItemUpdateRequest
import com.oblapleon.bidapi.feature.item.entity.Item
import com.oblapleon.bidapi.feature.item.entity.ItemStatus
import com.oblapleon.bidapi.feature.item.repository.ItemImageRepository
import com.oblapleon.bidapi.feature.item.repository.ItemRepository
import com.oblapleon.bidapi.feature.user.entity.User
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.InjectMocks
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.kotlin.any
import org.mockito.kotlin.times
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import java.util.*

@ExtendWith(MockitoExtension::class)
class ItemServiceTest {

    @Mock lateinit var itemRepository: ItemRepository
    @Mock lateinit var itemImageRepository: ItemImageRepository
    @Mock lateinit var storageService: StorageService

    @InjectMocks
    lateinit var itemService: ItemService

    private lateinit var seller: User
    private lateinit var otherUser: User
    private lateinit var item: Item

    @BeforeEach
    fun setup() {
        seller = User(id = 1L, username = "Seller", email = "seller@test.com", password = "pw", enabled = true)
        otherUser = User(id = 2L, username = "Hacker", email = "hacker@test.com", password = "pw", enabled = true)

        item = Item(
            id = UUID.randomUUID(),
            seller = seller,
            status = ItemStatus.AVAILABLE,
            year = 2022,
            make = "Honda",
            model = "Civic",
            vin = "VIN123456789",
            location = "LA",
            mileage = 5000
        )
    }

    @Test
    fun `create - should succeed if VIN is unique`() {
        val req = ItemCreateRequest(
            year = 2022, make = "Honda", model = "Civic",
            vin = "VIN123", mileage = 5000, location = "LA"
        )

        whenever(itemRepository.existsByVin(req.vin)).thenReturn(false)
        whenever(itemRepository.save(any<Item>())).thenAnswer { it.arguments[0] }

        val result = itemService.create(seller, req)

        assertEquals(ItemStatus.PENDING_REVIEW, result.status)
        assertEquals("VIN123", result.vin)
        assertEquals(seller, result.seller)
    }

    @Test
    fun `create - should fail if VIN exists`() {
        val req = ItemCreateRequest(
            year = 2022, make = "Honda", model = "Civic",
            vin = "DUPLICATE", mileage = 5000, location = "LA"
        )

        whenever(itemRepository.existsByVin(req.vin)).thenReturn(true)

        assertThrows<AlreadyExistsException> {
            itemService.create(seller, req)
        }
    }

    @Test
    fun `update - should succeed if user is owner`() {
        val req = ItemUpdateRequest(mileage = 6000, description = "Updated desc")

        whenever(itemRepository.findById(item.id!!)).thenReturn(Optional.of(item))
        whenever(itemRepository.save(any<Item>())).thenAnswer { it.arguments[0] }

        val result = itemService.update(item.id!!, seller, req)

        assertEquals(6000, result.mileage)
        assertEquals("Updated desc", result.description)
    }

    @Test
    fun `update - should fail if user is not owner`() {
        val req = ItemUpdateRequest(mileage = 999999)

        whenever(itemRepository.findById(item.id!!)).thenReturn(Optional.of(item))

        assertThrows<ForbiddenException> {
            itemService.update(item.id!!, otherUser, req)
        }
    }

    @Test
    fun `delete - should cleanup storage and delete entity`() {
        whenever(itemRepository.findById(item.id!!)).thenReturn(Optional.of(item))

        // Add dummy images to verify cleanup logic
        item.images.add(com.oblapleon.bidapi.feature.item.entity.ItemImage(url="http://img1.jpg", item=item))

        itemService.delete(item.id!!, seller)

        // Verify storage service was called to delete the file
        verify(storageService, times(1)).deleteFile(any())
        verify(itemRepository).delete(item)
    }
}