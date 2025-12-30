package com.oblapleon.bidapi.common.entity

import jakarta.persistence.EntityListeners
import jakarta.persistence.MappedSuperclass
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.annotation.LastModifiedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.time.Instant

@MappedSuperclass
@EntityListeners(AuditingEntityListener::class)
open class BaseEntity(

    @CreatedDate
    var createdDate: Instant? = null,

    @LastModifiedDate
    var modifiedDate: Instant? = null
)