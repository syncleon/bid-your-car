package com.oblapleon.bidapi.feature.item.service

import com.oblapleon.bidapi.common.exception.AlreadyExistsException
import com.oblapleon.bidapi.common.exception.ConflictException
import com.oblapleon.bidapi.common.exception.NotFoundException
import com.oblapleon.bidapi.common.helpers.AuthorizationHelper
import com.oblapleon.bidapi.common.service.StorageService
import com.oblapleon.bidapi.feature.auction.repository.AuctionRepository
import com.oblapleon.bidapi.feature.item.dto.ItemCreateRequest
import com.oblapleon.bidapi.feature.item.dto.ItemUpdateRequest
import com.oblapleon.bidapi.feature.item.entity.ImageCategory
import com.oblapleon.bidapi.feature.item.entity.Item
import com.oblapleon.bidapi.feature.item.entity.ItemImage
import com.oblapleon.bidapi.feature.item.entity.ItemStatus
import com.oblapleon.bidapi.feature.item.repository.ItemImageRepository
import com.oblapleon.bidapi.feature.item.repository.ItemRepository
import com.oblapleon.bidapi.feature.user.entity.ERole
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import java.util.UUID

/**
 * Service responsible for managing user INVENTORY (Items).
 * * Access to items in this service is strictly restricted to their owners (Sellers)
 * and Administrators. This acts as a private "garage" management tool.
 * Public access to live vehicle listings should be handled exclusively through the AuctionService.
 */
