package com.ducke.rpg_manager.campanha.dtos;

import java.util.List;

public record AcompanhamentoCampanhaOutput(
        Long campanhaId,
        String campanhaNome,
        List<AcompanhamentoPersonagemOutput> personagens,
        List<CampanhaDocumentoOutput> documentos
) {
}
