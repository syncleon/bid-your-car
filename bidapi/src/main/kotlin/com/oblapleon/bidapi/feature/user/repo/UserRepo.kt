package com.oblapleon.bidapi.feature.user.repo

import com.oblapleon.bidapi.feature.user.entity.User
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface UserRepo : JpaRepository<User, Long> {
    fun findByUsername(username: String): User
    fun existsByUsername(username: String): Boolean
}