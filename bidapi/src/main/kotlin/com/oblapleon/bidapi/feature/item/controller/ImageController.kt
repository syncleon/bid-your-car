package com.oblapleon.bidapi.feature.item.controller

import com.oblapleon.bidapi.common.service.StorageService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.core.io.InputStreamResource
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/images")
@Tag(name = "Images", description = "Endpoints for proxying item images securely")
class ImageController(
    private val storageService: StorageService
) {

    @Operation(summary = "Get image proxy stream", description = "Proxies the image from R2 bucket")
    @GetMapping("/{fileName}")
    fun getImage(@PathVariable fileName: String): ResponseEntity<InputStreamResource> {
        val s3ObjectStream = storageService.getFileStream(fileName)
        val response = s3ObjectStream.response()
        val resource = InputStreamResource(s3ObjectStream)

        val headers = HttpHeaders()
        response.contentType()?.let { headers.contentType = MediaType.parseMediaType(it) }
        response.contentLength()?.let { headers.contentLength = it }
        
        // Let it be cached by CDNs for 30 days
        headers.setCacheControl("public, max-age=2592000, immutable")

        return ResponseEntity.ok()
            .headers(headers)
            .body(resource)
    }
}
