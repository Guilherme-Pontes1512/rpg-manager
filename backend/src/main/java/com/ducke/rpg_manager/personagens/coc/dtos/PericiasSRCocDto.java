package com.ducke.rpg_manager.personagens.coc.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record PericiasSRCocDto(
        @NotBlank String nome,
        @NotNull @Min(0) @Max(999) Integer base,
        @NotNull @Min(0) @Max(999) Integer valor
) {
}
