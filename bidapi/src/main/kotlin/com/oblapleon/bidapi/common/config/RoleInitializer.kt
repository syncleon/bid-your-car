package com.oblapleon.bidapi.common.config

import com.oblapleon.bidapi.feature.user.entity.ERole
import com.oblapleon.bidapi.feature.user.entity.Role
import com.oblapleon.bidapi.feature.user.repository.RoleRepository
import jakarta.annotation.PostConstruct
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

@Component
class RoleInitializer(
    private val roleRepo: RoleRepository
) {

    @PostConstruct
    @Transactional
    fun initRoles() {
        ERole.entries.forEach { roleEnum ->
            if (!roleRepo.existsByName(roleEnum)) {
                roleRepo.save(Role(name = roleEnum))
            }
        }
    }
}