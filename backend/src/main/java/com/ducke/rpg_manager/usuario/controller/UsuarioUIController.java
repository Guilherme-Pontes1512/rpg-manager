package com.ducke.rpg_manager.usuario.controller;

import com.ducke.rpg_manager.usuario.repository.UsuarioUiRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/ui/usuarios")
@RequiredArgsConstructor
public class UsuarioUIController {

    private final UsuarioUiRepository usuarioUiRepository;

    public Long getUsuarioId(String username) {
        return usuarioUiRepository.findIdByUsername(username);
    }
}
