package com.oblapleon.bidapi.common.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.scheduling.annotation.EnableAsync
import org.springframework.scheduling.annotation.EnableScheduling

@Configuration
@EnableScheduling
@EnableAsync
class SchedulingConfig {
    
    @Bean
    fun taskExecutor(): org.springframework.core.task.TaskExecutor {
        val executor = org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor()
        executor.corePoolSize = 10
        executor.maxPoolSize = 20
        executor.queueCapacity = 100
        executor.setThreadNamePrefix("AuctionProcessor-")
        executor.initialize()
        return executor
    }
}