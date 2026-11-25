package com.ducke.rpg_manager.narrativa.repository;

import com.ducke.rpg_manager.campanha.entidade.Campanha;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CampanhaNarrativaRepository extends JpaRepository<Campanha, Long> {
    @Query(value = "select * from campanhas where id = :id for update", nativeQuery = true)
    Optional<Campanha> lockById(@Param("id") Long id);
}
