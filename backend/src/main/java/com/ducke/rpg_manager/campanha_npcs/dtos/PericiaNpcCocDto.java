package com.ducke.rpg_manager.campanha_npcs.dtos;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PericiaNpcCocDto(
        @NotBlank String nome,
        @NotNull @Min(0) @Max(999) Integer base,
        @NotNull @Min(0) @Max(999) Integer valor
) {
}
