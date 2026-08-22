package com.ducke.rpg_manager.campanha_membros.validator;

import com.ducke.rpg_manager.campanha_membros.validator.validations.CampanhaMembroValidations;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CampanhaMembroValidator {

    private final CampanhaMembroValidations validations;

    public void validarAdicaoMembro(Long campanhaId, Long usuarioId) {
        validations.validarMembroExistente(campanhaId, usuarioId);
    }
}
