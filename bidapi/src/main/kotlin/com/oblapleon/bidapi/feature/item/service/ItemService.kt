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
import org.springframework.cache.annotation.Cacheable
import org.springframework.cache.annotation.CacheEvict
import java.util.UUID

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
     * Retrieves an item by its ID. Also verifies if the current user has access
     * (is the owner or an admin) and ensures the seller has not been soft-deleted.
     *
     * @param id The UUID of the item.
     * @return The found [Item].
     * @throws NotFoundException if the item doesn't exist or is inaccessible.
     */
    @Transactional(readOnly = true)
    @Cacheable(value = ["items"], key = "#id")
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

        // Initialize lazy-loaded collections before caching/returning
        org.hibernate.Hibernate.initialize(item.images)
        org.hibernate.Hibernate.initialize(item.seller)
        org.hibernate.Hibernate.initialize(item.seller.roles)
        
        return item
    }

    /**
     * Retrieves all items belonging to a specific seller.
     * Requires the current user to be the owner or an admin.
     *
     * @param sellerId The ID of the seller.
     * @param pageable Pagination information.
     * @return A [Page] of [Item] objects.
     */
    @Transactional(readOnly = true)
    fun findAllBySellerId(sellerId: Long, pageable: Pageable): Page<Item> {
        authorizationHelper.checkOwnerOrAdmin(sellerId)
        return itemRepository.findAllBySellerId(sellerId, pageable)
    }

    /**
     * Retrieves items that are ready for auction.
     *
     * @param pageable Pagination information.
     * @return A [Page] of [Item] objects ready for auction.
     */
    @Transactional(readOnly = true)
    fun findReadyForAuction(pageable: Pageable): Page<Item> {
        return itemRepository.findReadyForAuction(pageable)
    }

    /**
     * Creates a new item (vehicle listing) in DRAFT status.
     * Checks if an item with the same VIN already exists.
     *
     * @param request The item creation request data.
     * @return The created [Item].
     * @throws AlreadyExistsException if a vehicle with the given VIN exists.
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
     * Updates an existing item.
     * Also handles removal of images not specified in the keep list.
     *
     * @param id The UUID of the item to update.
     * @param request The item update request data.
     * @return The updated [Item].
     */
     @Transactional
     @CacheEvict(value = ["items"], key = "#id")
    fun update(id: UUID, request: ItemUpdateRequest): Item {
        val item = findById(id)
        
        if (item.status != ItemStatus.DRAFT) {
            throw ConflictException("Cannot edit a vehicle that is already submitted or in an active auction.")
        }

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
     * Resets the status of an item to DRAFT and removes it from any auction.
     * Restricted to admin users.
     *
     * @param id The UUID of the item.
     * @return The updated [Item].
     * @throws ForbiddenException if the current user is not an admin.
     */
    @Transactional
    @CacheEvict(value = ["items"], key = "#id")
    fun adminResetStatus(id: UUID): Item {
        val currentUser = authorizationHelper.getCurrentUser()
        if (currentUser.roles.none { it.name == ERole.ADMIN }) {
            throw com.oblapleon.bidapi.common.exception.ForbiddenException("Only admins can reset item status.")
        }
        val item = findById(id)
        item.status = ItemStatus.DRAFT
        item.auctionId = null
        return itemRepository.save(item)
    }

    /**
     * Deletes an item and its associated files and auctions.
     * Admins can force delete items with active bids.
     *
     * @param id The UUID of the item to delete.
     * @throws ConflictException if the item has active bids and the user is not an admin.
     */
    @Transactional
    @CacheEvict(value = ["items"], key = "#id")
    fun delete(id: UUID) {
        val item = findById(id)
        val currentUser = authorizationHelper.getCurrentUser()
        val isAdmin = currentUser.roles.any { it.name == ERole.ADMIN }
        val hasActiveBids = auctionRepository.existsByItemIdAndBidCountGreaterThan(id, 0)
        if (hasActiveBids && !isAdmin) {
            throw ConflictException("Cannot delete a vehicle that has an active auction with bids.")
        }

        auctionRepository.deleteByItemId(id)
        item.images.forEach { safelyDeleteFile(it.url) }
        itemRepository.delete(item)
    }

    /**
     * Uploads and associates an image with an item.
     * Handles replacing the MAIN image if a new MAIN image is uploaded.
     *
     * @param itemId The UUID of the item.
     * @param file The image file to upload.
     * @param category The category of the image.
     * @return The created [ItemImage] record.
     */
    @Transactional
    @CacheEvict(value = ["items"], key = "#itemId")
    fun uploadImage(
        itemId: UUID,
        file: MultipartFile,
        category: ImageCategory = ImageCategory.OTHER
    ): ItemImage {
        val item = findById(itemId)
        
        val imageUrl = storageService.uploadFile(file)

        if (category == ImageCategory.MAIN) {
            val oldMainImage = itemImageRepository.findFirstByItemIdAndCategory(itemId, ImageCategory.MAIN)
            if (oldMainImage != null) {
                oldMainImage.category = ImageCategory.EXTERIOR
                itemImageRepository.save(oldMainImage)
            }
        }

        val image = ItemImage(url = imageUrl, item = item, category = category, sortOrder = item.images.size)
        item.addImage(image)

        return itemImageRepository.save(image)
    }

    /**
     * Safely deletes a file from storage, logging any errors without throwing exceptions.
     *
     * @param url The URL of the file to delete.
     */
    private fun safelyDeleteFile(url: String) {
        try {
            storageService.deleteFile(url)
        } catch (e: Exception) {
            logger.error("Failed to delete file from storage: $url", e)
        }
    }
}