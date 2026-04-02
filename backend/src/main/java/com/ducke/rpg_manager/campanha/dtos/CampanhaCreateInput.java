package com.ducke.rpg_manager.campanha.dtos;

import com.ducke.rpg_manager.common.SistemaEnum;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;


public record CampanhaCreateInput(
        String nome,
        String descricao,
        SistemaEnum sistema
        ) {
}