@Service
class ItemService(
    private val itemRepository: ItemRepository,
    private val auctionRepository: AuctionRepository,
    private val itemImageRepository: ItemImageRepository,
    private val storageService: StorageService,
    private val authorizationHelper: AuthorizationHelper
) {

    private val logger = LoggerFactory.getLogger(ItemService::class.java)

    /**
     * Universal retrieval method with strict authorization boundary.
     * * If the requesting user is neither the owner of the item nor an admin,
     * a 404 NotFoundException is intentionally thrown instead of a 403.
     * This prevents unauthorized users from discovering the existence of private drafts via UUID enumeration.
     *
     * @param id The UUID of the requested item.
     * @return The securely retrieved Item entity.
     * @throws NotFoundException if the item does not exist, the seller is deleted, or the user lacks permission.
     */
    @Transactional(readOnly = true)
    fun findById(id: UUID): Item {
        val item = itemRepository.findById(id)
            .orElseThrow { NotFoundException("Item not found") }

        if (item.seller.deletedAt != null) {
            throw NotFoundException("Item not found")
        }

        val currentUser = authorizationHelper.getCurrentUser()
        val isOwner = item.seller.id == currentUser.id
        val isAdmin = currentUser.roles.any { it.name == ERole.ADMIN }

        if (!isOwner && !isAdmin) {
            throw NotFoundException("Item not found")
        }

        return item
    }

    /**
     * Retrieves the private inventory (garage) of a specific seller.
     * Protected by authorization checks to ensure users can only view their own inventory (or admins).
     *
     * @param sellerId The ID of the seller.
     * @param pageable Pagination configuration.
     * @return A paginated list of the seller's items.
     */
    fun findAllBySellerId(sellerId: Long, pageable: Pageable): Page<Item> {
        authorizationHelper.checkOwnerOrAdmin(sellerId)
        return itemRepository.findAllBySellerId(sellerId, pageable)
    }

    /**
     * Finds items that have been submitted and are ready to be attached to an auction.
     * This is strictly an administrative tool used in the control panel.
     *
     * @param pageable Pagination configuration.
     * @return A paginated list of items pending auction creation.
     */
    fun findReadyForAuction(pageable: Pageable): Page<Item> {
        return itemRepository.findReadyForAuction(pageable)
    }

    /**
     * Creates a new vehicle listing in the user's private inventory.
     * The item is automatically initialized with a DRAFT status.
     *
     * @param request The data transfer object containing vehicle details.
     * @return The newly persisted Item entity.
     * @throws AlreadyExistsException if a vehicle with the provided VIN already exists in the system.
     */
    @Transactional
    fun create(request: ItemCreateRequest): Item {
        val currentUser = authorizationHelper.getCurrentUser()

        if (itemRepository.existsByVin(request.vin)) {
            throw AlreadyExistsException("Vehicle with VIN ${request.vin} is already listed.")
        }

        val newItem = Item(
            seller = currentUser,
            status = ItemStatus.DRAFT,
            year = request.year,
            make = request.make,
            model = request.model,
            vin = request.vin,
            location = request.location,
            mileage = request.mileage,
            description = request.description,
            fuelType = request.fuelType,
            horsepower = request.horsepower,
            condition = request.condition,
            titleStatus = request.titleStatus,
            isModified = request.isModified,
            hasServiceHistory = request.hasServiceHistory,
            reservePrice = request.reservePrice,
            isNoReserve = request.isNoReserve,
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
     * Updates an existing item and synchronizes its image gallery.
     * * Image Synchronization: Any existing image ID not present in [ItemUpdateRequest.keepImageIds]
     * will be permanently deleted from both the database and cloud storage. If the main thumbnail
     * is deleted, a new thumbnail is automatically elected.
     *
     * @param id The UUID of the item to update.
     * @param request The payload containing updated fields and image retention logic.
     * @return The updated Item entity.
     */
    @Transactional
    fun update(id: UUID, request: ItemUpdateRequest): Item {
        // findById enforces ownership/admin authorization internally
        val item = findById(id)

        request.year?.let { item.year = it }
        request.make?.let { item.make = it }
        request.model?.let { item.model = it }
        request.mileage?.let { item.mileage = it }
        request.location?.let { item.location = it }
        request.description?.let { item.description = it }
        request.fuelType?.let { item.fuelType = it }
        request.horsepower?.let { item.horsepower = it }
        request.condition?.let { item.condition = it }
        request.titleStatus?.let { item.titleStatus = it }
        request.isModified?.let { item.isModified = it }
        request.hasServiceHistory?.let { item.hasServiceHistory = it }
        request.reservePrice?.let { item.reservePrice = it }
        request.isNoReserve?.let { item.isNoReserve = it }
        request.engine?.let { item.engine = it }
        request.drivetrain?.let { item.drivetrain = it }
        request.transmission?.let { item.transmission = it }
        request.bodyStyle?.let { item.bodyStyle = it }
        request.exteriorColor?.let { item.exteriorColor = it }
        request.interiorColor?.let { item.interiorColor = it }
        request.sellerType?.let { item.sellerType = it }

        request.keepImageIds?.let { keepIds ->
            val imagesToRemove = item.images.filter { it.id !in keepIds }
            item.images.removeAll(imagesToRemove.toSet())
            imagesToRemove.forEach { safelyDeleteFile(it.url) }
            itemImageRepository.deleteAll(imagesToRemove)

            if (imagesToRemove.any { it.url == item.thumbnailUrl }) {
                item.thumbnailUrl = item.getMainImage()?.url ?: item.images.sortedBy { it.sortOrder }.firstOrNull()?.url
            }
        }

        return itemRepository.save(item)
    }

    /**
     * Permanently deletes an item and purges all associated images from cloud storage.
     *
     * @param id The UUID of the item to delete.
     */
    @Transactional
    fun delete(id: UUID) {
        // findById already checks that the user is the owner or an admin
        val item = findById(id)

        val currentUser = authorizationHelper.getCurrentUser()
        val isAdmin = currentUser.roles.any { it.name == ERole.ADMIN }

        // 1. Security Check: Prevent deletion if there are bids
        val hasActiveBids = item.auctions.any { it.bidCount > 0 }
        if (hasActiveBids && !isAdmin) {
            throw ConflictException("Cannot delete a vehicle that has an active auction with bids.")
        }

        // 2. Foreign Key Fix: Delete the associated auctions FIRST
        if (item.auctions.isNotEmpty()) {
            auctionRepository.deleteAll(item.auctions)
        }

        // 3. Clean up cloud images
        item.images.forEach { safelyDeleteFile(it.url) }

        // 4. Safely delete the item
        itemRepository.delete(item)
    }

    /**
     * Uploads a single image to cloud storage and categorizes it.
     * * Logic constraints enforce that an item can only have one [ImageCategory.MAIN] image.
     * If a new MAIN image is uploaded, the existing one is gracefully demoted to an EXTERIOR image.
     *
     * @param itemId The UUID of the target item.
     * @param file The multipart file payload.
     * @param category The classification category for the image (defaults to OTHER).
     * @return The persisted ItemImage entity.
     */
    @Transactional
    fun uploadImage(
        itemId: UUID,
        file: MultipartFile,
        category: ImageCategory = ImageCategory.OTHER
    ): ItemImage {
        val item = findById(itemId)

        if (category == ImageCategory.MAIN) {
            val oldMainImage = itemImageRepository.findFirstByItemIdAndCategory(itemId, ImageCategory.MAIN)
            if (oldMainImage != null) {
                oldMainImage.category = ImageCategory.EXTERIOR
                itemImageRepository.save(oldMainImage)
            }
        }

        val imageUrl = storageService.uploadFile(file)
        val image = ItemImage(url = imageUrl, item = item, category = category, sortOrder = item.images.size)
        item.addImage(image)

        return itemImageRepository.save(image)
    }

    /**
     * Attempts to delete a file from cloud storage safely.
     * Any underlying storage exceptions are logged but swallowed to prevent
     * rolling back the active database transaction during cleanup operations.
     * * @param url The storage URL of the file to delete.
     */
    private fun safelyDeleteFile(url: String) {
        try {
            storageService.deleteFile(url)
        } catch (e: Exception) {
            logger.error("Failed to delete file from storage: $url", e)
        }
    }
}