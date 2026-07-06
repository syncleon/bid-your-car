package com.oblapleon.bidapi.common.service

import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import software.amazon.awssdk.core.sync.RequestBody
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest
import software.amazon.awssdk.services.s3.model.PutObjectRequest
import java.net.URI
import java.util.UUID

@Service
class StorageService(
    private val s3Client: S3Client
) {

    @Value("\${cloudflare.r2.bucket}")
    lateinit var bucketName: String

    @Value("\${imagekit.url-endpoint}")
    lateinit var imageKitUrl: String

    fun uploadFile(file: MultipartFile): String {
        val extension = file.originalFilename
            ?.substringAfterLast(".", "jpg")
            ?: "jpg"

        val fileName = "${UUID.randomUUID()}.$extension"

        val request = PutObjectRequest.builder()
            .bucket(bucketName)
            .key(fileName)
            .contentType(file.contentType)
            .build()

        s3Client.putObject(
            request,
            RequestBody.fromInputStream(file.inputStream, file.size)
        )
        return constructImageKitUrl(fileName)
    }

    fun getFileStream(fileName: String): software.amazon.awssdk.core.ResponseInputStream<software.amazon.awssdk.services.s3.model.GetObjectResponse> {
        val request = software.amazon.awssdk.services.s3.model.GetObjectRequest.builder()
            .bucket(bucketName)
            .key(fileName)
            .build()
        return s3Client.getObject(request)
    }

    fun deleteFile(fileUrl: String) {
        val key = extractKeyFromUrl(fileUrl)
        val deleteRequest = DeleteObjectRequest.builder()
            .bucket(bucketName)
            .key(key)
            .build()

        s3Client.deleteObject(deleteRequest)
    }

    private fun constructImageKitUrl(fileName: String): String {
        val baseUrl = imageKitUrl.removeSuffix("/")
        return "$baseUrl/$fileName"
    }

    private fun extractKeyFromUrl(fileUrl: String): String {
        val uri = URI(fileUrl)
        return uri.path.substringAfterLast("/")
    }
}