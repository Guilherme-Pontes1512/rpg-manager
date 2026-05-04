package com.ducke.rpg_manager.personagens.coc.service;

import com.ducke.rpg_manager.campanha_membros.entidade.CampanhaMembro;
import com.ducke.rpg_manager.campanha_membros.repository.CampanhaMembrosRepository;
import com.ducke.rpg_manager.campanha.enumx.CampanhaPapelEnum;
import com.ducke.rpg_manager.personagens.coc.mapper.PersonagemCocMapper;
import com.ducke.rpg_manager.personagens.coc.repository.PersonagemCocRepository;
import com.ducke.rpg_manager.personagens.coc.validator.PersonagemCocValidator;
import com.ducke.rpg_manager.personagens.dtos.PersonagemDto;
import com.ducke.rpg_manager.personagens.dtos.PersonagemResumoDto;
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

    public List<PersonagemResumoDto> listarPersonagensCoc(Long campanhaId) {
        Long usuarioId = usuarioAtualService.getId();

        if (campanhaId == null) {
            return cocRepository.findAllByUsuarioComAcesso(usuarioId)
                    .stream()
                    .map(cocMapper::toResumoDto)
                    .toList();
        }

        obterMembroAtual(campanhaId, usuarioId);

        return cocRepository.findAllByCampanhaMembroCampanhaId(campanhaId)
                .stream()
                .map(cocMapper::toResumoDto)
                .toList();
    }

    public PersonagemDto obterPersonagemCoc(Long id) {
        Personagem personagem = obterPersonagemPorId(id);
        validarPermissaoSobrePersonagem(personagem);

        return cocMapper.toDto(personagem);
    }

    public PersonagemDto atualizarPersonagemCoc(Long id, PersonagemDto personagemDto) {
        cocValidator.validarCriarPersonagemCoc(personagemDto.dadosFichaJson());

        Personagem personagemExistente = obterPersonagemPorId(id);
        validarPermissaoSobrePersonagem(personagemExistente);

        cocMapper.updateEntity(personagemExistente, personagemDto);
        cocRepository.save(personagemExistente);

        return cocMapper.toDto(personagemExistente);
    }

    public void deletarPersonagemCoc(Long id) {
        Personagem personagem = obterPersonagemPorId(id);
        validarPermissaoSobrePersonagem(personagem);

        cocRepository.delete(personagem);
    }

    private CampanhaMembro obterMembroAtual(Long campanhaId, Long usuarioId) {
        return campanhaMembrosRepository.findByCampanhaIdAndUsuarioId(campanhaId, usuarioId)
                .orElseThrow(() -> new AccessDeniedException("Voce nao tem acesso a esta campanha"));
    }

    private Personagem obterPersonagemPorId(Long id) {
        return cocRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Personagem nao encontrado com o ID: " + id));
    }

    private void validarPermissaoSobrePersonagem(Personagem personagem) {
        Long usuarioId = usuarioAtualService.getId();
        CampanhaMembro membroAtual = obterMembroAtual(personagem.getCampanhaMembro().getCampanha().getId(), usuarioId);

        boolean isMestre = membroAtual.getPapel() == CampanhaPapelEnum.MESTRE;
        boolean isDonoDoPersonagem = personagem.getCampanhaMembro().getUsuario().getId().equals(usuarioId);

        if (!isMestre && !isDonoDoPersonagem) {
            throw new AccessDeniedException("Apenas o mestre ou o dono do personagem podem acessar esta ficha");
        }
    }
}
