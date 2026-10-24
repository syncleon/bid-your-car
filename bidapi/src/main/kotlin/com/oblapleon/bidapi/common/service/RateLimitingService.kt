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
import org.slf4j.LoggerFactory
import java.util.concurrent.ConcurrentHashMap
import jakarta.annotation.PostConstruct
import jakarta.annotation.PreDestroy

@Service
class RateLimitingService(
    @Value("\${spring.data.redis.host:localhost}") private val redisHost: String,
    @Value("\${spring.data.redis.port:6379}") private val redisPort: Int,
    @Value("\${spring.data.redis.password:}") private val redisPassword: String,
    @Value("\${spring.data.redis.ssl.enabled:false}") private val redisSsl: Boolean
) {
    private val logger = LoggerFactory.getLogger(RateLimitingService::class.java)

    private val limit = Bandwidth.builder().capacity(20).refillGreedy(2, Duration.ofSeconds(1)).build()
    private val configuration = BucketConfiguration.builder().addLimit(limit).build()
    
    private var redisClient: RedisClient? = null
    private var proxyManager: LettuceBasedProxyManager<ByteArray>? = null
    private val fallbackBuckets = ConcurrentHashMap<String, Bucket>()

    /**
     * Initializes the Redis connection and proxy manager.
     */
    @PostConstruct
    fun init() {
        try {
            val uriBuilder = RedisURI.builder().withHost(redisHost).withPort(redisPort)
            if (redisPassword.isNotEmpty()) {
                uriBuilder.withPassword(redisPassword.toCharArray())
            }
            if (redisSsl) {
                uriBuilder.withSsl(true)
            }
            val client = RedisClient.create(uriBuilder.build())
            redisClient = client
            proxyManager = LettuceBasedProxyManager.builderFor(client).build()
            logger.info("RateLimitingService initialized with Redis at {}:{}", redisHost, redisPort)
        } catch (e: Exception) {
            logger.warn("Failed to initialize Redis rate limiter (using local in-memory fallback): {}", e.message)
            proxyManager = null
        }
    }

    /**
     * Closes the Redis connection upon bean destruction.
     */
    @PreDestroy
    fun cleanup() {
        try {
            redisClient?.shutdown()
        } catch (e: Exception) {
            logger.warn("Error shutting down Redis client: {}", e.message)
        }
    }

    /**
     * Resolves and returns a Bucket4j bucket for the specified user ID.
     * 
     * @param userId The ID of the user to get the rate limit bucket for.
     * @return The rate limiting bucket associated with the user.
     */
    fun resolveBucket(userId: Long): Bucket {
        val manager = proxyManager
        if (manager != null) {
            try {
                val key = "rate_limit:user:$userId".toByteArray()
                return manager.builder().build(key) { configuration }
            } catch (e: Exception) {
                logger.warn("Redis rate limiter failed for user {}, falling back to local: {}", userId, e.message)
            }
        }
        return fallbackBuckets.computeIfAbsent("user:$userId") {
            Bucket.builder().addLimit(limit).build()
        }
    }

    /**
     * Resolves and returns a Bucket4j bucket for the specified IP address.
     * 
     * @param ip The IP address to get the rate limit bucket for.
     * @return The rate limiting bucket associated with the IP.
     */
    fun resolveBucketByIp(ip: String): Bucket {
        val manager = proxyManager
        if (manager != null) {
            try {
                val key = "rate_limit:ip:$ip".toByteArray()
                return manager.builder().build(key) { configuration }
            } catch (e: Exception) {
                logger.warn("Redis rate limiter failed for IP {}, falling back to local: {}", ip, e.message)
            }
        }
        return fallbackBuckets.computeIfAbsent("ip:$ip") {
            Bucket.builder().addLimit(limit).build()
        }
    }
}
