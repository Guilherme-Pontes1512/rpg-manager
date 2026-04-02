package com.ducke.rpg_manager.campanha.repository;

import com.ducke.rpg_manager.campanha.dtos.CampanhaOutput;
import com.ducke.rpg_manager.campanha.dtos.CampanhaSearchInput;
import com.ducke.rpg_manager.common.QueryBuilder;
import com.ducke.rpg_manager.common.QueryBuilderUtils;
import jakarta.persistence.TypedQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;

import static com.ducke.rpg_manager.common.QueryBuilderOperator.EQUALS;
import static com.ducke.rpg_manager.common.QueryBuilderOperator.LIKE;

@Repository
@RequiredArgsConstructor
public class CampanhaCustomRepositoryImpl implements CampanhaCustomRepository {

    private final QueryBuilderUtils queryBuilderUtils;

    @Override
    public Page<CampanhaOutput> listarCampanhas(Pageable pageable, CampanhaSearchInput input, Long usuarioId) {
        QueryBuilder query = new QueryBuilder();

        query.add("SELECT new com.ducke.rpg_manager.campanha.dtos.CampanhaOutput(c.id, c.nome, c.descricao, c.sistema, cm.papel) ")
                .add("FROM CampanhaMembro cm ")
                .add("JOIN cm.campanha c ")
                .add(whereQuery(input, usuarioId))
                .sortBy(List.of("c.nome", "c.sistema", "cm.papel"), true);

        TypedQuery<CampanhaOutput> queryCreated = queryBuilderUtils.createQuery(query, CampanhaOutput.class, pageable);
        List<CampanhaOutput> campanhas = queryCreated.getResultList();
        long total = countCampanhas(input, usuarioId);

        return new PageImpl<>(campanhas, pageable, total);
    }

    private long countCampanhas(CampanhaSearchInput input, Long usuarioId) {
        QueryBuilder query = new QueryBuilder();

        query.add("SELECT COUNT(c.id) ")
                .add("FROM CampanhaMembro cm ")
                .add("JOIN cm.campanha c ")
                .add(whereQuery(input, usuarioId));

        TypedQuery<Long> queryCreated = queryBuilderUtils.createQuery(query, Long.class, null);

        return queryCreated.getSingleResult();
    }

    private QueryBuilder whereQuery(CampanhaSearchInput input, Long usuarioId) {
        QueryBuilder query = new QueryBuilder();
        query.add("WHERE 1 = 1 ")
                .addStringUpperNotBlank("c.nome", input.termo(), LIKE, "termo")
                .addEnum("c.sistema", input.sistema(), "sistema")
                .addEnum("cm.papel", input.papel(), "papel")
                .addObjectNotNull("cm.usuario.id", usuarioId, EQUALS, "usuarioId");
        return query;
    }
}
