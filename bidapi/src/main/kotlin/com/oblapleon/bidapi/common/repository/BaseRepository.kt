package com.oblapleon.bidapi.common.repository

import com.oblapleon.bidapi.common.entity.BaseEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.JpaSpecificationExecutor
import org.springframework.data.repository.NoRepositoryBean
import java.io.Serializable

/**
 * Custom Base Repository that all other repositories should extend.
 *
 * Capabilities:
 * 1. Standard CRUD (save, delete, findById) via JpaRepository.
 * 2. Dynamic Filtering (search criteria) via JpaSpecificationExecutor.
 * 3. Consistent Type Safety ensuring all managed objects extend BaseEntity.
 *
 * @param T The Entity type (must extend BaseEntity)
 * @param ID The Entity's ID type (Long, UUID, etc.)
 */
@NoRepositoryBean
interface BaseRepository<T : BaseEntity<ID>, ID : Serializable> :
    JpaRepository<T, ID>,
    JpaSpecificationExecutor<T>