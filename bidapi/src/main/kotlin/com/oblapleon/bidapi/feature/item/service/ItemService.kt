package com.oblapleon.bidapi.feature.item.service

import com.oblapleon.bidapi.common.exception.AlreadyExistsException
import com.oblapleon.bidapi.common.exception.ForbiddenException
import com.oblapleon.bidapi.common.exception.NotFoundException
import com.oblapleon.bidapi.common.service.StorageService
import com.oblapleon.bidapi.feature.item.dto.ItemCreateRequest
import com.oblapleon.bidapi.feature.item.dto.ItemUpdateRequest
import com.oblapleon.bidapi.feature.item.entity.Item
import com.oblapleon.bidapi.feature.item.entity.ItemImage
import com.oblapleon.bidapi.feature.item.entity.ItemStatus
import com.oblapleon.bidapi.feature.item.repository.ItemImageRepository
import com.oblapleon.bidapi.feature.item.repository.ItemRepository
import com.oblapleon.bidapi.feature.user.entity.ERole
import com.oblapleon.bidapi.feature.user.entity.User
import org.slf4j.LoggerFactory
import org.springframework.cache.annotation.CacheEvict
import org.springframework.cache.annotation.Cacheable
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import java.util.UUID

/**
 * Service responsible for managing the lifecycle of vehicle inventory items.
 * Handles creation, updates, deletion, image management, and ownership validation.
 */
