package com.ducke.rpg_manager.usuario.dtos;

public record AuthUserOutput(
        Long id,
        String username,
        String email,
        boolean emailVerificado
) {
}
