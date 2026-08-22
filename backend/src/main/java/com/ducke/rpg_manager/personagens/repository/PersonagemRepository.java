package com.ducke.rpg_manager.personagens.repository;

import com.ducke.rpg_manager.personagens.entidade.Personagem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PersonagemRepository extends JpaRepository<Personagem, Long> {

    void deleteAllByCampanhaMembroId(Long campanhaMembroId);
}
