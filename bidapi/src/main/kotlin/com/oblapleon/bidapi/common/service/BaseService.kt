package com.oblapleon.bidapi.common.service

interface BaseService<T, ID> {

    fun findById(id: ID): T
    fun findAll(): List<T>
    fun delete(id: ID)
}