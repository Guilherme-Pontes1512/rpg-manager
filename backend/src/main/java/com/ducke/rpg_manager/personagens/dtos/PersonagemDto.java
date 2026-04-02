package com.ducke.rpg_manager.personagens.dtos;

import com.ducke.rpg_manager.personagens.coc.dtos.FichaSRCocDto;
import com.ducke.rpg_manager.personagens.enumx.PersonagemStatusEnum;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PersonagemDto(
        Long id,
        @NotBlank String nome,
        String historia,
        String aparencia,
        String imageUrl,
        PersonagemStatusEnum status,
        @NotNull FichaSRCocDto dadosFichaJson
) {
}
