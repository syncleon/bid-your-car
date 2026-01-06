package com.oblapleon.bidapi.feature.user.repo

import com.oblapleon.bidapi.feature.user.entity.User
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.time.LocalDateTime

@Repository
interface UserRepo : JpaRepository<User, Long> {

    fun findByUsername(username: String): User?
    fun findByEmail(email: String): User?

    fun existsByUsername(username: String): Boolean
    fun existsByEmail(email: String): Boolean
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.roles WHERE u.id = :id")
    fun findByIdWithRoles(id: Long): User?
    fun findByUsernameContainingIgnoreCase(query: String): List<User>
    fun findByEmailContainingIgnoreCase(query: String): List<User>
    fun findAllByDeletedAtBefore(dateTime: LocalDateTime): List<User>
}
