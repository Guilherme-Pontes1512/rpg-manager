package com.ducke.rpg_manager.campanha.dtos;


import com.ducke.rpg_manager.campanha.enumx.CampanhaPapelEnum;
import com.ducke.rpg_manager.common.SistemaEnum;

public record CampanhaSearchInput(
        String termo,
        SistemaEnum sistema,
        CampanhaPapelEnum papel
) {
}
