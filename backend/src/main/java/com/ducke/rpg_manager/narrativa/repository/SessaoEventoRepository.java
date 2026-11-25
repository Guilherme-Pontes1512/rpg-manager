package com.ducke.rpg_manager.narrativa.repository;

import com.ducke.rpg_manager.narrativa.entidade.*;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SessaoEventoRepository extends JpaRepository<SessaoEvento, Long> {
    List<SessaoEvento> findAllBySessaoIdOrderByOrdemAscIdAsc(Long sessaoId);
    List<SessaoEvento> findAllByEventoId(Long eventoId);
    List<SessaoEvento> findAllByEventoCampanhaId(Long campanhaId);
    Optional<SessaoEvento> findByIdAndSessaoId(Long id, Long sessaoId);
    boolean existsBySessaoIdAndEventoId(Long sessaoId, Long eventoId);
    void deleteAllBySessaoId(Long sessaoId);
}
