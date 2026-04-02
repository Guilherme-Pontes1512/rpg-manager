package com.ducke.rpg_manager.personagens.coc.validator.validations;

import com.ducke.rpg_manager.personagens.coc.dtos.FichaSRCocDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PersonagemCocValidations {

    public void validarVida(FichaSRCocDto ficha) {
        if (ficha.vidaAtual() > ficha.vidaMaxima()) {
            throw new IllegalArgumentException("A vida atual não pode ser maior que a vida máxima.");
        }
    }
}
