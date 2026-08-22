package com.ducke.rpg_manager.usuario.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record AuthEmailInput(
        @NotBlank @Email String email
) {
}
