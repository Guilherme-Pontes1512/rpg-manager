package com.ducke.rpg_manager.common;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Getter
public enum QueryBuilderOperator {

    LIKE("LIKE"),
    EQUALS("="),
    GREATER_THAN(">"),
    LESS_THAN("<"),
    GREATER_THAN_OR_EQUALS(">="),
    LESS_THAN_OR_EQUALS("<=");

    private final String descricao;
}
