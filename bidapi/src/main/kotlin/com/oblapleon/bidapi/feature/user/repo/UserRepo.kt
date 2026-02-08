package com.oblapleon.bidapi.feature.user.repo

import com.oblapleon.bidapi.feature.user.entity.ERole
import com.oblapleon.bidapi.feature.user.entity.Role
import com.oblapleon.bidapi.feature.user.entity.User
import com.oblapleon.bidapi.feature.user.entity.VerificationToken
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.time.LocalDateTime
import java.util.*

@Repository
interface UserRepo : JpaRepository<User, Long> {

    @EntityGraph(attributePaths = ["roles"])
    fun findByUsername(username: String): User?

     @EntityGraph(attributePaths = ["roles"])
    override fun findById(id: Long): Optional<User>

    fun findByEmail(email: String): User?
    fun existsByUsername(username: String): Boolean
    fun existsByEmail(email: String): Boolean

    // Pagination
    fun findByUsernameContainingIgnoreCase(query: String, pageable: Pageable): Page<User>
    fun findByEmailContainingIgnoreCase(query: String, pageable: Pageable): Page<User>

    fun findAllByDeletedAtBefore(dateTime: LocalDateTime): List<User>
}

@Repository
interface RoleRepo : JpaRepository<Role, Long> {
    fun findByName(name: ERole): Role
    fun existsByName(name: ERole): Boolean
}

@Repository
interface VerificationTokenRepo : JpaRepository<VerificationToken, Long> {
    fun findByToken(token: String): VerificationToken?
}