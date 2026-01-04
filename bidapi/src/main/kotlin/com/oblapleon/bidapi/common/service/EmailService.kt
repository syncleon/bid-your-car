package com.oblapleon.bidapi.common.service

import org.springframework.beans.factory.annotation.Value
import org.springframework.mail.SimpleMailMessage
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.stereotype.Service

/**
 * Service component responsible for dispatching system-generated emails.
 * Utilizes Spring's JavaMailSender to handle SMTP communications for
 * account-related notifications.
 */
@Service
class EmailService(
    private val mailSender: JavaMailSender,
    @Value($$"${app.base-url:http://localhost:8080}") private val baseUrl: String
        ) {
            /**
             * Constructs and sends a plain-text email containing an account
             * verification link.
             *
             * @param toEmail The recipient's email address.
             * @param token The unique verification token appended to the confirmation URL.
             */
            fun sendVerificationEmail(toEmail: String, token: String) {
                val email = SimpleMailMessage()

                email.from = "noreply@bidyourcar.com"
                email.setTo(toEmail)
                email.subject = "Complete Registration"
                email.text = "To confirm your account, please click here: $baseUrl/api/v1/verify?token=$token"

                mailSender.send(email)
            }
        }