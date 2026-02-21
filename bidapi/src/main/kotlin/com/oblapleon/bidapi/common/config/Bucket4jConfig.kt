package com.oblapleon.bidapi.common.config

import io.github.bucket4j.distributed.proxy.ProxyManager
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager
import io.lettuce.core.RedisClient
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class Bucket4jConfig(
    @Value("\${spring.data.redis.host:localhost}") private val redisHost: String,
    @Value("\${spring.data.redis.port:6379}") private val redisPort: Int
) {

    @Bean
    fun redisClient(): RedisClient {
        return RedisClient.create("redis://$redisHost:$redisPort")
    }

    @Bean
    fun proxyManager(redisClient: RedisClient): ProxyManager<ByteArray> {
        return LettuceBasedProxyManager.builderFor(redisClient).build()
    }
}