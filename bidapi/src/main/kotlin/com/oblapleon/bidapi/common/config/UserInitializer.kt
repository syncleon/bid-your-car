package com.oblapleon.bidapi.common.config

import com.oblapleon.bidapi.feature.user.entity.ERole
import com.oblapleon.bidapi.feature.user.entity.User
import com.oblapleon.bidapi.feature.user.repo.RoleRepo
import com.oblapleon.bidapi.feature.user.repo.UserRepo
import jakarta.annotation.PostConstruct
import org.springframework.context.annotation.DependsOn
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

@Component
@DependsOn("roleInitializer") // Ensures roles exist before creating users
class UserInitializer(
    private val userRepo: UserRepo,
    private val roleRepo: RoleRepo,
    private val passwordEncoder: PasswordEncoder
) {

    @PostConstruct
    @Transactional
    fun initUsers() {
        if (userRepo.count() > 0) return // Skip if users already exist

        val userRole = roleRepo.findByName(ERole.USER)
            ?: throw IllegalStateException("ROLE_USER not found")
        val adminRole = roleRepo.findByName(ERole.ADMIN)
            ?: throw IllegalStateException("ROLE_ADMIN not found")

        // 1. Create 10 Regular Users
        (1..10).forEach { i ->
            val user = User(
                username = "user$i",
                email = "user$i@example.com",
                password = passwordEncoder.encode("password"),
                enabled = true,
                roles = mutableSetOf(userRole)
            )
            userRepo.save(user)
        }

        // 2. Create 1 Admin User
        val admin = User(
            username = "admin",
            email = "admin@example.com",
            password = passwordEncoder.encode("admin123"),
            enabled = true,
            roles = mutableSetOf(adminRole, userRole)
        )
        userRepo.save(admin)
    }
}