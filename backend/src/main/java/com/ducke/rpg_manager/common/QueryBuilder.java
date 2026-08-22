package com.ducke.rpg_manager.common;

import lombok.Getter;
import org.springframework.data.domain.Pageable;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Getter
public class QueryBuilder {

    private final StringBuilder sb = new StringBuilder();
    private final Map<String, Object> params = new HashMap<>();

    public String getQuery() {
        return sb.toString();
    }

    public QueryBuilder add(String clause) {
        sb.append(" ").append(clause).append(" ");
        return this;
    }

    public QueryBuilder add(QueryBuilder queryBuilder) {
        String clause = queryBuilder.getQuery();
        if (!clause.isBlank()) {
            sb.append(" ").append(clause).append(" ");
            params.putAll(queryBuilder.getParams());
        }

        return this;
    }

    public QueryBuilder addStringUpperNotBlank(String field, String value, QueryBuilderOperator operator, String paramName) {
        if (value != null && !value.isBlank()) {
            sb.append("AND UPPER(").append(field).append(") ")
                    .append(operator.getDescricao())
                    .append(" UPPER(:").append(paramName).append(") ");

            if (operator == QueryBuilderOperator.LIKE) value    = "%" + value  + "%";
            params.put(paramName, value);
        }
        return this;
    }

    public QueryBuilder addStringNotBlank(String field, String value, QueryBuilderOperator operator, String paramName) {
        if (value != null && !value.isBlank()) {
            sb.append("AND ").append(field).append(" ")
                    .append(operator.getDescricao())
                    .append(" :").append(paramName).append(" ");

            if (operator == QueryBuilderOperator.LIKE) value    = "%" + value  + "%";
            params.put(paramName, value);
        }
        return this;
    }

    public QueryBuilder addEnum(String field, Enum<?> value, String paramName) {
        if (value != null) {
            sb.append("AND ").append(field).append(" = ").append(" :").append(paramName).append(" ");
            params.put(paramName, value);
        }
        return this;
    }

    public QueryBuilder addObjectNotNull(String field, Object value, QueryBuilderOperator operator, String paramName) {
        if (value != null) {
            sb.append("AND ")
                    .append(field).append(" ")
                    .append(operator.getDescricao()).append(" :")
                    .append(paramName).append(" ");
            params.put(paramName, value);
        }
        return this;
    }

    public QueryBuilder sortBy(List<String> fields, boolean ascending) {
        sb.append("ORDER BY ")
                .append(String.join(", ", fields))
                .append(ascending ? " ASC " : " DESC ");
        return this;
    }
}
