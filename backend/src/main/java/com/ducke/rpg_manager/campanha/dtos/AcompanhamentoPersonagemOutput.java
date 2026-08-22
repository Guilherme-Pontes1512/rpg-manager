package com.ducke.rpg_manager.campanha.dtos;

public record AcompanhamentoPersonagemOutput(
        Long id,
        String nome,
        String jogadorUsername,
        String retratoUrl,
        Integer vidaAtual,
        Integer vidaMaxima,
        Integer sanidade
) {
}
