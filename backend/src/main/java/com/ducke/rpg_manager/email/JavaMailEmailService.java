package com.ducke.rpg_manager.email;

import jakarta.mail.Message;
import jakarta.mail.MessagingException;
import jakarta.mail.Session;
import jakarta.mail.Transport;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Properties;

@Slf4j
@Service
@RequiredArgsConstructor
public class JavaMailEmailService implements EmailService {

    private final EmailProperties properties;

    @Override
    public void send(EmailMessage message) {
        if (!properties.smtpConfigured()) {
            log.info("Email em modo desenvolvimento. Para: {}, assunto: {}, corpo: {}",
                    message.to(), message.subject(), message.body());
            return;
        }

        try {
            MimeMessage mimeMessage = new MimeMessage(createSession());
            mimeMessage.setFrom(new InternetAddress(properties.from()));
            mimeMessage.setRecipients(Message.RecipientType.TO, InternetAddress.parse(message.to()));
            mimeMessage.setSubject(message.subject(), "UTF-8");
            mimeMessage.setText(message.body(), "UTF-8");

            send(mimeMessage);
        } catch (MessagingException ex) {
            log.error("Nao foi possivel enviar o email para {}", message.to(), ex);
            throw new IllegalStateException("Nao foi possivel enviar o email", ex);
        }
    }

    private Session createSession() {
        Properties smtp = new Properties();
        smtp.put("mail.smtp.host", properties.host());
        smtp.put("mail.smtp.port", String.valueOf(properties.resolvedPort()));
        smtp.put("mail.smtp.auth", hasCredentials());
        smtp.put("mail.smtp.starttls.enable", "true");

        return Session.getInstance(smtp);
    }

    private void send(MimeMessage mimeMessage) throws MessagingException {
        if (!hasCredentials()) {
            Transport.send(mimeMessage);
            return;
        }

        try (Transport transport = mimeMessage.getSession().getTransport("smtp")) {
            transport.connect(properties.host(), properties.resolvedPort(), properties.username(), properties.password());
            transport.sendMessage(mimeMessage, mimeMessage.getAllRecipients());
        }
    }

    private boolean hasCredentials() {
        return properties.username() != null
                && !properties.username().isBlank()
                && properties.password() != null
                && !properties.password().isBlank();
    }
}
