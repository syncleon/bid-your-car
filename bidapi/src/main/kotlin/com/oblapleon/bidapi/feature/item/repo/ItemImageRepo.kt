package com.oblapleon.bidapi.feature.item.repo

import com.oblapleon.bidapi.feature.item.entity.ItemImage
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface ItemImageRepo : JpaRepository<ItemImage, UUID>