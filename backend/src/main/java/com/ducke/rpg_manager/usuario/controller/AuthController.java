package com.ducke.rpg_manager.usuario.controller;

import com.ducke.rpg_manager.usuario.dtos.AuthActionOutput;
import com.ducke.rpg_manager.usuario.dtos.AuthEmailInput;
import com.ducke.rpg_manager.usuario.dtos.AuthRegisterInput;
import com.ducke.rpg_manager.usuario.dtos.AuthResetPasswordInput;
import com.ducke.rpg_manager.usuario.dtos.AuthUserOutput;
import com.ducke.rpg_manager.usuario.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UsuarioService usuarioService;

    @PostMapping("/register")
    public ResponseEntity<AuthUserOutput> register(@RequestBody @Valid AuthRegisterInput input) {
        return ResponseEntity.ok(usuarioService.cadastrar(input));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<AuthActionOutput> forgotPassword(@RequestBody @Valid AuthEmailInput input) {
        return ResponseEntity.ok(usuarioService.solicitarRecuperacaoSenha(input));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<AuthActionOutput> resetPassword(@RequestBody @Valid AuthResetPasswordInput input) {
        return ResponseEntity.ok(usuarioService.redefinirSenha(input));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthUserOutput> me() {
        return ResponseEntity.ok(usuarioService.obterUsuarioAtual());
    }
}
