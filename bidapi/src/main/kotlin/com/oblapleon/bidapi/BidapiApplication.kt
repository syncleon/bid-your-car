package com.oblapleon.bidapi

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.data.jpa.repository.config.EnableJpaAuditing

@SpringBootApplication
@EnableJpaAuditing
class BidapiApplication

fun main(args: Array<String>) {
    runApplication<BidapiApplication>(*args)
}
