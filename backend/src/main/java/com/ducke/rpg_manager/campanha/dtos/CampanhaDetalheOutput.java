package com.ducke.rpg_manager.campanha.dtos;

import com.ducke.rpg_manager.campanha.enumx.CampanhaPapelEnum;
import com.ducke.rpg_manager.campanha_membros.dtos.CampanhaMembroOutput;
import com.ducke.rpg_manager.common.SistemaEnum;

import java.util.List;

public record CampanhaDetalheOutput(
        Long id,
        String nome,
        String descricao,
        SistemaEnum sistema,
        CampanhaPapelEnum papel,
        String mestreUsername,
        List<CampanhaMembroOutput> membros
) {
}
