package com.ducke.rpg_manager.campanha.service;

import com.ducke.rpg_manager.campanha.dtos.AcompanhamentoCampanhaOutput;
import com.ducke.rpg_manager.campanha.dtos.AcompanhamentoPersonagemOutput;
import com.ducke.rpg_manager.campanha.dtos.CampanhaDocumentoDownload;
import com.ducke.rpg_manager.campanha.dtos.CampanhaDocumentoOutput;
import com.ducke.rpg_manager.campanha.entidade.Campanha;
import com.ducke.rpg_manager.campanha.entidade.CampanhaDocumento;
import com.ducke.rpg_manager.campanha.entidade.CampanhaDocumentoDownloadStatus;
import com.ducke.rpg_manager.campanha.repository.CampanhaDocumentoDownloadStatusRepository;
import com.ducke.rpg_manager.campanha.repository.CampanhaDocumentoRepository;
import com.ducke.rpg_manager.campanha.repository.CampanhaRepository;
import com.ducke.rpg_manager.campanha_membros.repository.CampanhaMembrosRepository;
import com.ducke.rpg_manager.personagens.coc.dtos.FichaSRCocDto;
import com.ducke.rpg_manager.personagens.coc.repository.PersonagemCocRepository;
import com.ducke.rpg_manager.personagens.entidade.Personagem;
import com.ducke.rpg_manager.usuario.entidade.Usuario;
import com.ducke.rpg_manager.usuario.repository.UsuarioRepository;
import com.ducke.rpg_manager.usuario.service.UsuarioAtualService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CampanhaAcompanhamentoService {

    private static final Set<String> TIPOS_PERMITIDOS = Set.of("application/pdf", "image/jpeg", "image/png");
    private static final long TAMANHO_MAXIMO_BYTES = 10 * 1024 * 1024;

    private final CampanhaRepository campanhaRepository;
    private final CampanhaMembrosRepository campanhaMembrosRepository;
    private final CampanhaDocumentoRepository documentoRepository;
    private final CampanhaDocumentoDownloadStatusRepository downloadStatusRepository;
    private final PersonagemCocRepository personagemRepository;
    private final UsuarioAtualService usuarioAtualService;
    private final UsuarioRepository usuarioRepository;
    private final ObjectMapper objectMapper;

    public AcompanhamentoCampanhaOutput obterAcompanhamento(Long campanhaId) {
        validarMestre(campanhaId);
        Campanha campanha = obterCampanha(campanhaId);
        Long usuarioId = usuarioAtualService.getId();

        List<AcompanhamentoPersonagemOutput> personagens = personagemRepository.findAllByCampanhaMembroCampanhaId(campanhaId)
                .stream()
                .map(this::toAcompanhamentoPersonagem)
                .toList();

        List<CampanhaDocumentoOutput> documentos = documentoRepository.findAllByCampanhaIdOrderByEnviadoEmDesc(campanhaId)
                .stream()
                .map(documento -> toDocumentoOutput(documento, usuarioId))
                .toList();

        return new AcompanhamentoCampanhaOutput(campanha.getId(), campanha.getNome(), personagens, documentos);
    }

    @Transactional
    public CampanhaDocumentoOutput enviarDocumento(Long campanhaId, MultipartFile arquivo) {
        validarMestre(campanhaId);
        validarArquivo(arquivo);

        Campanha campanha = obterCampanha(campanhaId);
        Usuario usuario = usuarioRepository.findById(usuarioAtualService.getId())
                .orElseThrow(() -> new EntityNotFoundException("Usuario nao encontrado"));

        CampanhaDocumento documento = new CampanhaDocumento();
        documento.setCampanha(campanha);
        documento.setEnviadoPor(usuario);
        documento.setNomeArquivo(arquivo.getOriginalFilename() == null ? "documento" : arquivo.getOriginalFilename());
        documento.setTipoConteudo(arquivo.getContentType());
        documento.setTamanhoBytes(arquivo.getSize());
        documento.setEnviadoEm(Instant.now());

        try {
            documento.setConteudo(arquivo.getBytes());
        } catch (IOException ex) {
            throw new IllegalArgumentException("Nao foi possivel ler o arquivo enviado", ex);
        }

        documentoRepository.save(documento);
        return toDocumentoOutput(documento, usuario.getId());
    }

    public List<CampanhaDocumentoOutput> listarNotificacoes() {
        Long usuarioId = usuarioAtualService.getId();
        return documentoRepository.findNotificacoesDoUsuario(usuarioId)
                .stream()
                .filter(documento -> !downloadStatusRepository.existsByDocumentoIdAndUsuarioId(documento.getId(), usuarioId))
                .map(documento -> toDocumentoOutput(documento, usuarioId))
                .toList();
    }

    @Transactional
    public CampanhaDocumentoDownload baixarDocumento(Long documentoId) {
        CampanhaDocumento documento = documentoRepository.findById(documentoId)
                .orElseThrow(() -> new EntityNotFoundException("Documento nao encontrado"));
        Long usuarioId = usuarioAtualService.getId();
        validarAcessoCampanha(documento.getCampanha().getId(), usuarioId);

        downloadStatusRepository.findByDocumentoIdAndUsuarioId(documentoId, usuarioId)
                .orElseGet(() -> {
                    Usuario usuario = usuarioRepository.findById(usuarioId)
                            .orElseThrow(() -> new EntityNotFoundException("Usuario nao encontrado"));
                    CampanhaDocumentoDownloadStatus status = new CampanhaDocumentoDownloadStatus();
                    status.setDocumento(documento);
                    status.setUsuario(usuario);
                    status.setBaixadoEm(Instant.now());
                    return downloadStatusRepository.save(status);
                });

        return new CampanhaDocumentoDownload(documento.getNomeArquivo(), documento.getTipoConteudo(), documento.getConteudo());
    }

    private void validarArquivo(MultipartFile arquivo) {
        if (arquivo == null || arquivo.isEmpty()) {
            throw new IllegalArgumentException("Informe um arquivo para envio");
        }

        if (!TIPOS_PERMITIDOS.contains(arquivo.getContentType())) {
            throw new IllegalArgumentException("Apenas PDF, JPEG, JPG e PNG sao permitidos");
        }

        if (arquivo.getSize() > TAMANHO_MAXIMO_BYTES) {
            throw new IllegalArgumentException("O arquivo deve ter no maximo 10MB");
        }
    }

    private void validarMestre(Long campanhaId) {
        Long usuarioId = usuarioAtualService.getId();
        if (!campanhaMembrosRepository.existsByCampanhaIdAndUsuarioIdAndPapel(
                campanhaId,
                usuarioId,
                com.ducke.rpg_manager.campanha.enumx.CampanhaPapelEnum.MESTRE
        )) {
            throw new AccessDeniedException("Apenas o mestre pode acessar o acompanhamento da campanha");
        }
    }

    private void validarAcessoCampanha(Long campanhaId, Long usuarioId) {
        if (!campanhaMembrosRepository.existsByCampanhaIdAndUsuarioId(campanhaId, usuarioId)) {
            throw new AccessDeniedException("Voce nao tem acesso a esta campanha");
        }
    }

    private Campanha obterCampanha(Long campanhaId) {
        return campanhaRepository.findById(campanhaId)
                .orElseThrow(() -> new EntityNotFoundException("Campanha nao encontrada"));
    }

    private AcompanhamentoPersonagemOutput toAcompanhamentoPersonagem(Personagem personagem) {
        FichaSRCocDto ficha = lerFicha(personagem.getDadosFichaJson());
        String retratoUrl = ficha == null || ficha.retratoUrl() == null || ficha.retratoUrl().isBlank()
                ? personagem.getImageUrl()
                : ficha.retratoUrl();

        return new AcompanhamentoPersonagemOutput(
                personagem.getId(),
                personagem.getNome(),
                personagem.getCampanhaMembro().getUsuario().getUsername(),
                retratoUrl,
                ficha == null ? null : ficha.vidaAtual(),
                ficha == null ? null : ficha.vidaMaxima(),
                ficha == null ? null : ficha.sanidade()
        );
    }

    private FichaSRCocDto lerFicha(String dadosFichaJson) {
        if (dadosFichaJson == null || dadosFichaJson.isBlank()) {
            return null;
        }

        try {
            return objectMapper.readValue(dadosFichaJson, FichaSRCocDto.class);
        } catch (IOException ex) {
            throw new IllegalArgumentException("Nao foi possivel ler a ficha do personagem", ex);
        }
    }

    private CampanhaDocumentoOutput toDocumentoOutput(CampanhaDocumento documento, Long usuarioId) {
        return new CampanhaDocumentoOutput(
                documento.getId(),
                documento.getCampanha().getId(),
                documento.getCampanha().getNome(),
                documento.getNomeArquivo(),
                documento.getTipoConteudo(),
                documento.getEnviadoPor().getUsername(),
                documento.getEnviadoEm(),
                downloadStatusRepository.existsByDocumentoIdAndUsuarioId(documento.getId(), usuarioId)
        );
    }
}
