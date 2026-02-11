package com.oblapleon.bidapi.common.config

import com.oblapleon.bidapi.feature.user.entity.ERole
import com.oblapleon.bidapi.feature.user.entity.User
import com.oblapleon.bidapi.feature.user.repository.RoleRepository
import com.oblapleon.bidapi.feature.user.repository.UserRepository
import jakarta.annotation.PostConstruct
import net.datafaker.Faker
import org.springframework.context.annotation.DependsOn
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

@Component
@DependsOn("roleInitializer")
class UserInitializer(
    private val userRepo: UserRepository,
    private val roleRepo: RoleRepository,
    private val passwordEncoder: PasswordEncoder
) {
    private val faker = Faker()

    @PostConstruct
    @Transactional
    fun initUsers() {
        if (userRepo.count() > 0) return

        val userRole = roleRepo.findByName(ERole.USER)
            ?: throw IllegalStateException("ROLE_USER not found")
        val adminRole = roleRepo.findByName(ERole.ADMIN)
            ?: throw IllegalStateException("ROLE_ADMIN not found")

        val commonPassword = passwordEncoder.encode("password")

        // 1. Create 100 Regular Users with realistic data
        val users = (1..100).map {
            val firstName = faker.name().firstName().lowercase()
            val lastName = faker.name().lastName().lowercase()

            User(
                username = "${firstName}_${lastName}${faker.number().digits(2)}",
                email = faker.internet().emailAddress("${firstName}.${lastName}"),
                password = commonPassword,
                enabled = true,
                roles = mutableSetOf(userRole)
            )
        }
        userRepo.saveAll(users)

        // 2. Create the specific Admin User for testing
        val admin = User(
            username = "admin",
            email = "admin@bidapi.com",
            password = passwordEncoder.encode("admin123"),
            enabled = true,
            roles = mutableSetOf(adminRole, userRole)
        )
        userRepo.save(admin)

        println("✅ Successfully initialized 101 users (100 regular, 1 admin).")
    }
}