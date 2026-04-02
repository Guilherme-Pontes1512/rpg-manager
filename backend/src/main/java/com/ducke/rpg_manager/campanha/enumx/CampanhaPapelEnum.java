package com.ducke.rpg_manager.campanha.enumx;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public enum CampanhaPapelEnum {

    MESTRE("Mestre"),
    JOGADOR("Jogador"),
    TODOS("Todos");

    private final String descricao;
}
