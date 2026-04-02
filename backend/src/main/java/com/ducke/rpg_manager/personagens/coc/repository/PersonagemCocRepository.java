package com.ducke.rpg_manager.personagens.coc.repository;

import com.ducke.rpg_manager.personagens.entidade.Personagem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PersonagemCocRepository extends JpaRepository<Personagem, Long> {
}
