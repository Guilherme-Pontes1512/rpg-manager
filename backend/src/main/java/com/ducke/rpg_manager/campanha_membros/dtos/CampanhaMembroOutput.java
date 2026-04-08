package com.ducke.rpg_manager.campanha_membros.dtos;

import com.ducke.rpg_manager.campanha.enumx.CampanhaPapelEnum;

public record CampanhaMembroOutput(
        Long id,
        Long usuarioId,
        String nome,
        String username,
        String email,
        CampanhaPapelEnum papel
) {
}
