package com.ducke.rpg_manager.usuario.service;

import com.ducke.rpg_manager.usuario.entidade.Usuario;
import com.ducke.rpg_manager.usuario.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UsuarioAtualService {

    private final UsuarioRepository usuarioRepository;

    public Usuario getRequired() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal().equals("anonymousUser")) {
            throw new IllegalStateException("Usuário não autenticado");
        }

        String email = auth.getName();

        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Usuário logado não encontrado no banco"));
    }

    public Long getId() {
        return getRequired().getId();
    }
}
