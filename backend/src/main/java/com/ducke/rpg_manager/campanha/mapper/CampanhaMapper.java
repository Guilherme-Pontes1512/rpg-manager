package com.ducke.rpg_manager.campanha.mapper;

import com.ducke.rpg_manager.campanha.dtos.CampanhaCreateInput;
import com.ducke.rpg_manager.campanha.dtos.CampanhaOutput;
import com.ducke.rpg_manager.campanha.entidade.Campanha;
import com.ducke.rpg_manager.campanha.enumx.CampanhaPapelEnum;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.springframework.stereotype.Component;

@Mapper(componentModel = "spring")
@Component
public interface CampanhaMapper {

    Campanha toEntity(CampanhaCreateInput input);

    void updateEntity(@MappingTarget Campanha entity, CampanhaCreateInput input);

    CampanhaOutput toOutput(Campanha entity);

    CampanhaOutput toOutput(Campanha entity, CampanhaPapelEnum papel);
}
