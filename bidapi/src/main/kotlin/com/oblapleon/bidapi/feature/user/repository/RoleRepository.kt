package com.oblapleon.bidapi.feature.user.repository

import com.oblapleon.bidapi.common.repository.BaseRepository
import com.oblapleon.bidapi.feature.user.entity.ERole
import com.oblapleon.bidapi.feature.user.entity.Role
import org.springframework.stereotype.Repository

@Repository
interface RoleRepository : BaseRepository<Role, Long> {
    
    // Returns nullable because DB might not be seeded yet
    fun findByName(name: ERole): Role?
    
    fun existsByName(name: ERole): Boolean
}