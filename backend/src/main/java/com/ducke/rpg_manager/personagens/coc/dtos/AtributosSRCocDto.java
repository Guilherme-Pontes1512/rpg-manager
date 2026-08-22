package com.ducke.rpg_manager.personagens.coc.dtos;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record AtributosSRCocDto(
        @NotNull @Min(0) @Max(999) Integer forca,
        @NotNull @Min(0) @Max(999) Integer destreza,
        @NotNull @Min(0) @Max(999) Integer constituicao,
        @NotNull @Min(0) @Max(999) Integer inteligencia,
        @NotNull @Min(0) @Max(999) Integer presenca,
        @NotNull @Min(0) @Max(999) Integer vontade
) {
}
