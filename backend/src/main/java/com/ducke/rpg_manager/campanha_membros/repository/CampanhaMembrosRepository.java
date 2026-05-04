package com.ducke.rpg_manager.campanha_membros.repository;

import com.ducke.rpg_manager.campanha_membros.entidade.CampanhaMembro;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CampanhaMembrosRepository extends JpaRepository<CampanhaMembro, Long> {

    Optional<CampanhaMembro> findByCampanhaIdAndUsuarioId(Long id, Long usuarioId);

    boolean existsByCampanhaIdAndUsuarioId(Long campanhaId, Long usuarioId);

    boolean existsByCampanhaIdAndUsuarioIdAndPapel(Long campanhaId, Long usuarioId, com.ducke.rpg_manager.campanha.enumx.CampanhaPapelEnum papel);

    @EntityGraph(attributePaths = "usuario")
    List<CampanhaMembro> findAllByCampanhaIdOrderByPapelAscUsuarioUsernameAsc(Long campanhaId);
}
