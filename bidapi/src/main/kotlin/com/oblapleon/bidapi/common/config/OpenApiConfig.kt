package com.oblapleon.bidapi.common.config

import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.info.Info
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

/**
 * Configuration class for the OpenAPI (Swagger) documentation.
 * Defines the global metadata for the API including title, version, and description
 * to be rendered by the Swagger UI.
 */
@Configuration
class OpenApiConfig {

    /**
     * Configures the global OpenAPI specification bean.
     * Sets up the core documentation info that appears at the top of the
     * interactive API documentation page.
     * * @return A configured [OpenAPI] instance containing basic API metadata.
     */
    @Bean
    fun customOpenAPI(): OpenAPI {
        return OpenAPI()
            .info(
                Info()
                    .title("BidAPI")
                    .version("1.0")
                    .description("API documentation for BidAPI")
            )
    }
}