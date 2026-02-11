package com.oblapleon.bidapi.common.entity

import jakarta.persistence.Column
import jakarta.persistence.EntityListeners
import jakarta.persistence.MappedSuperclass
import org.hibernate.Hibernate
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.annotation.LastModifiedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.io.Serializable
import java.time.Instant

@MappedSuperclass
@EntityListeners(AuditingEntityListener::class)
abstract class BaseEntity<ID : Serializable> {

    abstract var id: ID?

    @CreatedDate
    @Column(name = "created_date", nullable = false, updatable = false)
    var createdDate: Instant? = null

    @LastModifiedDate
    @Column(name = "modified_date")
    var modifiedDate: Instant? = null

    /**
     * Standard Hibernate-safe equality check.
     * Uses Hibernate.getClass() to handle proxies correctly.
     */
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other == null || Hibernate.getClass(this) != Hibernate.getClass(other)) return false

        other as BaseEntity<*>

        // For transient entities (null ID), we fall back to object identity (false)
        // unless it is literally the same memory reference (handled in line 1).
        return id != null && id == other.id
    }

    /**
     * HashCode must be constant across all state transitions.
     * Returning a constant is the only safe way to ensure the hash doesn't
     * change when the ID is generated after persist(), which would loose the object
     * inside a HashSet.
     */
    override fun hashCode(): Int = javaClass.hashCode()
}