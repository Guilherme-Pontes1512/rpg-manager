package com.ducke.rpg_manager.personagens.dtos;

import com.ducke.rpg_manager.common.SistemaEnum;

public record PersonagemResumoDto(
        Long id,
        String nome,
        String campanhaNome,
        SistemaEnum sistema
) {
}
