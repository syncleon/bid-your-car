package com.oblapleon.bidapi.common.entity

import jakarta.persistence.EntityListeners
import jakarta.persistence.MappedSuperclass
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.annotation.LastModifiedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.time.Instant

/**
 * Abstract base class for persistent entities providing automated auditing capabilities.
 * Utilizes JPA auditing listeners to track record creation and modification timestamps
 * across all inheriting domain models.
 */
@MappedSuperclass
@EntityListeners(AuditingEntityListener::class)
open class BaseEntity(

    /**
     * The timestamp indicating when the entity record was first persisted.
     * Automatically populated by the auditing listener.
     */
    @CreatedDate
    var createdDate: Instant? = null,

    /**
     * The timestamp indicating the last time the entity record was updated.
     * Automatically updated by the auditing listener on every modification.
     */
    @LastModifiedDate
    var modifiedDate: Instant? = null
)