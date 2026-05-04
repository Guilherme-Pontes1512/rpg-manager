package com.ducke.rpg_manager.email;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.email")
public record EmailProperties(
        String host,
        int port,
        String username,
        String password,
        String from,
        String frontendBaseUrl,
        boolean enabled
) {

    public boolean smtpConfigured() {
        boolean hasServer = enabled && host != null && !host.isBlank() && from != null && !from.isBlank();
        boolean usernameBlank = username == null || username.isBlank();
        boolean passwordBlank = password == null || password.isBlank();

        return hasServer && (usernameBlank || !passwordBlank);
    }

    public int resolvedPort() {
        return port > 0 ? port : 587;
    }

    public String resolvedFrontendBaseUrl() {
        return frontendBaseUrl == null || frontendBaseUrl.isBlank()
                ? "http://localhost:5173"
                : frontendBaseUrl;
    }
}
