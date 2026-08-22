package com.ducke.rpg_manager.usuario.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AuthRegisterInput(
        @NotBlank @Size(min = 2, max = 100) String nome,
        @NotBlank @Size(min = 3, max = 30) String username,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 6, max = 100) String senha,
        @NotBlank @Size(min = 6, max = 100) String confirmarSenha
) {
}
