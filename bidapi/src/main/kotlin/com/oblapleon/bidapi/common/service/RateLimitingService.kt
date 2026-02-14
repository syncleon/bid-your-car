package com.oblapleon.bidapi.common.service

import io.github.bucket4j.Bandwidth
import io.github.bucket4j.BucketConfiguration
import io.github.bucket4j.distributed.proxy.ProxyManager
import org.springframework.stereotype.Service
import java.time.Duration

@Service
class RateLimitingService(
    private val proxyManager: ProxyManager<ByteArray>
) {
    fun resolveBucket(userId: Long): io.github.bucket4j.Bucket {
        val configuration = BucketConfiguration.builder()
            // Allow a burst of 3 bids instantly, but refill at 1 bid per second
            .addLimit(Bandwidth.builder().capacity(3).refillGreedy(1, Duration.ofSeconds(1)).build())
            .build()

        // The Redis key will be "rate_limit_user_5"
        val key = "rate_limit_user_$userId".toByteArray()
        
        return proxyManager.builder().build(key, configuration)
    }
}