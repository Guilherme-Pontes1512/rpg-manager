package com.ducke.rpg_manager.personagens.coc.mapper;

import com.ducke.rpg_manager.personagens.coc.dtos.FichaSRCocDto;
import com.ducke.rpg_manager.personagens.dtos.PersonagemDto;
import com.ducke.rpg_manager.personagens.dtos.PersonagemResumoDto;
import com.ducke.rpg_manager.personagens.entidade.Personagem;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.springframework.beans.factory.annotation.Autowired;

@Mapper(componentModel = "spring")
public abstract class PersonagemCocMapper {

    @Autowired
    protected ObjectMapper objectMapper;

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "campanhaMembro", ignore = true)
    @Mapping(target = "dadosFichaJson", source = "dadosFichaJson")
    public abstract Personagem toEntity(PersonagemDto personagemDto);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "campanhaMembro", ignore = true)
    @Mapping(target = "dadosFichaJson", source = "dadosFichaJson")
    public abstract void updateEntity(@MappingTarget Personagem personagem, PersonagemDto personagemDto);

    @Mapping(target = "campanhaId", source = "campanhaMembro.campanha.id")
    @Mapping(target = "dadosFichaJson", source = "dadosFichaJson")
    public abstract PersonagemDto toDto(Personagem personagem);

    @Mapping(target = "campanhaId", source = "campanhaMembro.campanha.id")
    public abstract PersonagemResumoDto toResumoDto(Personagem personagem);

    protected String map(FichaSRCocDto ficha) {
        if (ficha == null) {
            return null;
        }

        try {
            return objectMapper.writeValueAsString(ficha);
        } catch (JsonProcessingException ex) {
            throw new IllegalArgumentException("Nao foi possivel serializar a ficha do personagem", ex);
        }
    }

    protected FichaSRCocDto map(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        try {
            return objectMapper.readValue(value, FichaSRCocDto.class);
        } catch (JsonProcessingException ex) {
            throw new IllegalArgumentException("Nao foi possivel desserializar a ficha do personagem", ex);
        }
    }
}
