package com.oblapleon.bidapi.config

import com.oblapleon.bidapi.entity.ERole
import com.oblapleon.bidapi.entity.RoleEntity
import com.oblapleon.bidapi.repository.RoleRepository
import jakarta.annotation.PostConstruct
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

@Component
class RoleInitializer(
    private val roleRepository: RoleRepository
) {

    @PostConstruct
    @Transactional
    fun initRoles() {
        ERole.entries.forEach { roleEnum ->
            if (!roleRepository.existsByName(roleEnum)) {
                roleRepository.save(RoleEntity(name = roleEnum))
            }
        }
    }
}