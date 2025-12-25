package com.oblapleon.bidapi.repository

import com.oblapleon.bidapi.entity.ERole
import com.oblapleon.bidapi.entity.RoleEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface RoleRepository : JpaRepository<RoleEntity, Long> {
    fun findByName(name: ERole): RoleEntity
    fun existsByName(name: ERole): Boolean
}