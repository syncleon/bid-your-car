package com.oblapleon.bidapi.common.config

import com.oblapleon.bidapi.feature.user.entity.ERole
import com.oblapleon.bidapi.feature.user.entity.Role
import com.oblapleon.bidapi.feature.user.repository.RoleRepository
import jakarta.annotation.PostConstruct
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

/**
 * Data seeding component responsible for ensuring required authorization roles
 * exist in the database upon application startup.
 * Automatically synchronizes the database Role table with the [ERole] enumeration.
 */
@Component
class RoleInitializer(
    private val roleRepo: RoleRepository
) {

    /**
     * Initializes the role repository with default values.
     * Iterates through all defined [ERole] entries and persists any missing
     * roles to the database within a single transaction.
     */
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