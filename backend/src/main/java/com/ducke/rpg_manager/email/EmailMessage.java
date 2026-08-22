package com.ducke.rpg_manager.email;

public record EmailMessage(
        String to,
        String subject,
        String body
) {
}
