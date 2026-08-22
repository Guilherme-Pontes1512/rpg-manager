package com.ducke.rpg_manager.campanha_npcs.dtos;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record FichaNpcCocDto(
        String profissao,

        @NotNull @Valid
        AtributosNpcCocDto atributos,

        @NotNull @Min(0)
        Integer vidaAtual,

        @NotNull @Min(1)
        Integer vidaMaxima,

        @NotNull @Min(-5) @Max(5)
        Integer sanidade,

        @NotNull @Min(0) @Max(999)
        Integer esquiva,

        @Valid
        List<PericiaNpcCocDto> pericias,

        String retratoUrl,
        String historico,
        String aparencia,
        String importantes,
        String segredos,
        Object armas,
        Object rituais
) {
}
