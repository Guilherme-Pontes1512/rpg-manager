package com.ducke.rpg_manager.personagens.coc.service;

import com.ducke.rpg_manager.campanha_membros.entidade.CampanhaMembro;
import com.ducke.rpg_manager.campanha_membros.repository.CampanhaMembrosRepository;
import com.ducke.rpg_manager.campanha.enumx.CampanhaPapelEnum;
import com.ducke.rpg_manager.personagens.coc.mapper.PersonagemCocMapper;
import com.ducke.rpg_manager.personagens.coc.repository.PersonagemCocRepository;
import com.ducke.rpg_manager.personagens.coc.validator.PersonagemCocValidator;
import com.ducke.rpg_manager.personagens.dtos.PersonagemDto;
import com.ducke.rpg_manager.personagens.entidade.Personagem;
import com.ducke.rpg_manager.usuario.service.UsuarioAtualService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PersonagemCocService {

    private final PersonagemCocValidator cocValidator;
    private final PersonagemCocMapper cocMapper;
    private final PersonagemCocRepository cocRepository;
    private final CampanhaMembrosRepository campanhaMembrosRepository;
    private final UsuarioAtualService usuarioAtualService;

    public PersonagemDto criarPersonagemCoc(PersonagemDto personagemDto) {
        cocValidator.validarCriarPersonagemCoc(personagemDto.dadosFichaJson());

        Long usuarioId = usuarioAtualService.getId();
        CampanhaMembro campanhaMembro = obterMembroAtual(personagemDto.campanhaId(), usuarioId);

        Personagem personagem = cocMapper.toEntity(personagemDto);
        personagem.setCampanhaMembro(campanhaMembro);
        cocRepository.save(personagem);

        return cocMapper.toDto(personagem);
    }

    public List<PersonagemDto> listarPersonagensCoc(Long campanhaId) {
        Long usuarioId = usuarioAtualService.getId();

        if (campanhaId == null) {
            return cocRepository.findAllByCampanhaMembroUsuarioId(usuarioId)
                    .stream()
                    .map(cocMapper::toDto)
                    .toList();
        }

        CampanhaMembro membroAtual = obterMembroAtual(campanhaId, usuarioId);

        if (membroAtual.getPapel() != CampanhaPapelEnum.MESTRE) {
            return cocRepository.findAllByCampanhaMembroCampanhaIdAndCampanhaMembroUsuarioId(campanhaId, usuarioId)
                    .stream()
                    .map(cocMapper::toDto)
                    .toList();
        }

        return cocRepository.findAllByCampanhaMembroCampanhaId(campanhaId)
                .stream()
                .map(cocMapper::toDto)
                .toList();
    }

    public PersonagemDto obterPersonagemCoc(Long id) {
        Personagem personagem = cocRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Personagem nao encontrado com o ID: " + id));

        return cocMapper.toDto(personagem);
    }

    public PersonagemDto atualizarPersonagemCoc(Long id, PersonagemDto personagemDto) {
        cocValidator.validarCriarPersonagemCoc(personagemDto.dadosFichaJson());

        Personagem personagemExistente = cocRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Personagem nao encontrado com o ID: " + id));

        cocMapper.updateEntity(personagemExistente, personagemDto);
        cocRepository.save(personagemExistente);

        return cocMapper.toDto(personagemExistente);
    }

    public void deletarPersonagemCoc(Long id) {
        if (!cocRepository.existsById(id)) {
            throw new EntityNotFoundException("Personagem nao encontrado com o ID: " + id);
        }

        cocRepository.deleteById(id);
    }

    private CampanhaMembro obterMembroAtual(Long campanhaId, Long usuarioId) {
        return campanhaMembrosRepository.findByCampanhaIdAndUsuarioId(campanhaId, usuarioId)
                .orElseThrow(() -> new AccessDeniedException("Voce nao tem acesso a esta campanha"));
    }
}
