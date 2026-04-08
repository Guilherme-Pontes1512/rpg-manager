package com.ducke.rpg_manager.personagens.coc.mapper;

import com.ducke.rpg_manager.personagens.coc.dtos.FichaSRCocDto;
import com.ducke.rpg_manager.personagens.dtos.PersonagemDto;
import com.ducke.rpg_manager.personagens.entidade.Personagem;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface PersonagemCocMapper {

    ObjectMapper JSON = new ObjectMapper();

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "campanhaMembro", ignore = true)
    @Mapping(target = "dadosFichaJson", source = "dadosFichaJson")
    Personagem toEntity(PersonagemDto personagemDto);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "campanhaMembro", ignore = true)
    @Mapping(target = "dadosFichaJson", source = "dadosFichaJson")
    void updateEntity(@MappingTarget Personagem personagem, PersonagemDto personagemDto);

    @Mapping(target = "campanhaId", source = "campanhaMembro.campanha.id")
    @Mapping(target = "dadosFichaJson", source = "dadosFichaJson")
    PersonagemDto toDto(Personagem personagem);

    default String map(FichaSRCocDto ficha) {
        if (ficha == null) {
            return null;
        }

        try {
            return JSON.writeValueAsString(ficha);
        } catch (JsonProcessingException ex) {
            throw new IllegalArgumentException("Nao foi possivel serializar a ficha do personagem", ex);
        }
    }

    default FichaSRCocDto map(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        try {
            return JSON.readValue(value, FichaSRCocDto.class);
        } catch (JsonProcessingException ex) {
            throw new IllegalArgumentException("Nao foi possivel desserializar a ficha do personagem", ex);
        }
    }
}
