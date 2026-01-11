package com.oblapleon.bidapi.feature.item.service

import com.oblapleon.bidapi.common.exceptions.AlreadyExistsException
import com.oblapleon.bidapi.common.exceptions.NotFoundException
import com.oblapleon.bidapi.common.mapper.toEntity
import com.oblapleon.bidapi.common.service.BaseService
import com.oblapleon.bidapi.common.service.StorageService
import com.oblapleon.bidapi.feature.item.dto.ItemCreateRequest
import com.oblapleon.bidapi.feature.item.dto.ItemUpdateRequest
import com.oblapleon.bidapi.feature.item.entity.Item
import com.oblapleon.bidapi.feature.item.entity.ItemImage
import com.oblapleon.bidapi.feature.item.repo.ItemImageRepo
import com.oblapleon.bidapi.feature.item.repo.ItemRepo
import com.oblapleon.bidapi.feature.user.entity.User
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import java.nio.file.AccessDeniedException
import java.util.*

@Service
class ItemService(
    private val itemRepo: ItemRepo,
    private val itemImageRepo: ItemImageRepo, // Inject new Repo
    private val storageService: StorageService // Inject Storage Service
) : BaseService<Item, UUID> {

    @Transactional(readOnly = true)
    override fun findAll(): List<Item> = itemRepo.findAll()

    @Transactional(readOnly = true)
    override fun findById(id: UUID): Item = itemRepo.findById(id)
        .orElseThrow { NotFoundException("Item with id $id not found") }

    @Transactional(readOnly = true)
    fun findBySeller(sellerId: Long): List<Item> = itemRepo.findBySellerId(sellerId)

    @Transactional
    fun create(currentUser: User, request: ItemCreateRequest): Item {
        if (itemRepo.existsByVin(request.vin)) {
            throw AlreadyExistsException("Car with VIN ${request.vin} already exists")
        }
        return itemRepo.save(request.toEntity(currentUser))
    }

    @Transactional
    fun update(id: UUID, request: ItemUpdateRequest): Item {
        val item = findById(id)
        return item.apply {
            request.make?.let { make = it }
            request.model?.let { model = it }
            request.location?.let { location = it }
            request.engine?.let { engine = it }
            request.drivetrain?.let { drivetrain = it }
            request.transmission?.let { transmission = it }
            request.bodyStyle?.let { bodyStyle = it }
            request.exteriorColor?.let { exteriorColor = it }
            request.interiorColor?.let { interiorColor = it }
            request.sellerType?.let { sellerType = it }
            request.buyNowPrice?.let { buyNowPrice = it }
        }.let { itemRepo.save(it) }
    }

    @Transactional
    override fun delete(id: UUID) {
        if (!itemRepo.existsById(id)) throw NotFoundException("Item not found")
        itemRepo.deleteById(id)
    }

    @Transactional
    fun uploadImage(itemId: UUID, file: MultipartFile): String {
        val item = findById(itemId)

        // 1. Upload to Cloud/CDN
        val imageUrl = storageService.uploadFile(file)

        // 2. Save Reference in DB
        val imageEntity = ItemImage(url = imageUrl, item = item)
        item.images.add(imageEntity)
        itemRepo.save(item) // Cascades save to ItemImage

        return imageUrl
    }

    @Transactional
    fun deleteImage(imageId: UUID, userId: Long) {
        val image = itemImageRepo.findById(imageId)
            .orElseThrow { NotFoundException("Image not found") }

        // Security check: ensure the user owns the car this image belongs to
        if (image.item.seller.id != userId) {
            throw AccessDeniedException("You do not own this image")
        }

        itemImageRepo.delete(image)
        // Optional: Trigger async job to delete actual file from S3
    }
}