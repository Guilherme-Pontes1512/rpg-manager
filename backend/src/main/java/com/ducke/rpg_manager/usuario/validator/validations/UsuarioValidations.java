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
            throw new IllegalArgumentException("O email ja esta em uso.");
        }
    }

    public void validarUsernameUnico(String username) {
        if (usuarioRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("O nome de usuario ja esta em uso.");
        }
    }

    public void validarConfirmacaoSenha(String senha, String confirmarSenha) {
        if (!senha.equals(confirmarSenha)) {
            throw new IllegalArgumentException("A confirmacao de senha nao confere.");
        }
    }
}