@Service
class ItemService(
    private val itemRepository: ItemRepository,
    private val itemImageRepository: ItemImageRepository,
    private val storageService: StorageService
) {

    private val logger = LoggerFactory.getLogger(ItemService::class.java)

    /**
     * Retrieves an item by its UUID.
     *
     * @param id The unique identifier of the item.
     * @return The requested Item entity.
     * @throws NotFoundException if the item does not exist or if the seller's account has been deleted.
     */
    @Cacheable(value = ["items"], key = "#id")
    fun findById(id: UUID): Item {
        val item = itemRepository.findById(id)
            .orElseThrow { NotFoundException("Item not found") }

        if (item.seller.deletedAt != null) {
            throw NotFoundException("Item listing is no longer available.")
        }
        return item
    }

    /**
     * Retrieves a paginated list of items that are approved and available for public viewing.
     *
     * @param pageable Pagination information.
     * @return A page of available items.
     */
    fun findAllAvailable(pageable: Pageable): Page<Item> {
        return itemRepository.findAllByStatus(ItemStatus.AVAILABLE, pageable)
    }

    /**
     * Retrieves all items associated with a specific seller, regardless of status.
     * Used primarily for seller dashboards.
     *
     * @param sellerId The ID of the seller.
     * @param pageable Pagination information.
     * @return A page of the seller's items.
     */
    fun findAllBySellerId(sellerId: Long, pageable: Pageable): Page<Item> {
        return itemRepository.findAllBySellerId(sellerId, pageable)
    }

    /**
     * Creates a new item listing.
     * The item is initialized with a PENDING_REVIEW status.
     *
     * @param currentUser The user attempting to create the listing.
     * @param request The data transfer object containing item details.
     * @return The persisted Item entity.
     * @throws AlreadyExistsException if a vehicle with the same VIN is already listed.
     */
    @Transactional
    fun create(currentUser: User, request: ItemCreateRequest): Item {
        if (itemRepository.existsByVin(request.vin)) {
            throw AlreadyExistsException("Vehicle with VIN ${request.vin} is already listed.")
        }

        val newItem = Item(
            seller = currentUser,
            status = ItemStatus.PENDING_REVIEW,
            year = request.year,
            make = request.make,
            model = request.model,
            vin = request.vin,
            location = request.location,
            mileage = request.mileage,
            description = request.description,
            engine = request.engine,
            drivetrain = request.drivetrain,
            transmission = request.transmission,
            bodyStyle = request.bodyStyle,
            exteriorColor = request.exteriorColor,
            interiorColor = request.interiorColor,
            sellerType = request.sellerType
        )

        return itemRepository.save(newItem)
    }

    /**
     * Updates an existing item listing.
     * Handles updating vehicle specifications and synchronizing the image gallery.
     *
     * @param id The UUID of the item to update.
     * @param currentUser The user attempting the update (must be owner or admin).
     * @param request The update payload containing modified fields and image retention logic.
     * @return The updated Item entity.
     * @throws ForbiddenException if the current user is not the owner or an admin.
     */
    @CacheEvict(value = ["items"], key = "#id")
    @Transactional
    fun update(id: UUID, currentUser: User, request: ItemUpdateRequest): Item {
        val item = findById(id)

        validateOwnership(item, currentUser)

        request.year?.let { item.year = it }
        request.make?.let { item.make = it }
        request.model?.let { item.model = it }
        request.mileage?.let { item.mileage = it }
        request.location?.let { item.location = it }
        request.description?.let { item.description = it }

        request.engine?.let { item.engine = it }
        request.drivetrain?.let { item.drivetrain = it }
        request.transmission?.let { item.transmission = it }
        request.bodyStyle?.let { item.bodyStyle = it }
        request.exteriorColor?.let { item.exteriorColor = it }
        request.interiorColor?.let { item.interiorColor = it }
        request.sellerType?.let { item.sellerType = it }

        request.keepImageIds?.let { keepIds ->
            val imagesToRemove = item.images.filter { it.id !in keepIds }

            item.images.removeAll(imagesToRemove)

            imagesToRemove.forEach { image ->
                safelyDeleteFile(image.url)
            }

            itemImageRepository.deleteAll(imagesToRemove)

            if (imagesToRemove.any { it.url == item.thumbnailUrl }) {
                item.thumbnailUrl = item.images.sortedBy { it.sortOrder }.firstOrNull()?.url
            }
        }

        return itemRepository.save(item)
    }

    /**
     * Permanently deletes an item and its associated images from storage.
     *
     * @param id The UUID of the item to delete.
     * @param currentUser The user attempting the deletion.
     * @throws ForbiddenException if the current user is not the owner or an admin.
     */
    @Transactional
    @CacheEvict(value = ["items"], key = "#id")
    fun delete(id: UUID, currentUser: User) {
        val item = itemRepository.findById(id).orElseThrow { NotFoundException("Item not found") }

        validateOwnership(item, currentUser)

        item.images.forEach { safelyDeleteFile(it.url) }

        itemRepository.delete(item)
    }

    /**
     * Uploads an image to cloud storage and associates it with the item.
     * If the item has no thumbnail, the uploaded image becomes the default thumbnail.
     *
     * @param itemId The UUID of the item.
     * @param currentUser The user uploading the image.
     * @param file The multipart file to upload.
     * @return The created ItemImage entity.
     */
    @Transactional
    fun uploadImage(itemId: UUID, currentUser: User, file: MultipartFile): ItemImage {
        val item = findById(itemId)
        validateOwnership(item, currentUser)

        val imageUrl = storageService.uploadFile(file)

        val image = ItemImage(
            url = imageUrl,
            item = item,
            sortOrder = item.images.size
        )

        item.addImage(image)

        return itemImageRepository.save(image)
    }

    /**
     * Validates that the current user has permission to modify the item.
     * Only the original seller or an administrator can modify items.
     */
    private fun validateOwnership(item: Item, user: User) {
        val isOwner = item.seller.id == user.id
        val isAdmin = user.roles.any { it.name == ERole.ADMIN }

        if (!isOwner && !isAdmin) {
            throw ForbiddenException("You are not authorized to modify this item.")
        }
    }

    /**
     * Attempts to delete a file from cloud storage safely.
     * Errors are logged but swallowed to prevent rolling back database transactions
     * during cleanup operations.
     */
    private fun safelyDeleteFile(url: String) {
        try {
            storageService.deleteFile(url)
        } catch (e: Exception) {
            logger.error("Failed to delete file from storage: $url", e)
        }
    }
}