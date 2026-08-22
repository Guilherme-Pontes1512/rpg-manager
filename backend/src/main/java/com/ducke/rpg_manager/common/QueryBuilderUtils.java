package com.ducke.rpg_manager.common;

import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class QueryBuilderUtils {

    private final EntityManager entityManager;

    public <T> TypedQuery<T> createQuery(QueryBuilder queryBuilder, Class<T> resultClass, Pageable pageable) {
        TypedQuery<T> query = entityManager.createQuery(queryBuilder.getQuery(), resultClass);
        queryBuilder.getParams().forEach(query::setParameter);

        if (pageable != null) {
            query.setFirstResult((int) pageable.getOffset());
            query.setMaxResults(pageable.getPageSize());
        }

        return query;
    }
}
