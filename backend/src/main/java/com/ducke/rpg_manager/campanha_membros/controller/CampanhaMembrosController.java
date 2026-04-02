package com.ducke.rpg_manager.campanha_membros.controller;

import com.ducke.rpg_manager.campanha.enumx.CampanhaPapelEnum;
import com.ducke.rpg_manager.campanha_membros.dtos.CampanhaMembroInput;
import com.ducke.rpg_manager.campanha_membros.entidade.CampanhaMembro;
import com.ducke.rpg_manager.campanha_membros.service.CampanhaMembrosService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/campanhas/membros")
@RequiredArgsConstructor
public class CampanhaMembrosController {

    private final CampanhaMembrosService campanhaMembrosService;

    @PostMapping
    public ResponseEntity<Void> adicionarMembro(@RequestBody CampanhaMembroInput input) {
        campanhaMembrosService.adicionarMembro(input);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping()
    public ResponseEntity<Void> removerMembro(@PathVariable Long campanhaId) {
        campanhaMembrosService.removerMembro(campanhaId, null);
        return ResponseEntity.noContent().build();
    }
}
