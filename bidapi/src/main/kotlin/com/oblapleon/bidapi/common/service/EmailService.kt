package com.oblapleon.bidapi.common.service

import jakarta.mail.internet.MimeMessage
import org.springframework.beans.factory.annotation.Value
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.mail.javamail.MimeMessageHelper
import org.springframework.stereotype.Service

/**
 * Service responsible for sending outbound emails, such as account verification.
 */
@Service
class EmailService(
    private val mailSender: JavaMailSender,
    @Value("\${app.base-url:http://localhost:8080}")
    private val baseUrl: String
) {
    /**
     * Sends an HTML verification email to a newly registered user.
     *
     * @param toEmail The recipient's email address.
     * @param token The unique verification token to include in the link.
     */
    @org.springframework.scheduling.annotation.Async
    fun sendVerificationEmail(toEmail: String, token: String) {
        val message: MimeMessage = mailSender.createMimeMessage()

        // Use MimeMessageHelper to easily construct the email with HTML support
        val helper = MimeMessageHelper(message, true, "UTF-8")

        val verificationLink = "$baseUrl/api/v1/auth/verify?token=$token"

        helper.setFrom("noreply@bidyourcar.com")
        helper.setTo(toEmail)
        helper.setSubject("Complete Registration - BidYourCar")

        // Beautiful HTML content
        val htmlContent = """
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        background-color: #f4f7f6;
                        margin: 0;
                        padding: 0;
                    }
                    .email-container {
                        max-width: 600px;
                        margin: 40px auto;
                        background-color: #ffffff;
                        border-radius: 8px;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                        overflow: hidden;
                    }
                    .header {
                        background-color: #0056b3;
                        padding: 20px;
                        text-align: center;
                        color: #ffffff;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 24px;
                    }
                    .content {
                        padding: 30px;
                        color: #333333;
                        line-height: 1.6;
                    }
                    .content h2 {
                        color: #0056b3;
                    }
                    .button-container {
                        text-align: center;
                        margin: 30px 0;
                    }
                    .verify-button {
                        background-color: #28a745;
                        color: #ffffff !important;
                        text-decoration: none;
                        padding: 12px 25px;
                        border-radius: 5px;
                        font-weight: bold;
                        font-size: 16px;
                        display: inline-block;
                    }
                    .footer {
                        background-color: #f4f7f6;
                        padding: 15px;
                        text-align: center;
                        font-size: 12px;
                        color: #888888;
                        border-top: 1px solid #eeeeee;
                    }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <h1>BidYourCar</h1>
                    </div>
                    <div class="content">
                        <h2>Welcome to BidYourCar!</h2>
                        <p>Thank you for registering. We're excited to have you on board.</p>
                        <p>To get started, please confirm your email address by clicking the button below:</p>
                        
                        <div class="button-container">
                            <a href="$verificationLink" class="verify-button">Verify My Email</a>
                        </div>
                        
                        <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
                        <p style="word-break: break-all; font-size: 14px; color: #555;"><a href="$verificationLink">$verificationLink</a></p>
                        
                        <p>Best regards,<br>The BidYourCar Team</p>
                    </div>
                    <div class="footer">
                        <p>If you didn't request this email, you can safely ignore it.</p>
                        <p>&copy; ${java.time.Year.now().value} BidYourCar. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        """.trimIndent()

        // The 'true' flag indicates that the text is HTML
        helper.setText(htmlContent, true)

        mailSender.send(message)
    }
}