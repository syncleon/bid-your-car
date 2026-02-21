package com.oblapleon.bidapi.common.service

import org.springframework.beans.factory.annotation.Value
import org.springframework.mail.SimpleMailMessage
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.stereotype.Service

@Service
class EmailService(
    private val mailSender: JavaMailSender,
    @Value("\${app.base-url:http://localhost:8080}") private val baseUrl: String
        ) {
            fun sendVerificationEmail(toEmail: String, token: String) {
                val email = SimpleMailMessage()

                email.from = "noreply@bidyourcar.com"
                email.setTo(toEmail)
                email.subject = "Complete Registration"
                email.text = "To confirm your account, please click here: $baseUrl/api/v1/verify?token=$token"

                mailSender.send(email)
            }
        }