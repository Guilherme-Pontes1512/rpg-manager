package com.ducke.rpg_manager.campanha_membros.service;

import com.ducke.rpg_manager.campanha.entidade.Campanha;
import com.ducke.rpg_manager.campanha.enumx.CampanhaPapelEnum;
import com.ducke.rpg_manager.campanha.repository.CampanhaRepository;
import com.ducke.rpg_manager.campanha_membros.dtos.CampanhaMembroInput;
import com.ducke.rpg_manager.campanha_membros.dtos.CampanhaMembroOutput;
import com.ducke.rpg_manager.campanha_membros.dtos.CampanhaPlayerInput;
import com.ducke.rpg_manager.campanha_membros.entidade.CampanhaMembro;
import com.ducke.rpg_manager.campanha_membros.mapper.CampanhaMembroMapper;
import com.ducke.rpg_manager.campanha_membros.repository.CampanhaMembrosRepository;
import com.ducke.rpg_manager.campanha_membros.validator.CampanhaMembroValidator;
import com.ducke.rpg_manager.personagens.repository.PersonagemRepository;
import com.ducke.rpg_manager.usuario.entidade.Usuario;
import com.ducke.rpg_manager.usuario.repository.UsuarioRepository;
import com.ducke.rpg_manager.usuario.service.UsuarioAtualService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Comparator;

@Service
@RequiredArgsConstructor
public class CampanhaMembrosService {

    private final CampanhaMembrosRepository campanhaMembrosRepository;
    private final CampanhaMembroMapper campanhaMembroMapper;
    private final UsuarioRepository usuarioRepository;
    private final CampanhaRepository campanhaRepository;
    private final CampanhaMembroValidator campanhaMembroValidator;
    private final UsuarioAtualService usuarioAtualService;
    private final PersonagemRepository personagemRepository;

    @Transactional
    public void adicionarMembro(Long campanhaId, CampanhaMembroInput input) {
        campanhaMembroValidator.validarAdicaoMembro(campanhaId, input.usuarioId());

        Campanha campanha = campanhaRepository.findById(campanhaId)
                .orElseThrow(() -> new EntityNotFoundException("Nao foi possivel encontrar a campanha"));
        Usuario usuario = usuarioRepository.findById(input.usuarioId())
                .orElseThrow(() -> new EntityNotFoundException("Nao foi possivel encontrar o usuario"));

        CampanhaMembro campanhaMembro = campanhaMembroMapper.toEntity(input);
        campanhaMembro.setCampanha(campanha);
        campanhaMembro.setUsuario(usuario);

        campanhaMembrosRepository.save(campanhaMembro);
    }

    @Transactional
    public CampanhaMembroOutput adicionarPlayer(Long campanhaId, CampanhaPlayerInput input) {
        validarPermissaoDeMestre(campanhaId);

        Usuario usuario = usuarioRepository.findByEmailIgnoreCase(input.identificador())
                .or(() -> usuarioRepository.findByUsernameIgnoreCase(input.identificador()))
                .orElseThrow(() -> new EntityNotFoundException("Nao foi possivel encontrar o usuario informado"));

        adicionarMembro(campanhaId, new CampanhaMembroInput(campanhaId, usuario.getId(), CampanhaPapelEnum.JOGADOR));
        return toOutput(campanhaId, usuario.getId());
    }

    @Transactional
    public void removerMembro(Long campanhaId, Long usuarioId) {
        validarPermissaoDeMestre(campanhaId);

        Campanha campanha = campanhaRepository.findById(campanhaId)
                .orElseThrow(() -> new EntityNotFoundException("Nao foi possivel encontrar a campanha"));

        CampanhaMembro campanhaMembro = campanhaMembrosRepository.findByCampanhaIdAndUsuarioId(campanha.getId(), usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Nao foi possivel encontrar o membro na campanha"));

        if (campanhaMembro.getPapel() == CampanhaPapelEnum.MESTRE) {
            throw new IllegalStateException("O mestre da campanha nao pode ser removido");
        }

        personagemRepository.deleteAllByCampanhaMembroId(campanhaMembro.getId());
        campanhaMembrosRepository.delete(campanhaMembro);
    }

    public List<CampanhaMembroOutput> listarMembrosDaCampanha(Long campanhaId) {
        validarAcessoACampanha(campanhaId);

        return campanhaMembrosRepository.findAllByCampanhaIdOrderByPapelAscUsuarioUsernameAsc(campanhaId)
                .stream()
                .map(this::toOutput)
                .sorted(Comparator
                        .comparing((CampanhaMembroOutput membro) -> membro.papel() != CampanhaPapelEnum.MESTRE)
                        .thenComparing(CampanhaMembroOutput::username, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    public CampanhaPapelEnum obterPapelDoUsuario(Long campanhaId, Long usuarioId) {
        return campanhaMembrosRepository.findByCampanhaIdAndUsuarioId(campanhaId, usuarioId)
                .map(CampanhaMembro::getPapel)
                .orElseThrow(() -> new AccessDeniedException("Voce nao tem acesso a esta campanha"));
    }

    public String obterMestreUsername(Long campanhaId) {
        return campanhaMembrosRepository.findAllByCampanhaIdOrderByPapelAscUsuarioUsernameAsc(campanhaId)
                .stream()
                .filter(membro -> membro.getPapel() == CampanhaPapelEnum.MESTRE)
                .map(membro -> membro.getUsuario().getUsername())
                .findFirst()
                .orElseThrow(() -> new EntityNotFoundException("Nao foi possivel encontrar o mestre da campanha"));
    }

    public void validarPermissaoDeMestre(Long campanhaId) {
        Long usuarioId = usuarioAtualService.getId();
        boolean isMestre = campanhaMembrosRepository.existsByCampanhaIdAndUsuarioIdAndPapel(campanhaId, usuarioId, CampanhaPapelEnum.MESTRE);

        if (!isMestre) {
            throw new AccessDeniedException("Apenas o mestre da campanha pode realizar esta operacao");
        }
    }

    private void validarAcessoACampanha(Long campanhaId) {
        Long usuarioId = usuarioAtualService.getId();

        if (campanhaMembrosRepository.findByCampanhaIdAndUsuarioId(campanhaId, usuarioId).isEmpty()) {
            throw new AccessDeniedException("Voce nao tem acesso a esta campanha");
        }
    }

    private CampanhaMembroOutput toOutput(CampanhaMembro campanhaMembro) {
        Usuario usuario = campanhaMembro.getUsuario();
        return new CampanhaMembroOutput(
                campanhaMembro.getId(),
                usuario.getId(),
                usuario.getNome(),
                usuario.getUsername(),
                usuario.getEmail(),
                campanhaMembro.getPapel()
        );
    }

    private CampanhaMembroOutput toOutput(Long campanhaId, Long usuarioId) {
        CampanhaMembro campanhaMembro = campanhaMembrosRepository.findByCampanhaIdAndUsuarioId(campanhaId, usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Nao foi possivel encontrar o membro na campanha"));
        return toOutput(campanhaMembro);
    }
}
