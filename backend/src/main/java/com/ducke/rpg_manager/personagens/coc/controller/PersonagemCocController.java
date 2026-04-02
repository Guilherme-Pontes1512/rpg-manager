package com.ducke.rpg_manager.personagens.coc.controller;

import com.ducke.rpg_manager.personagens.coc.service.PersonagemCocService;
import com.ducke.rpg_manager.personagens.dtos.PersonagemDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/personagens/coc")
@RequiredArgsConstructor
public class PersonagemCocController {

    private final PersonagemCocService cocService;

    @PostMapping
    public ResponseEntity<PersonagemDto> criarPersonagemCoc(PersonagemDto personagemDto) {
        PersonagemDto criado = cocService.criarPersonagemCoc(personagemDto);
        return ResponseEntity.ok(criado);
    }
}
