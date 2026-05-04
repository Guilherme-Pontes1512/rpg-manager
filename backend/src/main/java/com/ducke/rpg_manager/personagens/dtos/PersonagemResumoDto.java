package com.ducke.rpg_manager.personagens.dtos;

public record PersonagemResumoDto(
        Long id,
        Long campanhaId,
        String nome,
        String imageUrl
) {
}
