package com.ducke.rpg_manager.campanha_membros.controller;

import com.ducke.rpg_manager.campanha_membros.dtos.CampanhaMembroInput;
import com.ducke.rpg_manager.campanha_membros.dtos.CampanhaMembroOutput;
import com.ducke.rpg_manager.campanha_membros.dtos.CampanhaPlayerInput;
import com.ducke.rpg_manager.campanha_membros.service.CampanhaMembrosService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/campanhas/{campanhaId}/membros")
@RequiredArgsConstructor
public class CampanhaMembrosController {

    private final CampanhaMembrosService campanhaMembrosService;

    @PostMapping
    public ResponseEntity<Void> adicionarMembro(@PathVariable Long campanhaId, @RequestBody @Valid CampanhaMembroInput input) {
        campanhaMembrosService.adicionarMembro(campanhaId, input);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<List<CampanhaMembroOutput>> listarMembros(@PathVariable Long campanhaId) {
        return ResponseEntity.ok(campanhaMembrosService.listarMembrosDaCampanha(campanhaId));
    }

    @PostMapping("/players")
    public ResponseEntity<CampanhaMembroOutput> adicionarPlayer(@PathVariable Long campanhaId, @RequestBody @Valid CampanhaPlayerInput input) {
        return ResponseEntity.ok(campanhaMembrosService.adicionarPlayer(campanhaId, input));
    }

    @DeleteMapping("/{usuarioId}")
    public ResponseEntity<Void> removerMembro(@PathVariable Long campanhaId, @PathVariable Long usuarioId) {
        campanhaMembrosService.removerMembro(campanhaId, usuarioId);
        return ResponseEntity.noContent().build();
    }
}
