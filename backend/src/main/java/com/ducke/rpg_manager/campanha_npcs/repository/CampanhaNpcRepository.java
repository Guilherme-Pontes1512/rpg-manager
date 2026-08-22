package com.ducke.rpg_manager.campanha_npcs.repository;

import com.ducke.rpg_manager.campanha_npcs.entidade.CampanhaNpc;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CampanhaNpcRepository extends JpaRepository<CampanhaNpc, Long> {

    List<CampanhaNpc> findAllByCampanhaIdOrderByNomeAsc(Long campanhaId);
}
