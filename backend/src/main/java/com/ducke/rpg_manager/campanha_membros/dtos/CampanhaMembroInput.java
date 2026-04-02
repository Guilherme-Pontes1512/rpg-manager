package com.ducke.rpg_manager.campanha_membros.dtos;

import com.ducke.rpg_manager.campanha.enumx.CampanhaPapelEnum;

public record CampanhaMembroInput(
        Long campanhaId,
        Long usuarioId,
        CampanhaPapelEnum papel
) {
}
