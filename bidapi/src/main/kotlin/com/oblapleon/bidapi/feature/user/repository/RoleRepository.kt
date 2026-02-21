package com.oblapleon.bidapi.feature.user.repository

import com.oblapleon.bidapi.common.repository.BaseRepository
import com.oblapleon.bidapi.feature.user.entity.ERole
import com.oblapleon.bidapi.feature.user.entity.Role
import org.springframework.stereotype.Repository

@Repository
interface RoleRepository : BaseRepository<Role, Long> {
    
    fun findByName(name: ERole): Role?
    fun existsByName(name: ERole): Boolean
}