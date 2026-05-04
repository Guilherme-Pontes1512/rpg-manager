package com.ducke.rpg_manager.campanha;

import com.ducke.rpg_manager.campanha.dtos.CampanhaCreateInput;
import com.ducke.rpg_manager.campanha.dtos.AcompanhamentoCampanhaOutput;
import com.ducke.rpg_manager.campanha.dtos.CampanhaDocumentoDownload;
import com.ducke.rpg_manager.campanha.dtos.CampanhaDocumentoOutput;
import com.ducke.rpg_manager.campanha.dtos.CampanhaDetalheOutput;
import com.ducke.rpg_manager.campanha.dtos.CampanhaResumoOutput;
import com.ducke.rpg_manager.campanha.dtos.CampanhaSearchInput;
import com.ducke.rpg_manager.campanha.service.CampanhaAcompanhamentoService;
import com.ducke.rpg_manager.campanha.service.CampanhaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/campanhas")
@RequiredArgsConstructor
public class CampanhaController {

    private final CampanhaService campanhaService;
    private final CampanhaAcompanhamentoService acompanhamentoService;

    @PostMapping
    public ResponseEntity<CampanhaDetalheOutput> criarCampanha(@RequestBody @Valid CampanhaCreateInput input) {
        CampanhaDetalheOutput campanha = campanhaService.criarCampanha(input);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(campanha.id())
                .toUri();

        return ResponseEntity.created(location).body(campanha);
    }

    @GetMapping
    public ResponseEntity<Page<CampanhaResumoOutput>> listarCampanhas(@ModelAttribute CampanhaSearchInput input, Pageable pageable) {
        Page<CampanhaResumoOutput> campanha = campanhaService.listarCampanhas(pageable, input);

        return ResponseEntity.ok(campanha);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CampanhaDetalheOutput> obterCampanhaPorId(@PathVariable Long id) {
        CampanhaDetalheOutput campanha = campanhaService.obterCampanhaPorId(id);
        return ResponseEntity.ok(campanha);
    }

    @GetMapping("/{id}/acompanhamento")
    public ResponseEntity<AcompanhamentoCampanhaOutput> obterAcompanhamento(@PathVariable Long id) {
        return ResponseEntity.ok(acompanhamentoService.obterAcompanhamento(id));
    }

    @PostMapping(value = "/{id}/documentos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CampanhaDocumentoOutput> enviarDocumento(@PathVariable Long id, @RequestParam MultipartFile arquivo) {
        return ResponseEntity.ok(acompanhamentoService.enviarDocumento(id, arquivo));
    }

    @GetMapping("/documentos/notificacoes")
    public ResponseEntity<List<CampanhaDocumentoOutput>> listarNotificacoesDocumentos() {
        return ResponseEntity.ok(acompanhamentoService.listarNotificacoes());
    }

    @GetMapping("/documentos/{documentoId}/download")
    public ResponseEntity<byte[]> baixarDocumento(@PathVariable Long documentoId) {
        CampanhaDocumentoDownload download = acompanhamentoService.baixarDocumento(documentoId);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(download.tipoConteudo()))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(download.nomeArquivo())
                        .build()
                        .toString())
                .body(download.conteudo());
    }

    @PutMapping("/{id}")
    public ResponseEntity<CampanhaDetalheOutput> atualizarCampanha(@PathVariable Long id, @RequestBody @Valid CampanhaCreateInput input) {
        CampanhaDetalheOutput campanha = campanhaService.atualizarCampanha(id, input);
        return ResponseEntity.ok(campanha);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarCampanha(@PathVariable Long id) {
        campanhaService.deletarCampanha(id);
        return ResponseEntity.noContent().build();
    }
}
