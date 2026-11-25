package com.ducke.rpg_manager.narrativa.repository;

import com.ducke.rpg_manager.narrativa.entidade.*;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotaSessaoRepository extends JpaRepository<NotaSessao, Long> {
    List<NotaSessao> findAllBySessaoCampanhaId(Long campanhaId);
    List<NotaSessao> findAllBySessaoIdOrderByCriadoEmAscIdAsc(Long sessaoId);
    Optional<NotaSessao> findByIdAndSessaoId(Long id, Long sessaoId);
    void deleteAllBySessaoId(Long sessaoId);
    boolean existsByEventoId(Long eventoId);
}
