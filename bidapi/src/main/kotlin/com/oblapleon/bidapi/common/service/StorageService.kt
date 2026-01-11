package com.oblapleon.bidapi.common.service

import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import software.amazon.awssdk.core.sync.RequestBody
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.model.PutObjectRequest
import software.amazon.awssdk.services.s3.model.GetUrlRequest
import java.util.UUID

@Service
class StorageService(
    private val s3Client: S3Client
) {

    @Value("\${aws.s3.bucket}")
    lateinit var bucketName: String

    fun uploadFile(file: MultipartFile): String {
        val extension = file.originalFilename?.substringAfterLast(".", "jpg") ?: "jpg"
        val fileName = "${UUID.randomUUID()}.$extension"

        val request = PutObjectRequest.builder()
            .bucket(bucketName)
            .key(fileName)
            .contentType(file.contentType)
            .build()

        s3Client.putObject(request, RequestBody.fromInputStream(file.inputStream, file.size))

        // Return the RAW S3 URL (we will transform this to ImageKit URL in the Mapper)
        return s3Client.utilities().getUrl(
            GetUrlRequest.builder().bucket(bucketName).key(fileName).build()
        ).toExternalForm()
    }
}