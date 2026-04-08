package com.ducke.rpg_manager.campanha.dtos;

import com.ducke.rpg_manager.common.SistemaEnum;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;


public record CampanhaCreateInput(
        @NotBlank String nome,
        @Size(max = 300) String descricao,
        @NotNull SistemaEnum sistema
        ) {
}
