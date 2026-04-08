package com.ducke.rpg_manager.usuario.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AuthResetPasswordInput(
        @NotBlank String token,
        @NotBlank @Size(min = 6, max = 100) String senha,
        @NotBlank @Size(min = 6, max = 100) String confirmarSenha
) {
}
