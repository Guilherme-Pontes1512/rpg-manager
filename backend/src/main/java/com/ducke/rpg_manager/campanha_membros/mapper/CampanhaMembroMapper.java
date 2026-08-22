package com.ducke.rpg_manager.campanha_membros.mapper;

import com.ducke.rpg_manager.campanha_membros.dtos.CampanhaMembroInput;
import com.ducke.rpg_manager.campanha_membros.entidade.CampanhaMembro;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CampanhaMembroMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "campanha", ignore = true)
    @Mapping(target = "usuario", ignore = true)
    CampanhaMembro toEntity(CampanhaMembroInput dto);
}
