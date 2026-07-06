package com.oblapleon.bidapi.common.config

import org.springframework.boot.autoconfigure.cache.RedisCacheManagerBuilderCustomizer
import org.springframework.cache.annotation.EnableCaching
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.data.redis.cache.RedisCacheConfiguration
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer
import org.springframework.data.redis.serializer.RedisSerializationContext
import java.time.Duration

@Configuration
@EnableCaching
class CacheConfig {

    @Bean
    fun redisCacheManagerBuilderCustomizer(): RedisCacheManagerBuilderCustomizer {
        return RedisCacheManagerBuilderCustomizer { builder ->
            val jsonSerializer = GenericJackson2JsonRedisSerializer()
            val serializationPair = RedisSerializationContext.SerializationPair.fromSerializer(jsonSerializer)

            val defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .serializeValuesWith(serializationPair)
                .entryTtl(Duration.ofMinutes(10))
                .disableCachingNullValues()

            builder
                .cacheDefaults(defaultConfig)
                .withCacheConfiguration("auctions", defaultConfig.entryTtl(Duration.ofMinutes(5)))
                .withCacheConfiguration("items", defaultConfig.entryTtl(Duration.ofMinutes(30)))
        }
    }
}