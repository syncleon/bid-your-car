package com.oblapleon.bidapi.service

import com.oblapleon.bidapi.entity.UserEntity
import com.oblapleon.bidapi.exceptions.NotFoundException
import com.oblapleon.bidapi.repository.UserRepository
import org.springframework.stereotype.Service


@Service
class UserService(
    private val userRepository: UserRepository
) {


    fun findById(id: Long): UserEntity {
        val user = userRepository.findById(id)
        return user?.get() ?: throw NotFoundException("User not found")
    }

    fun findByName(name: String): UserEntity {
        return userRepository.findByUsername(name)
    }

    fun existsByName(name: String): Boolean {
        return userRepository.existsByUsername(name)
    }

    fun save(user: UserEntity): UserEntity {
        return userRepository.save(user)
    }


}