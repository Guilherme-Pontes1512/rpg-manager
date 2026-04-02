package com.ducke.rpg_manager.campanha_membros.mapper;

import com.ducke.rpg_manager.campanha_membros.dtos.CampanhaMembroInput;
import com.ducke.rpg_manager.campanha_membros.entidade.CampanhaMembro;
import org.mapstruct.Mapper;

@Mapper
public interface CampanhaMembroMapper {

    CampanhaMembro toEntity(CampanhaMembroInput dto);
}
