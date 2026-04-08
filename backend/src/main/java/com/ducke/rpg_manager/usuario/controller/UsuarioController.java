package com.ducke.rpg_manager.usuario.controller;

import com.ducke.rpg_manager.usuario.dtos.AuthRegisterInput;
import com.ducke.rpg_manager.usuario.dtos.AuthUserOutput;
import com.ducke.rpg_manager.usuario.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;

    @PostMapping
    public ResponseEntity<AuthUserOutput> cadastrarUsuario(@RequestBody @Valid AuthRegisterInput input) {
        return ResponseEntity.ok(usuarioService.cadastrar(input));
    }
}
