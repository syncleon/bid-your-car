package com.oblapleon.bidapi.feature.item.service

import com.oblapleon.bidapi.common.exceptions.AlreadyExistsException
import com.oblapleon.bidapi.common.exceptions.NotFoundException
import com.oblapleon.bidapi.common.service.StorageService
import com.oblapleon.bidapi.feature.item.dto.ItemCreateRequest
import com.oblapleon.bidapi.feature.item.dto.ItemUpdateRequest
import com.oblapleon.bidapi.feature.item.entity.Item
import com.oblapleon.bidapi.feature.item.entity.ItemImage
import com.oblapleon.bidapi.feature.item.repo.ItemImageRepo
import com.oblapleon.bidapi.feature.item.repo.ItemRepo
import com.oblapleon.bidapi.feature.user.entity.User
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import java.nio.file.AccessDeniedException
import java.util.*

@Service
@Transactional
class ItemService(
    private val itemRepo: ItemRepo,
    private val itemImageRepo: ItemImageRepo,
    private val storageService: StorageService
) {

    @Transactional(readOnly = true)
    fun findAll(pageable: Pageable): Page<Item> = itemRepo.findAllActive(pageable)

    @Transactional(readOnly = true)
    fun findBySeller(sellerId: Long, pageable: Pageable): Page<Item> =
        itemRepo.findBySellerId(sellerId, pageable)

    @Transactional(readOnly = true)
    fun findById(id: UUID): Item {
        val item = itemRepo.findById(id)
            .orElseThrow { NotFoundException("Item not found") }

        if (item.seller.deletedAt != null) {
            throw NotFoundException("Item listing is no longer available")
        }
        return item
    }

    fun create(currentUser: User, request: ItemCreateRequest): Item {
        if (itemRepo.existsByVin(request.vin)) {
            throw AlreadyExistsException("Car with VIN ${request.vin} already exists")
        }

        val newItem = Item(
            seller = currentUser,
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

        return itemRepo.save(newItem)
    }

    fun update(id: UUID, request: ItemUpdateRequest): Item {
        val item = findById(id)

        request.year?.let { item.year = it }
        request.make?.let { item.make = it }
        request.model?.let { item.model = it }
        request.location?.let { item.location = it }
        request.mileage?.let { item.mileage = it }
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
            imagesToRemove.forEach { storageService.deleteFile(it.url) }
            itemImageRepo.deleteAll(imagesToRemove)
        }

        return itemRepo.save(item)
    }

    fun delete(id: UUID) {
        if (!itemRepo.existsById(id)) throw NotFoundException("Item not found")
        itemRepo.deleteById(id)
    }

    @Transactional
    fun uploadImage(itemId: UUID, file: MultipartFile): ItemImage {
        val item = findById(itemId)
        val imageUrl = storageService.uploadFile(file)
        val imageEntity = ItemImage(url = imageUrl, item = item)
        return itemImageRepo.save(imageEntity)
    }

    fun deleteImage(imageId: UUID, userId: Long) {
        val image = itemImageRepo.findById(imageId)
            .orElseThrow { NotFoundException("Image not found") }

        if (image.item.seller.id != userId) {
            throw AccessDeniedException("You do not own this image")
        }

        // 🔥 сначала удаляем файл
        storageService.deleteFile(image.url)

        // потом запись из БД
        itemImageRepo.delete(image)
    }
}