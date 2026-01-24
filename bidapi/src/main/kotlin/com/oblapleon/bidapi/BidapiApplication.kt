package com.oblapleon.bidapi

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.data.jpa.repository.config.EnableJpaAuditing
import org.springframework.scheduling.annotation.EnableScheduling

@SpringBootApplication
@EnableScheduling
@EnableJpaAuditing
class BidapiApplication

fun main(args: Array<String>) {
    runApplication<BidapiApplication>(*args)
}
