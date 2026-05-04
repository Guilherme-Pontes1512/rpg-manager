package com.ducke.rpg_manager.personagens.coc.dtos;

import jakarta.validation.constraints.NotBlank;

public record ArmaSRCocDto(
        @NotBlank String arma,
        @NotBlank String alcance,
        @NotBlank String dano,
        String municao,
        String modificador
) {
}
