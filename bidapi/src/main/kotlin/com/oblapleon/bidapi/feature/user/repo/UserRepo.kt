package com.oblapleon.bidapi.feature.user.repo

import com.oblapleon.bidapi.feature.user.entity.User
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface UserRepo : JpaRepository<User, Long> {

    fun findByUsername(username: String): User?
    fun findByEmail(email: String): User?

    fun existsByUsername(username: String): Boolean
    fun existsByEmail(email: String): Boolean

    fun findByUsernameContainingIgnoreCase(query: String): List<User>
    fun findByEmailContainingIgnoreCase(query: String): List<User>
}
