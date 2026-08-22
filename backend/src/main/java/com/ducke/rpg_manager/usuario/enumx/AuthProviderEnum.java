package com.ducke.rpg_manager.usuario.enumx;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public enum AuthProviderEnum {

    LOCAL("Local"),
    GOOGLE("Google");

    private final String descricao;
}