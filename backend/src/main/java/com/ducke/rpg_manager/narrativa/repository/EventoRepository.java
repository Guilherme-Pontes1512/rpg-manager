package com.ducke.rpg_manager.narrativa.repository;

import com.ducke.rpg_manager.narrativa.entidade.*;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EventoRepository extends JpaRepository<Evento, Long> {
    boolean existsByCampanhaId(Long campanhaId);
    List<Evento> findAllByCampanhaIdOrderByCriadoEmDesc(Long campanhaId);
    Optional<Evento> findByIdAndCampanhaId(Long id, Long campanhaId);
}
