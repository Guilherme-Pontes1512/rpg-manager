package com.ducke.rpg_manager.usuario.validator;

import com.ducke.rpg_manager.usuario.dtos.UsuarioDto;
import com.ducke.rpg_manager.usuario.validator.validations.UsuarioValidations;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UsuarioValidator {

    private final UsuarioValidations usuarioValidations;

    public void validarCadastro(UsuarioDto usuarioDto) {
        usuarioValidations.validarEmailUnico(usuarioDto.email());
    }
}
