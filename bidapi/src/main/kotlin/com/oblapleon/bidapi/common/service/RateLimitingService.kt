package com.oblapleon.bidapi.common.service

import io.github.bucket4j.Bandwidth
import io.github.bucket4j.Bucket
import io.github.bucket4j.BucketConfiguration
import org.springframework.stereotype.Service
import java.time.Duration
import java.util.concurrent.ConcurrentHashMap

@Service
class RateLimitingService {
    // Pre-built once and reused for all users: 20 tokens capacity, refills 2 tokens/second
    private val limit = Bandwidth.builder().capacity(20).refillGreedy(2, Duration.ofSeconds(1)).build()
    private val cache = ConcurrentHashMap<Long, Bucket>()

    fun resolveBucket(userId: Long): Bucket {
        return cache.computeIfAbsent(userId) {
            Bucket.builder()
                .addLimit(limit)
                .build()
        }
    }
}
