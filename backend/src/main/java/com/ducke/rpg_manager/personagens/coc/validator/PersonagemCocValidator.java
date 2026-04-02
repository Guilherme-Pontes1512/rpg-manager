package com.ducke.rpg_manager.personagens.coc.validator;

import com.ducke.rpg_manager.personagens.coc.dtos.FichaSRCocDto;
import com.ducke.rpg_manager.personagens.coc.validator.validations.PersonagemCocValidations;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PersonagemCocValidator {

    private final PersonagemCocValidations validations;

    public void validarCriarPersonagemCoc(FichaSRCocDto ficha) {
        validations.validarVida(ficha);
        validations.validarAtributos();
        validations.validarPericias();
    }
}
