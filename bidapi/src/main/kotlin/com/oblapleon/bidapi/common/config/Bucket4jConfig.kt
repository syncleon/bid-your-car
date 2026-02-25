package com.oblapleon.bidapi.common.config

import io.github.bucket4j.distributed.proxy.ProxyManager
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager
import io.lettuce.core.RedisClient
import io.lettuce.core.RedisURI
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class Bucket4jConfig(
    @Value("\${spring.data.redis.host:localhost}") private val redisHost: String,
    @Value("\${spring.data.redis.port:6379}") private val redisPort: Int,
    @Value("\${spring.data.redis.password:}") private val redisPassword: String
) {

    @Bean
    fun redisClient(): RedisClient {
        val builder = RedisURI.builder()
            .withHost(redisHost)
            .withPort(redisPort)

        if (redisPassword.isNotBlank()) {
            builder.withPassword(redisPassword.toCharArray())
        }

        if (redisHost.contains("upstash")) {
            builder.withSsl(true)
        }

        return RedisClient.create(builder.build())
    }

    @Bean
    fun proxyManager(redisClient: RedisClient): ProxyManager<ByteArray> {
        return LettuceBasedProxyManager.builderFor(redisClient).build()
    }
}