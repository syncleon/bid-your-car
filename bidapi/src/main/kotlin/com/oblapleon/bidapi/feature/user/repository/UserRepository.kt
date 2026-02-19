package com.oblapleon.bidapi.feature.user.repository

import com.oblapleon.bidapi.common.repository.BaseRepository
import com.oblapleon.bidapi.feature.user.entity.User
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.Optional

@Repository
interface UserRepository : BaseRepository<User, Long> {

    /**
     * Used for Authentication.
     * @EntityGraph ensures 'roles' are joined in the same SELECT statement.
     */
    @EntityGraph(attributePaths = ["roles"])
    fun findByUsername(username: String): Optional<User>

    @Query(value = "SELECT * FROM users WHERE username = :username", nativeQuery = true)
    fun findAnyByUsername(@Param("username") username: String): User?

    @EntityGraph(attributePaths = ["roles"])
    fun findByEmail(email: String): User?

    /**
     * Standard exists checks are highly optimized by Spring Data
     * (SELECT 1 FROM ... LIMIT 1).
     */
    fun existsByUsername(username: String): Boolean
    fun existsByEmail(email: String): Boolean

    // -------------------------------------------------------------------------
    // Search / Pagination
    // -------------------------------------------------------------------------

    fun findByUsernameContainingIgnoreCase(query: String, pageable: Pageable): Page<User>
    fun findByEmailContainingIgnoreCase(query: String, pageable: Pageable): Page<User>

    // -------------------------------------------------------------------------
    // Cleanup / Maintenance (GDPR)
    // -------------------------------------------------------------------------

    /**
     * Finds users who "soft deleted" their account before a certain date.
     * MUST be nativeQuery to bypass the @SQLRestriction("deleted_at IS NULL") on the Entity.
     */
    @Query(
        value = "SELECT * FROM users WHERE deleted_at IS NOT NULL AND deleted_at < :cutoffDate",
        nativeQuery = true
    )
    fun findSoftDeletedUsersOlderThan(cutoffDate: Instant): List<User>

    /**
     * Hard delete method for the cleanup job.
     */
    @Modifying
    @Query(value = "DELETE FROM users WHERE id = :id", nativeQuery = true)
    fun hardDeleteUser(id: Long)
}