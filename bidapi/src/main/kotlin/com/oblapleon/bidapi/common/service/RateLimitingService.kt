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
    // Pre-built once and reused for all users: 20 tokens capacity, refills 2 tokens/second
    private val bucketConfiguration: BucketConfiguration = BucketConfiguration.builder()
        .addLimit(Bandwidth.builder().capacity(20).refillGreedy(2, Duration.ofSeconds(1)).build())
        .build()

    fun resolveBucket(userId: Long): io.github.bucket4j.Bucket {
        val key = "rate_limit_user_$userId".toByteArray()
        return proxyManager.builder().build(key, bucketConfiguration)
    }
}