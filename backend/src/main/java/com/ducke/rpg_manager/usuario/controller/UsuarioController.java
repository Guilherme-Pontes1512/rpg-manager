package com.ducke.rpg_manager.usuario.controller;

import com.ducke.rpg_manager.usuario.dtos.UsuarioDto;
import com.ducke.rpg_manager.usuario.service.UsuarioService;
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
    public ResponseEntity<UsuarioDto> cadastrarUsuario(@RequestBody UsuarioDto usuarioDto) {
        UsuarioDto usuarioOutput = usuarioService.cadastrar(usuarioDto);
        return ResponseEntity.ok(usuarioOutput);
    }
}
