package com.ducke.rpg_manager.campanha.dtos;

public record CampanhaDocumentoDownload(
        String nomeArquivo,
        String tipoConteudo,
        byte[] conteudo
) {
}
