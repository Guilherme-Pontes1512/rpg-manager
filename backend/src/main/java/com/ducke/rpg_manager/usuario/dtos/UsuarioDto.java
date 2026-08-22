package com.ducke.rpg_manager.usuario.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record UsuarioDto (
        @NotBlank String nome,
        @NotBlank String username,
        @NotBlank @Email String email,
        @NotBlank String senha
) {


}
