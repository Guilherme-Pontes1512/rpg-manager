package com.ducke.rpg_manager.usuario.validator.validations;

import com.ducke.rpg_manager.usuario.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UsuarioValidations {

    private final UsuarioRepository usuarioRepository;

    public void validarEmailUnico(String email) {
        if (usuarioRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("O email já está em uso.");
        }
    }
}
