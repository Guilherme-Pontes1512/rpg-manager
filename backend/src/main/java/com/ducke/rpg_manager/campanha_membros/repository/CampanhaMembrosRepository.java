package com.ducke.rpg_manager.campanha_membros.repository;

import com.ducke.rpg_manager.campanha_membros.entidade.CampanhaMembro;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CampanhaMembrosRepository extends JpaRepository<CampanhaMembro, Integer> {

    Optional<CampanhaMembro> findByCampanhaIdAndUsuarioId(Long id, Long usuarioId);
}
