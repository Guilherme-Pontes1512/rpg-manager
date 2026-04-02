package com.ducke.rpg_manager.campanha.dtos;

import com.ducke.rpg_manager.campanha.enumx.CampanhaPapelEnum;
import com.ducke.rpg_manager.common.SistemaEnum;

public record CampanhaOutput(
        Long id,
        String nome,
        String descricao,
        SistemaEnum sistema,
        CampanhaPapelEnum papel
) {
}
