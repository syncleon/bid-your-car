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

    @EntityGraph(attributePaths = ["roles"])
    fun findByUsername(username: String): Optional<User>

    @Query(value = "SELECT CASE WHEN deleted_at IS NOT NULL THEN true ELSE false END FROM users WHERE username = :username", nativeQuery = true)
    fun isAccountDeleted(@Param("username") username: String): Boolean

    @Query(value = "SELECT password FROM users WHERE username = :username", nativeQuery = true)
    fun findPasswordByUsername(@Param("username") username: String): String?

    @EntityGraph(attributePaths = ["roles"])
    fun findByEmail(email: String): User?

    fun existsByUsername(username: String): Boolean
    fun existsByEmail(email: String): Boolean
    fun findByUsernameContainingIgnoreCase(query: String, pageable: Pageable): Page<User>
    fun findByEmailContainingIgnoreCase(query: String, pageable: Pageable): Page<User>

    @Query(
        value = "SELECT id, username, email FROM users WHERE deleted_at IS NOT NULL AND deleted_at < :cutoffDate",
        nativeQuery = true
    )
    fun findSoftDeletedUsersOlderThan(cutoffDate: Instant): List<Map<String, Any>>

    @Modifying
    @Query(value = "UPDATE users SET deleted_at = NULL WHERE username = :username", nativeQuery = true)
    fun restoreUserByUsername(@Param("username") username: String)

    @Modifying
    @Query(value = "UPDATE users SET deleted_at = NULL WHERE email = :email", nativeQuery = true)
    fun restoreUserByEmail(@Param("email") email: String)

    @Modifying
    @Query(value = "DELETE FROM users WHERE id = :id", nativeQuery = true)
    fun hardDeleteUser(id: Long)
}