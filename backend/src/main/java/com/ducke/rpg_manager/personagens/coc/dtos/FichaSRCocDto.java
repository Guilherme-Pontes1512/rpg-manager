package com.ducke.rpg_manager.personagens.coc.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record FichaSRCocDto(
        String ocupacao,
        String sexo,
        Integer idade,
        String nacionalidade,

        @NotNull @Valid
        AtributosSRCocDto atributos,

        @NotNull @Min(0)
        Integer vidaAtual,

        @NotNull @Min(1)
        Integer vidaMaxima,

        @NotNull @Min(-5) @Max(5)
        Integer sanidade,

        @NotNull @Min(0) @Max(3)
        Integer pontosDeDestino,

        @Valid
        List<PericiasSRCocDto> pericias,

        String origem,
        String origemHabilidade,
        String origemBuff,
        String origemPericias,
        String retratoUrl,
        String anotacoes,
        String historico,
        String aparencia,
        String importantes,
        String inventario,
        String armas,
        String rituais
) {
}
