package com.ducke.rpg_manager.narrativa.repository;

import com.ducke.rpg_manager.narrativa.entidade.*;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SessaoRepository extends JpaRepository<Sessao, Long> {
    boolean existsByCampanhaId(Long campanhaId);
    List<Sessao> findAllByCampanhaIdOrderByCriadoEmDescIdDesc(Long campanhaId);
    Optional<Sessao> findByIdAndCampanhaId(Long id, Long campanhaId);
    boolean existsByCampanhaIdAndNumero(Long campanhaId, Integer numero);
    boolean existsByCampanhaIdAndStatus(Long campanhaId, StatusSessao status);
}
