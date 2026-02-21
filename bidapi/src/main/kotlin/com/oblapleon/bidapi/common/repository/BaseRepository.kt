package com.oblapleon.bidapi.common.repository

import com.oblapleon.bidapi.common.entity.BaseEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.JpaSpecificationExecutor
import org.springframework.data.repository.NoRepositoryBean
import java.io.Serializable

@NoRepositoryBean
interface BaseRepository<T : BaseEntity<ID>, ID : Serializable> :
    JpaRepository<T, ID>,
    JpaSpecificationExecutor<T>