package com.ducke.rpg_manager.campanha.dtos;

import java.time.Instant;

public record CampanhaDocumentoOutput(
        Long id,
        Long campanhaId,
        String campanhaNome,
        String nomeArquivo,
        String tipoConteudo,
        String enviadoPorUsername,
        Instant enviadoEm,
        boolean baixado
) {
}
