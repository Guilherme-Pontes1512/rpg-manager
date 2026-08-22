package com.ducke.rpg_manager.personagens.enumx;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public enum PersonagemStatusEnum {

    ATIVO("Ativo"),
    INATIVO("Inativo"),
    MORTO("Morto");

    private final String descricao;
}
