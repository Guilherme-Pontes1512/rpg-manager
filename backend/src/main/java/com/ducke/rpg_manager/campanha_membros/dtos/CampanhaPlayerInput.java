package com.ducke.rpg_manager.campanha_membros.dtos;

import jakarta.validation.constraints.NotBlank;

public record CampanhaPlayerInput(
        @NotBlank String identificador
) {
}
