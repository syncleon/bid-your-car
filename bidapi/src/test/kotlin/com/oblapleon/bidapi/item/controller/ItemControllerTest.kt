package com.oblapleon.bidapi.feature.item.controller

import com.fasterxml.jackson.databind.ObjectMapper
import com.oblapleon.bidapi.common.exception.ForbiddenException
import com.oblapleon.bidapi.common.exception.NotFoundException
import com.oblapleon.bidapi.feature.item.dto.ItemCreateRequest
import com.oblapleon.bidapi.feature.item.dto.ItemUpdateRequest
import com.oblapleon.bidapi.feature.item.entity.Item
import com.oblapleon.bidapi.feature.item.entity.ItemStatus
import com.oblapleon.bidapi.feature.item.service.ItemService
import com.oblapleon.bidapi.feature.user.entity.User
import com.oblapleon.bidapi.feature.user.service.UserService
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.eq
import org.mockito.kotlin.whenever
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext
import org.springframework.http.MediaType
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.util.*

@WebMvcTest(ItemController::class)
@AutoConfigureMockMvc(addFilters = false) // Disable Security Filter Chain for faster testing
@MockBean(JpaMetamodelMappingContext::class) // Fixes "JPA metamodel must not be empty" error
class ItemControllerTest {

    @Autowired
    lateinit var mockMvc: MockMvc

    @Autowired
    lateinit var objectMapper: ObjectMapper

    @MockBean
    lateinit var itemService: ItemService

    @MockBean
    lateinit var userService: UserService

    private lateinit var testUser: User
    private lateinit var testItem: Item
    private val itemId = UUID.randomUUID()

    // ✅ KEY FIX 1: Create a Principal that is explicitly a String ("testuser")
    // This allows @AuthenticationPrincipal username: String to resolve correctly without NPE.
    private val mockAuth = UsernamePasswordAuthenticationToken(
        "testuser", // Principal is String
        "token",
        listOf(SimpleGrantedAuthority("ROLE_USER"))
    )

    @BeforeEach
    fun setup() {
        testUser = User(id = 1L, username = "testuser", email = "test@test.com", password = "pw", enabled = true)

        testItem = Item(
            id = itemId,
            seller = testUser,
            year = 2022,
            make = "Toyota",
            model = "Camry",
            vin = "12345678901234567", // 17 chars
            location = "New York",
            mileage = 10000,
            status = ItemStatus.AVAILABLE,
            description = "Great car"
        )
    }

    // ========================================================================
    //  PUBLIC ENDPOINTS
    // ========================================================================

    @Test
    fun `getAllItems - should return paginated list`() {
        val page = PageImpl(listOf(testItem))
        whenever(itemService.findAllAvailable(any<Pageable>())).thenReturn(page)

        mockMvc.perform(get("/api/v1/items")
            .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.content[0].make").value("Toyota"))
    }

    @Test
    fun `getItemById - should return 404 Not Found for invalid ID`() {
        // 1. ARRANGE: Generate a random UUID and tell the mock service to throw your custom exception
        val nonExistentId = UUID.randomUUID()
        whenever(itemService.findById(nonExistentId)).thenThrow(NotFoundException("Item not found"))

        // 2 & 3. ACT & ASSERT: Make the request and verify the GlobalExceptionHandler takes over
        mockMvc.perform(get("/api/v1/items/$nonExistentId")
            .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNotFound)

            // Verify the JSON structure matches your custom ErrorResponse format
            .andExpect(jsonPath("$.status").value(404))
            .andExpect(jsonPath("$.error").value("Not Found"))
            .andExpect(jsonPath("$.message").value("Item not found"))
            .andExpect(jsonPath("$.timestamp").exists())
    }

    // ========================================================================
    //  PROTECTED ENDPOINTS
    // ========================================================================

    @Test
    fun `createItem - should create and return item`() {
        // ✅ KEY FIX 2: Valid VIN (17 chars) to avoid 400 Bad Request
        val request = ItemCreateRequest(
            year = 2022, make = "Toyota", model = "Camry",
            vin = "12345678901234567", mileage = 10000, location = "New York"
        )

        whenever(userService.findByUsername("testuser")).thenReturn(testUser)
        whenever(itemService.create(eq(testUser), any())).thenReturn(testItem)

        // ✅ KEY FIX 3: Apply .with(authentication(mockAuth)) instead of @WithMockUser
        mockMvc.perform(post("/api/v1/items")
            .with(authentication(mockAuth))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.make").value("Toyota"))
    }

    @Test
    fun `updateItem - should update if owner`() {
        val request = ItemUpdateRequest(description = "Updated Description")
        testItem.description = "Updated Description"

        whenever(userService.findByUsername("testuser")).thenReturn(testUser)
        whenever(itemService.update(eq(itemId), eq(testUser), any())).thenReturn(testItem)

        // ✅ KEY FIX 3: Apply .with(authentication(mockAuth)) here too
        mockMvc.perform(put("/api/v1/items/$itemId")
            .with(authentication(mockAuth))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.description").value("Updated Description"))
    }

    @Test
    fun `deleteItem - should return 403 if not owner`() {
        // Mock a different user (Hacker)
        val hackerAuth = UsernamePasswordAuthenticationToken("hacker", "pw", listOf())
        val hackerUser = User(id=2L, username="hacker", email="h@h.com", password="pw")

        whenever(userService.findByUsername("hacker")).thenReturn(hackerUser)
        whenever(itemService.delete(itemId, hackerUser)).thenThrow(ForbiddenException("Not owner"))

        // ✅ KEY FIX 3: Apply hackerAuth
        mockMvc.perform(delete("/api/v1/items/$itemId")
            .with(authentication(hackerAuth)))
            .andExpect(status().isForbidden)
    }
}