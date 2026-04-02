package com.ducke.rpg_manager.personagens.coc.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PericiasSRCocDto(
        @NotBlank String nome,
        @NotNull Integer valor
) {
}
