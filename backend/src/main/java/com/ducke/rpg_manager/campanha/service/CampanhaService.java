package com.ducke.rpg_manager.campanha.service;

import com.ducke.rpg_manager.campanha.dtos.CampanhaCreateInput;
import com.ducke.rpg_manager.campanha.dtos.CampanhaDetalheOutput;
import com.ducke.rpg_manager.campanha.dtos.CampanhaResumoOutput;
import com.ducke.rpg_manager.campanha.dtos.CampanhaSearchInput;
import com.ducke.rpg_manager.campanha.entidade.Campanha;
import com.ducke.rpg_manager.campanha.enumx.CampanhaPapelEnum;
import com.ducke.rpg_manager.campanha.mapper.CampanhaMapper;
import com.ducke.rpg_manager.campanha.repository.CampanhaCustomRepository;
import com.ducke.rpg_manager.campanha.repository.CampanhaRepository;
import com.ducke.rpg_manager.campanha_membros.dtos.CampanhaMembroInput;
import com.ducke.rpg_manager.campanha_membros.dtos.CampanhaMembroOutput;
import com.ducke.rpg_manager.campanha_membros.service.CampanhaMembrosService;
import com.ducke.rpg_manager.usuario.service.UsuarioAtualService;
import jakarta.persistence.EntityNotFoundException;
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

    public CampanhaDetalheOutput criarCampanha(CampanhaCreateInput input) {
        Campanha entity = campanhaMapper.toEntity(input);
        campanhaRepository.save(entity);

        CampanhaPapelEnum papel = CampanhaPapelEnum.MESTRE;
        Long usuarioId = usuarioAtualService.getId();
        CampanhaMembroInput membroInput = new CampanhaMembroInput(entity.getId(), usuarioId, papel);

        campanhaMembrosService.adicionarMembro(entity.getId(), membroInput);

        return obterCampanhaPorId(entity.getId());
    }

    public Page<CampanhaResumoOutput> listarCampanhas(Pageable pageable, CampanhaSearchInput input) {
        Long usuarioId = usuarioAtualService.getId();
        return campanhaCustomRepository.listarCampanhas(pageable, input, usuarioId);
    }

    public CampanhaDetalheOutput obterCampanhaPorId(Long id) {
        Campanha entity = campanhaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Campanha nao encontrada"));

        Long usuarioId = usuarioAtualService.getId();
        CampanhaPapelEnum papel = campanhaMembrosService.obterPapelDoUsuario(id, usuarioId);
        String mestreUsername = campanhaMembrosService.obterMestreUsername(id);
        var membros = campanhaMembrosService.listarMembrosDaCampanha(id);

        return campanhaMapper.toDetalheOutput(entity, papel, mestreUsername, membros);
    }

    public CampanhaDetalheOutput atualizarCampanha(Long id, CampanhaCreateInput input) {
        campanhaMembrosService.validarPermissaoDeMestre(id);

        Campanha entity = campanhaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Campanha nao encontrada"));

        campanhaMapper.updateEntity(entity, input);
        campanhaRepository.save(entity);

        return obterCampanhaPorId(id);
    }

    public void deletarCampanha(Long id) {
        campanhaMembrosService.validarPermissaoDeMestre(id);

        if (!campanhaRepository.existsById(id)) {
            throw new EntityNotFoundException("Campanha nao encontrada");
        }

        campanhaRepository.deleteById(id);
    }
}
