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

@Service
class ItemService(
    private val itemRepository: ItemRepository,
    private val auctionRepository: AuctionRepository,
    private val itemImageRepository: ItemImageRepository,
    private val storageService: StorageService,
    private val authorizationHelper: AuthorizationHelper
) {

    private val logger = LoggerFactory.getLogger(ItemService::class.java)

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

    @Transactional(readOnly = true)
    fun findAllBySellerId(sellerId: Long, pageable: Pageable): Page<Item> {
        authorizationHelper.checkOwnerOrAdmin(sellerId)
        return itemRepository.findAllBySellerId(sellerId, pageable)
    }

    @Transactional(readOnly = true)
    fun findReadyForAuction(pageable: Pageable): Page<Item> {
        return itemRepository.findReadyForAuction(pageable)
    }

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

     @Transactional
    fun update(id: UUID, request: ItemUpdateRequest): Item {
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

    @Transactional
    fun delete(id: UUID) {
        val item = findById(id)
        val currentUser = authorizationHelper.getCurrentUser()
        val isAdmin = currentUser.roles.any { it.name == ERole.ADMIN }
        val hasActiveBids = item.auctions.any { it.bidCount > 0 }
        if (hasActiveBids && !isAdmin) {
            throw ConflictException("Cannot delete a vehicle that has an active auction with bids.")
        }

        if (item.auctions.isNotEmpty()) {
            auctionRepository.deleteAll(item.auctions)
        }
        item.images.forEach { safelyDeleteFile(it.url) }
        itemRepository.delete(item)
    }

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

    private fun safelyDeleteFile(url: String) {
        try {
            storageService.deleteFile(url)
        } catch (e: Exception) {
            logger.error("Failed to delete file from storage: $url", e)
        }
    }
}