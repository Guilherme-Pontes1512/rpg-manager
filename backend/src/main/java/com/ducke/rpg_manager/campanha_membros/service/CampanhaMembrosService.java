package com.ducke.rpg_manager.campanha_membros.service;

import com.ducke.rpg_manager.campanha.entidade.Campanha;
import com.ducke.rpg_manager.campanha.enumx.CampanhaPapelEnum;
import com.ducke.rpg_manager.campanha.repository.CampanhaRepository;
import com.ducke.rpg_manager.campanha_membros.dtos.CampanhaMembroInput;
import com.ducke.rpg_manager.campanha_membros.entidade.CampanhaMembro;
import com.ducke.rpg_manager.campanha_membros.mapper.CampanhaMembroMapper;
import com.ducke.rpg_manager.campanha_membros.repository.CampanhaMembrosRepository;
import com.ducke.rpg_manager.campanha_membros.validator.CampanhaMembroValidator;
import com.ducke.rpg_manager.usuario.entidade.Usuario;
import com.ducke.rpg_manager.usuario.repository.UsuarioRepository;
import com.ducke.rpg_manager.usuario.service.UsuarioAtualService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CampanhaMembrosService {

    private final CampanhaMembrosRepository campanhaMembrosRepository;

    private final CampanhaMembroMapper campanhaMembroMapper;

    private final UsuarioRepository usuarioRepository;

    private final CampanhaRepository campanhaRepository;

    private final CampanhaMembroValidator campanhaMembroValidator;

    public void adicionarMembro(CampanhaMembroInput input) {
        campanhaMembroValidator.validarAdicaoMembro(input.campanhaId(),  input.usuarioId());

        Campanha campanha = campanhaRepository.findById(input.campanhaId()).orElseThrow(() -> new EntityNotFoundException("Não foi possível encontrar a campanha!"));
        Usuario usuario = usuarioRepository.findById(input.usuarioId()).orElseThrow(() -> new EntityNotFoundException("Não foi possível encontrar o usuário!"));

        CampanhaMembro campanhaMembro = campanhaMembroMapper.toEntity(input);

        campanhaMembrosRepository.save(campanhaMembro);
    }

    public void removerMembro(Long campanhaId, Long usuarioId) {
        Campanha campanha = campanhaRepository.findById(campanhaId).orElseThrow(() -> new EntityNotFoundException("Não foi possível encontrar a campanha!"));

        CampanhaMembro campanhaMembro = campanhaMembrosRepository.findByCampanhaIdAndUsuarioId(campanha.getId(), usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Não foi possível encontrar o membro na campanha!"));

        campanhaMembrosRepository.delete(campanhaMembro);
    }
}
