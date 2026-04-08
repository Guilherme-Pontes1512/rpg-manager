package com.ducke.rpg_manager.campanha;

import com.ducke.rpg_manager.campanha.dtos.CampanhaCreateInput;
import com.ducke.rpg_manager.campanha.dtos.CampanhaDetalheOutput;
import com.ducke.rpg_manager.campanha.dtos.CampanhaResumoOutput;
import com.ducke.rpg_manager.campanha.dtos.CampanhaSearchInput;
import com.ducke.rpg_manager.campanha.service.CampanhaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;

@RestController
@RequestMapping("/api/campanhas")
@RequiredArgsConstructor
public class CampanhaController {

    private final CampanhaService campanhaService;

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
