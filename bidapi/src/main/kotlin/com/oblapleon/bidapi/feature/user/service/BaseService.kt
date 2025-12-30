package com.oblapleon.bidapi.feature.user.service

interface BaseService<T, ID> {

    fun findById(id: ID): T
    fun findAll(): List<T>
    fun delete(id: ID)
}