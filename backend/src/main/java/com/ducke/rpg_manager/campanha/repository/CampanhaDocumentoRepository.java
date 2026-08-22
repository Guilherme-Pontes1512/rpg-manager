package com.ducke.rpg_manager.campanha.repository;

import com.ducke.rpg_manager.campanha.entidade.CampanhaDocumento;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CampanhaDocumentoRepository extends JpaRepository<CampanhaDocumento, Long> {

    @EntityGraph(attributePaths = {"campanha", "enviadoPor"})
    List<CampanhaDocumento> findAllByCampanhaIdOrderByEnviadoEmDesc(Long campanhaId);

    @Query("""
            select d
            from CampanhaDocumento d
            join fetch d.campanha c
            join fetch d.enviadoPor u
            where exists (
                select 1
                from CampanhaMembro membro
                where membro.campanha.id = c.id
                  and membro.usuario.id = :usuarioId
            )
              and u.id <> :usuarioId
            order by d.enviadoEm desc
            """)
    List<CampanhaDocumento> findNotificacoesDoUsuario(Long usuarioId);
}
