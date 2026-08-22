package com.ducke.rpg_manager.personagens.coc.dtos;

import jakarta.validation.constraints.NotBlank;

public record RitualSRCocDto(
        @NotBlank String ritual,
        @NotBlank String custo,
        @NotBlank String alvo,
        @NotBlank String descricao
) {
}
