package com.ducke.rpg_manager.usuario.validator;

import com.ducke.rpg_manager.usuario.dtos.AuthRegisterInput;
import com.ducke.rpg_manager.usuario.validator.validations.UsuarioValidations;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UsuarioValidator {

    private final UsuarioValidations usuarioValidations;

    public void validarCadastro(AuthRegisterInput input) {
        usuarioValidations.validarEmailUnico(input.email());
        usuarioValidations.validarUsernameUnico(input.username());
        usuarioValidations.validarConfirmacaoSenha(input.senha(), input.confirmarSenha());
    }

    public void validarConfirmacaoSenha(String senha, String confirmarSenha) {
        usuarioValidations.validarConfirmacaoSenha(senha, confirmarSenha);
    }
}
