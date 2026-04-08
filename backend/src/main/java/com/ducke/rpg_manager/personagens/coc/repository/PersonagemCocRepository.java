package com.ducke.rpg_manager.personagens.coc.repository;

import com.ducke.rpg_manager.personagens.entidade.Personagem;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PersonagemCocRepository extends JpaRepository<Personagem, Long> {

    @EntityGraph(attributePaths = {"campanhaMembro", "campanhaMembro.campanha"})
    List<Personagem> findAllByCampanhaMembroCampanhaId(Long campanhaId);

    @EntityGraph(attributePaths = {"campanhaMembro", "campanhaMembro.campanha"})
    List<Personagem> findAllByCampanhaMembroUsuarioId(Long usuarioId);

    @EntityGraph(attributePaths = {"campanhaMembro", "campanhaMembro.campanha"})
    List<Personagem> findAllByCampanhaMembroCampanhaIdAndCampanhaMembroUsuarioId(Long campanhaId, Long usuarioId);

    @Override
    @EntityGraph(attributePaths = {"campanhaMembro", "campanhaMembro.campanha"})
    Optional<Personagem> findById(Long id);
}
