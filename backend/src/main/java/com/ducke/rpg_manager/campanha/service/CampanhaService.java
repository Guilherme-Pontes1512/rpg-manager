package com.ducke.rpg_manager.campanha.service;

import com.ducke.rpg_manager.campanha.dtos.CampanhaCreateInput;
import com.ducke.rpg_manager.campanha.dtos.CampanhaOutput;
import com.ducke.rpg_manager.campanha.dtos.CampanhaSearchInput;
import com.ducke.rpg_manager.campanha.entidade.Campanha;
import com.ducke.rpg_manager.campanha_membros.dtos.CampanhaMembroInput;
import com.ducke.rpg_manager.campanha_membros.entidade.CampanhaMembro;
import com.ducke.rpg_manager.campanha.enumx.CampanhaPapelEnum;
import com.ducke.rpg_manager.campanha.mapper.CampanhaMapper;
import com.ducke.rpg_manager.campanha.repository.CampanhaCustomRepository;
import com.ducke.rpg_manager.campanha.repository.CampanhaRepository;
import com.ducke.rpg_manager.campanha_membros.service.CampanhaMembrosService;
import com.ducke.rpg_manager.usuario.entidade.Usuario;
import com.ducke.rpg_manager.usuario.service.UsuarioAtualService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CampanhaService {

    private final CampanhaMapper campanhaMapper;

    private final CampanhaRepository campanhaRepository;

    private final CampanhaCustomRepository campanhaCustomRepository;

    private final CampanhaMembrosService campanhaMembrosService;

    private final UsuarioAtualService usuarioAtualService;

    public CampanhaOutput criarCampanha(CampanhaCreateInput input) {
        Campanha entity = campanhaMapper.toEntity(input);
        campanhaRepository.save(entity);

        CampanhaPapelEnum papel = CampanhaPapelEnum.MESTRE;
        Long usuarioId = usuarioAtualService.getId();

        CampanhaMembroInput membroInput = new CampanhaMembroInput(entity.getId(), usuarioId, papel);

        campanhaMembrosService.adicionarMembro(membroInput);

        return campanhaMapper.toOutput(entity, papel);
    }

    public Page<CampanhaOutput> listarCampanhas(Pageable pageable, CampanhaSearchInput input) {
        Long usuarioId = usuarioAtualService.getId();

        return campanhaCustomRepository.listarCampanhas(pageable, input, usuarioId);
    }

    public CampanhaOutput obterCampanhaPorId(Long id) {
        Campanha entity = campanhaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Campanha não encontrada"));

        return campanhaMapper.toOutput(entity);
    }

    public CampanhaOutput atualizarCampanha(Long id, CampanhaCreateInput input) {
        Campanha entity = campanhaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Campanha não encontrada"));

        campanhaMapper.updateEntity(entity, input);

        campanhaRepository.save(entity);

        return campanhaMapper.toOutput(entity, CampanhaPapelEnum.MESTRE);
    }

    public void deletarCampanha(Long id) {
        if (!campanhaRepository.existsById(id)) {
            throw new RuntimeException("Campanha não encontrada");
        }
        campanhaRepository.deleteById(id);
    }
}
