package com.ducke.rpg_manager.personagens.coc.service;

import com.ducke.rpg_manager.personagens.coc.mapper.PersonagemCocMapper;
import com.ducke.rpg_manager.personagens.coc.repository.PersonagemCocRepository;
import com.ducke.rpg_manager.personagens.coc.validator.PersonagemCocValidator;
import com.ducke.rpg_manager.personagens.dtos.PersonagemDto;
import com.ducke.rpg_manager.personagens.entidade.Personagem;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PersonagemCocService {

    private final PersonagemCocValidator cocValidator;

    private final PersonagemCocMapper cocMapper;

    private final PersonagemCocRepository cocRepository;

    public PersonagemDto criarPersonagemCoc(PersonagemDto personagemDto) {
        cocValidator.validarCriarPersonagemCoc(personagemDto.dadosFichaJson());

        Personagem personagem = cocMapper.toEntity(personagemDto);

        cocRepository.save(personagem);

        return cocMapper.toDto(personagem);
    }

    public PersonagemDto atualizarPersonagemCoc(Long id, PersonagemDto personagemDto) {
        cocValidator.validarCriarPersonagemCoc(personagemDto.dadosFichaJson());

        Personagem personagemExistente = cocRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Personagem não encontrado com o ID: " + id));

        Personagem personagemAtualizado = cocMapper.toEntity(personagemDto);
        personagemAtualizado.setId(personagemExistente.getId());

        cocRepository.save(personagemAtualizado);

        return cocMapper.toDto(personagemAtualizado);
    }
}
