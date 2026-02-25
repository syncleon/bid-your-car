package com.oblapleon.bidapi.common.service

import org.springframework.beans.factory.annotation.Value
import org.springframework.mail.SimpleMailMessage
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.stereotype.Service

@Service
class EmailService(
    private val mailSender: JavaMailSender,
    @Value("\${app.base-url:https://project-d2f657cf-d1e8-4e22-97a.web.app}")
    private val baseUrl: String
) {
    fun sendVerificationEmail(toEmail: String, token: String) {
        val email = SimpleMailMessage()

        email.from = "noreply@bidyourcar.com"
        email.setTo(toEmail)
        email.subject = "Complete Registration"

        email.text = "To confirm your account, please click here: $baseUrl/api/v1/auth/verify?token=$token"

        mailSender.send(email)
    }
}