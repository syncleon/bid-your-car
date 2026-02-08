package com.oblapleon.bidapi.common.entity

import jakarta.persistence.EntityListeners
import jakarta.persistence.MappedSuperclass
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.annotation.LastModifiedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.io.Serializable
import java.time.Instant

/**
 * Abstract base class for persistent entities providing automated auditing
 * and standardized identity equality.
 *
 * @param ID The type of the entity's identifier (e.g., Long, UUID).
 */
@MappedSuperclass
@EntityListeners(AuditingEntityListener::class)
abstract class BaseEntity<ID : Serializable> {

    /**
     * Abstract ID allows concrete classes to define specific JPA annotations
     * (e.g., @Id, @GeneratedValue) and types while allowing BaseEntity
     * to perform equality checks.
     */
    abstract var id: ID?

    @CreatedDate
    var createdDate: Instant? = null

    @LastModifiedDate
    var modifiedDate: Instant? = null

    override fun equals(other: Any?): Boolean {
        if (this === other) return true

        // Ensure strictly same class (or handle Hibernate proxies if strictly needed)
        // This replaces the repeated 'if (other !is Entity)' checks
        if (other == null || this::class != other::class) return false

        other as BaseEntity<*>

        // Entities are only equal if IDs are non-null and match
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: 0
}