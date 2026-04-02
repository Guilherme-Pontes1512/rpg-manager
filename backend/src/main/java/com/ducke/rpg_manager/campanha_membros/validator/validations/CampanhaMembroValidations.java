package com.ducke.rpg_manager.campanha_membros.validator.validations;

import com.ducke.rpg_manager.campanha_membros.repository.CampanhaMembrosRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CampanhaMembroValidations {

    private final CampanhaMembrosRepository repository;

    public void validarMembroExistente(Long campanhaId, Long usuarioId) {
        if (repository.findByCampanhaIdAndUsuarioId(campanhaId, usuarioId).isPresent()) {
            throw new IllegalStateException("O usuário já é membro da campanha");
        }
    }
}
