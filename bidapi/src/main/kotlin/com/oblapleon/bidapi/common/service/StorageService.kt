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

/**
 * Service responsible for handling file uploads and deletions using AWS S3 (or Cloudflare R2).
 */
@Service
class StorageService(
    private val s3Client: S3Client
) {

    @Value("\${cloudflare.r2.bucket}")
    lateinit var bucketName: String

    @Value("\${cloudflare.r2.public-url}")
    lateinit var publicUrl: String

    /**
     * Uploads a multipart file to the configured S3-compatible storage bucket.
     * Validates that the file is an image and generates a unique UUID filename.
     *
     * @param file The file to upload.
     * @return The public URL of the uploaded file.
     * @throws com.oblapleon.bidapi.common.exception.BadRequestException if file type is invalid.
     */
    fun uploadFile(file: MultipartFile): String {
        val tika = org.apache.tika.Tika()
        val detectedType = tika.detect(file.inputStream)

        if (!detectedType.startsWith("image/")) {
            throw com.oblapleon.bidapi.common.exception.BadRequestException("Invalid file content. Only images are allowed.")
        }

        val extension = when (detectedType) {
            "image/jpeg" -> "jpg"
            "image/png" -> "png"
            "image/webp" -> "webp"
            "image/avif" -> "avif"
            else -> throw com.oblapleon.bidapi.common.exception.BadRequestException("Invalid file type. Only JPEG, PNG, WebP, and AVIF images are allowed.")
        }

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
        return constructPublicUrl(fileName)
    }

    /**
     * Retrieves an input stream for a specific file stored in the bucket.
     *
     * @param fileName The name (key) of the file in the bucket.
     * @return A [software.amazon.awssdk.core.ResponseInputStream] for the file.
     */
    fun getFileStream(fileName: String): software.amazon.awssdk.core.ResponseInputStream<software.amazon.awssdk.services.s3.model.GetObjectResponse> {
        val request = software.amazon.awssdk.services.s3.model.GetObjectRequest.builder()
            .bucket(bucketName)
            .key(fileName)
            .build()
        return s3Client.getObject(request)
    }

    /**
     * Deletes a file from the storage bucket given its public URL.
     *
     * @param fileUrl The public URL of the file to delete.
     */
    fun deleteFile(fileUrl: String) {
        val key = extractKeyFromUrl(fileUrl)
        val deleteRequest = DeleteObjectRequest.builder()
            .bucket(bucketName)
            .key(key)
            .build()

        s3Client.deleteObject(deleteRequest)
    }

    /**
     * Constructs the public CDN URL for a given file name.
     *
     * @param fileName The key of the file in the bucket.
     * @return The full public URL.
     */
    private fun constructPublicUrl(fileName: String): String {
        val baseUrl = publicUrl.removeSuffix("/")
        return "$baseUrl/$fileName"
    }

    /**
     * Extracts the bucket object key from a full public URL.
     *
     * @param fileUrl The full public URL.
     * @return The extracted key (filename).
     */
    private fun extractKeyFromUrl(fileUrl: String): String {
        val uri = URI(fileUrl)
        return uri.path.substringAfterLast("/")
    }
}