package com.ducke.rpg_manager.personagens.coc.validator.validations;

import com.ducke.rpg_manager.personagens.coc.dtos.FichaSRCocDto;
import org.springframework.stereotype.Component;

@Component
public class PersonagemCocValidations {

    public void validarVida(FichaSRCocDto ficha) {
        if (ficha.vidaAtual() > ficha.vidaMaxima()) {
            throw new IllegalArgumentException("A vida atual nao pode ser maior que a vida maxima.");
        }
    }

    public void validarAtributos(FichaSRCocDto ficha) {
        if (ficha.atributos() == null) {
            throw new IllegalArgumentException("Os atributos da ficha sao obrigatorios.");
        }
    }

    public void validarPericias(FichaSRCocDto ficha) {
        if (ficha.pericias() == null) {
            return;
        }

        boolean possuiValorInvalido = ficha.pericias().stream()
                .anyMatch(pericia -> pericia.base() == null
                        || pericia.base() < 0
                        || pericia.base() > 999
                        || pericia.valor() == null
                        || pericia.valor() < 0
                        || pericia.valor() > 999);

        if (possuiValorInvalido) {
            throw new IllegalArgumentException("As pericias devem possuir valores base e normal de 0 a 999.");
        }
    }
}
