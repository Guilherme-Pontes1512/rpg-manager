package com.ducke.rpg_manager.personagens.coc.mapper;

import com.ducke.rpg_manager.personagens.dtos.PersonagemDto;
import com.ducke.rpg_manager.personagens.entidade.Personagem;
import org.mapstruct.Mapper;

@Mapper
public interface PersonagemCocMapper {

    Personagem toEntity(PersonagemDto personagemDto);

    PersonagemDto toDto(Personagem personagem);
}
