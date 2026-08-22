package com.ducke.rpg_manager.campanha.dtos;

import com.ducke.rpg_manager.campanha_npcs.dtos.CampanhaNpcDto;

import java.util.List;

public record AcompanhamentoCampanhaOutput(
        Long campanhaId,
        String campanhaNome,
        List<AcompanhamentoPersonagemOutput> personagens,
        List<CampanhaNpcDto> npcs,
        List<CampanhaDocumentoOutput> documentos
) {
}
