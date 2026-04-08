package com.ducke.rpg_manager.personagens.coc.controller;

import com.ducke.rpg_manager.personagens.coc.service.PersonagemCocService;
import com.ducke.rpg_manager.personagens.dtos.PersonagemDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/personagens/coc")
@RequiredArgsConstructor
public class PersonagemCocController {

    private final PersonagemCocService cocService;

    @PostMapping
    public ResponseEntity<PersonagemDto> criarPersonagemCoc(@RequestBody @Valid PersonagemDto personagemDto) {
        return ResponseEntity.ok(cocService.criarPersonagemCoc(personagemDto));
    }

    @GetMapping
    public ResponseEntity<List<PersonagemDto>> listarPersonagensCoc(@RequestParam(required = false) Long campanhaId) {
        return ResponseEntity.ok(cocService.listarPersonagensCoc(campanhaId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PersonagemDto> obterPersonagemCoc(@PathVariable Long id) {
        return ResponseEntity.ok(cocService.obterPersonagemCoc(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PersonagemDto> atualizarPersonagemCoc(@PathVariable Long id, @RequestBody @Valid PersonagemDto personagemDto) {
        return ResponseEntity.ok(cocService.atualizarPersonagemCoc(id, personagemDto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarPersonagemCoc(@PathVariable Long id) {
        cocService.deletarPersonagemCoc(id);
        return ResponseEntity.noContent().build();
    }
}
