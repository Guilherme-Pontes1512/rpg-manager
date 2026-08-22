package com.ducke.rpg_manager.campanha_npcs.dtos;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AtributosNpcCocDto(
        @NotNull @Min(0) @Max(999) Integer forca,
        @NotNull @Min(0) @Max(999) Integer destreza,
        @NotNull @Min(0) @Max(999) Integer constituicao,
        @NotNull @Min(0) @Max(999) Integer inteligencia,
        @NotNull @Min(0) @Max(999) Integer vontade
) {
}
