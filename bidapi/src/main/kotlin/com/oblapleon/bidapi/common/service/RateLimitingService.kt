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
            .addLimit(Bandwidth.builder().capacity(3).refillGreedy(1, Duration.ofSeconds(1)).build())
            .build()
        val key = "rate_limit_user_$userId".toByteArray()
        
        return proxyManager.builder().build(key, configuration)
    }
}