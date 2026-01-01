package com.oblapleon.bidapi.feature.user.service

import com.oblapleon.bidapi.common.exceptions.BadRequestException
import com.oblapleon.bidapi.common.exceptions.ConflictException
import com.oblapleon.bidapi.common.exceptions.NotFoundException
import com.oblapleon.bidapi.common.service.BaseService
import com.oblapleon.bidapi.feature.user.dto.UserUpdateRequest
import com.oblapleon.bidapi.feature.user.entity.User
import com.oblapleon.bidapi.feature.user.repo.UserRepo
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
@Transactional
class UserService(
    private val userRepo: UserRepo,
    private val passwordService: PasswordService
) : BaseService<User, Long> {

    override fun findById(id: Long): User =
        userRepo.findById(id)
            .orElseThrow { NotFoundException("User with ID $id not found") }

    override fun findAll(): List<User> =
        userRepo.findAll()

    /**
     * SOFT DELETE:
     * Sets the deletedAt timestamp. The user remains in the DB but is marked for deletion.
     * The Scheduler will pick this up after 30 days.
     */
    override fun delete(id: Long) {
        val user = findById(id) // Throws NotFoundException if missing
        user.deletedAt = LocalDateTime.now()
        userRepo.save(user)
    }

    /**
     * HARD DELETE:
     * Permanently removes the user from the database.
     * Used by the Cleanup Scheduler.
     */
    fun deletePermanently(id: Long) {
        if (!userRepo.existsById(id)) {
            throw NotFoundException("User with ID $id not found")
        }
        userRepo.deleteById(id)
    }

    /**
     * Used by Scheduler to find accounts that were soft-deleted before the cutoff date.
     */
    fun findReadyForPurge(cutoffDate: LocalDateTime): List<User> {
        return userRepo.findAllByDeletedAtBefore(cutoffDate)
    }

    fun findByName(username: String): User =
        userRepo.findByUsername(username)
            ?: throw NotFoundException("User with username '$username' not found")

    fun findByEmail(email: String): User =
        userRepo.findByEmail(email)
            ?: throw NotFoundException("User with email '$email' not found")

    fun existsByName(username: String): Boolean =
        userRepo.existsByUsername(username)

    fun existsByEmail(email: String): Boolean =
        userRepo.existsByEmail(email)

    fun save(user: User): User =
        userRepo.save(user)

    fun update(id: Long, request: UserUpdateRequest): User {
        val user = findById(id)

        request.username?.let { newUsername ->
            if (newUsername != user.username && existsByName(newUsername)) {
                throw ConflictException("Username '$newUsername' is already taken")
            }
            user.username = newUsername
        }

        request.email?.let { newEmail ->
            if (newEmail != user.email && existsByEmail(newEmail)) {
                throw ConflictException("Email '$newEmail' is already registered")
            }
            user.email = newEmail
        }

        request.password?.let { newPassword ->
            user.password = passwordService.encode(newPassword)
        }

        return userRepo.save(user)
    }

    fun updateProfile(id: Long, username: String?, email: String?): User {
        val user = findById(id)

        username?.let {
            if (it != user.username && existsByName(it)) {
                throw ConflictException("Username '$it' is already taken")
            }
            user.username = it
        }

        email?.let {
            if (it != user.email && existsByEmail(it)) {
                throw ConflictException("Email '$it' is already registered")
            }
            user.email = it
        }

        return userRepo.save(user)
    }

    fun changePassword(id: Long, oldPassword: String, newPassword: String) {
        val user = findById(id)

        if (!passwordService.matches(oldPassword, user.password)) {
            throw BadRequestException("Old password is incorrect")
        }

        user.password = passwordService.encode(newPassword)
        userRepo.save(user)
    }

    fun resetPassword(id: Long, newPassword: String) {
        val user = findById(id)
        user.password = passwordService.encode(newPassword)
        userRepo.save(user)
    }

    fun searchByUsernameContains(query: String): List<User> =
        userRepo.findByUsernameContainingIgnoreCase(query)

    fun searchByEmailContains(query: String): List<User> =
        userRepo.findByEmailContainingIgnoreCase(query)

    fun findByIds(ids: Set<Long>): List<User> =
        userRepo.findAllById(ids).toList()

    fun countAll(): Long =
        userRepo.count()
}