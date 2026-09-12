package com.oblapleon.bidapi.common.service

import io.github.bucket4j.Bandwidth
import io.github.bucket4j.Bucket
import io.github.bucket4j.BucketConfiguration
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager
import io.lettuce.core.RedisClient
import io.lettuce.core.RedisURI
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.time.Duration
import jakarta.annotation.PostConstruct
import jakarta.annotation.PreDestroy

@Service
class RateLimitingService(
    @Value("\${spring.data.redis.host:localhost}") private val redisHost: String,
    @Value("\${spring.data.redis.port:6379}") private val redisPort: Int
) {
    private val limit = Bandwidth.builder().capacity(20).refillGreedy(2, Duration.ofSeconds(1)).build()
    private val configuration = BucketConfiguration.builder().addLimit(limit).build()
    
    private lateinit var redisClient: RedisClient
    private lateinit var proxyManager: LettuceBasedProxyManager<ByteArray>

    /**
     * Initializes the Redis connection and proxy manager.
     */
    @PostConstruct
    fun init() {
        val uri = RedisURI.builder().withHost(redisHost).withPort(redisPort).build()
        redisClient = RedisClient.create(uri)
        proxyManager = LettuceBasedProxyManager.builderFor(redisClient).build()
    }

    /**
     * Closes the Redis connection upon bean destruction.
     */
    @PreDestroy
    fun cleanup() {
        redisClient.shutdown()
    }

    /**
     * Resolves and returns a Bucket4j bucket for the specified user ID.
     * 
     * @param userId The ID of the user to get the rate limit bucket for.
     * @return The rate limiting bucket associated with the user.
     */
    fun resolveBucket(userId: Long): Bucket {
        val key = "rate_limit:user:$userId".toByteArray()
        return proxyManager.builder().build(key) { configuration }
    }

    /**
     * Resolves and returns a Bucket4j bucket for the specified IP address.
     * 
     * @param ip The IP address to get the rate limit bucket for.
     * @return The rate limiting bucket associated with the IP.
     */
    fun resolveBucketByIp(ip: String): Bucket {
        val key = "rate_limit:ip:$ip".toByteArray()
        return proxyManager.builder().build(key) { configuration }
    }
}
