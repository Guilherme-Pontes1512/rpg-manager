package com.ducke.rpg_manager.campanha_npcs.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CampanhaNpcDto(
        Long id,
        Long campanhaId,
        @NotBlank String nome,
        String imageUrl,
        @NotNull @Valid FichaNpcCocDto dadosFichaJson
) {
}
