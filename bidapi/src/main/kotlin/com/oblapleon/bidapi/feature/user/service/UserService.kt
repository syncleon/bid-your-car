package com.oblapleon.bidapi.feature.user.service

import com.oblapleon.bidapi.common.exceptions.NotFoundException
import com.oblapleon.bidapi.feature.user.entity.User
import com.oblapleon.bidapi.feature.user.repo.UserRepo
import org.springframework.stereotype.Service

@Service
class UserService(
    private val userRepo: UserRepo
) {

    fun findById(id: Long): User {
        val user = userRepo.findById(id)
        return user?.get() ?: throw NotFoundException("User not found")
    }

    fun findByName(name: String): User {
        return userRepo.findByUsername(name)
    }

    fun existsByName(name: String): Boolean {
        return userRepo.existsByUsername(name)
    }

    fun save(user: User): User {
        return userRepo.save(user)
    }


}