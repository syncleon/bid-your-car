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

    // Берем URL ImageKit вместо R2 public URL
    @Value("\${imagekit.url-endpoint}")
    lateinit var imageKitUrl: String

    fun uploadFile(file: MultipartFile): String {
        val extension = file.originalFilename
            ?.substringAfterLast(".", "jpg")
            ?: "jpg"

        val fileName = "${UUID.randomUUID()}.$extension"

        // 1. Загружаем оригинал в Cloudflare R2
        val request = PutObjectRequest.builder()
            .bucket(bucketName)
            .key(fileName)
            .contentType(file.contentType)
            .build()

        s3Client.putObject(
            request,
            RequestBody.fromInputStream(file.inputStream, file.size)
        )

        // 2. Возвращаем ссылку на ImageKit
        // ImageKit сам сходит в R2 за файлом, когда кто-то откроет эту ссылку
        return constructImageKitUrl(fileName)
    }

    fun deleteFile(fileUrl: String) {
        // Извлекаем имя файла из ссылки ImageKit
        val key = extractKeyFromUrl(fileUrl)

        // Удаляем оригинал из R2
        val deleteRequest = DeleteObjectRequest.builder()
            .bucket(bucketName)
            .key(key)
            .build()

        s3Client.deleteObject(deleteRequest)

        // Примечание: Файл может оставаться в кэше ImageKit некоторое время.
        // Для мгновенного удаления из CDN нужно использовать ImageKit API (purge cache),
        // но обычно для MVP достаточно удаления источника.
    }

    private fun constructImageKitUrl(fileName: String): String {
        val baseUrl = imageKitUrl.removeSuffix("/")
        return "$baseUrl/$fileName"
    }

    private fun extractKeyFromUrl(fileUrl: String): String {
        val uri = URI(fileUrl)
        // ImageKit URL: https://ik.imagekit.io/id/filename.jpg
        // path: /id/filename.jpg -> нам нужно только filename.jpg, если Origin настроен на корень бакета
        // ВАЖНО: Если в ImageKit Origin настроен с префиксом, логика может отличаться.
        // Обычно достаточно взять последнюю часть пути:
        return uri.path.substringAfterLast("/")
    }
}