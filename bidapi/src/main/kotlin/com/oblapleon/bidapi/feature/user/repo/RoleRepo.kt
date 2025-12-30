package com.oblapleon.bidapi.feature.user.repo

import com.oblapleon.bidapi.feature.user.entity.ERole
import com.oblapleon.bidapi.feature.user.entity.Role
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface RoleRepo : JpaRepository<Role, Long> {
    fun findByName(name: ERole): Role
    fun existsByName(name: ERole): Boolean
}