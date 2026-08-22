package com.ducke.rpg_manager.campanha.mapper;

import com.ducke.rpg_manager.campanha.dtos.CampanhaCreateInput;
import com.ducke.rpg_manager.campanha.dtos.CampanhaDetalheOutput;
import com.ducke.rpg_manager.campanha.entidade.Campanha;
import com.ducke.rpg_manager.campanha.enumx.CampanhaPapelEnum;
import com.ducke.rpg_manager.campanha_membros.dtos.CampanhaMembroOutput;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.springframework.stereotype.Component;

import java.util.List;

@Mapper(componentModel = "spring")
@Component
public interface CampanhaMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "membros", ignore = true)
    Campanha toEntity(CampanhaCreateInput input);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "membros", ignore = true)
    void updateEntity(@MappingTarget Campanha entity, CampanhaCreateInput input);

    default CampanhaDetalheOutput toDetalheOutput(
            Campanha entity,
            CampanhaPapelEnum papel,
            String mestreUsername,
            List<CampanhaMembroOutput> membros
    ) {
        return new CampanhaDetalheOutput(
                entity.getId(),
                entity.getNome(),
                entity.getDescricao(),
                entity.getSistema(),
                papel,
                mestreUsername,
                membros
        );
    }
}
