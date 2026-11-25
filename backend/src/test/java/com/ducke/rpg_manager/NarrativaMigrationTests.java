package com.ducke.rpg_manager;

import liquibase.Contexts;
import liquibase.LabelExpression;
import liquibase.Liquibase;
import liquibase.database.DatabaseFactory;
import liquibase.database.jvm.JdbcConnection;
import liquibase.resource.ClassLoaderResourceAccessor;
import liquibase.resource.CompositeResourceAccessor;
import liquibase.resource.DirectoryResourceAccessor;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class NarrativaMigrationTests {
    @TempDir
    Path temporario;

    @Test
    void migracaoPreservaCampanhaFichasEPermiteCriarRegistrosNarrativos() throws Exception {
        String caminhoMaster = "db/changelog/db.changelog-master.yaml";
        String inclusaoNarrativa = "  - include:\n        file: db/changelog/changes/2026-2/011-create-narrativa.yaml";
        String master;
        try (var entrada = getClass().getClassLoader().getResourceAsStream(caminhoMaster)) {
            assertNotNull(entrada);
            master = new String(entrada.readAllBytes(), StandardCharsets.UTF_8);
        }
        assertTrue(master.contains(inclusaoNarrativa));
        String baseline = master.replace(inclusaoNarrativa, "").replaceAll("  - include:\\R        file: db/changelog/changes/2026-2/012-[^\\r\\n]+", "");
        assertFalse(baseline.contains("011-create-narrativa"));
        Files.writeString(temporario.resolve("baseline.yaml"), baseline);

        try (var conexao = DriverManager.getConnection("jdbc:h2:mem:narrativa-upgrade-" + UUID.randomUUID());
             var recursos = new CompositeResourceAccessor(new DirectoryResourceAccessor(temporario), new ClassLoaderResourceAccessor());
             Statement comando = conexao.createStatement()) {
            var banco = DatabaseFactory.getInstance().findCorrectDatabaseImplementation(new JdbcConnection(conexao));
            new Liquibase("baseline.yaml", recursos, banco).update(new Contexts(), new LabelExpression());
            comando.executeUpdate("INSERT INTO campanhas (id, nome, descricao, sistema) VALUES (101, 'Campanha ficticia', 'Objetivo preservado', 'COC')");
            comando.executeUpdate("INSERT INTO usuarios (id, nome, username, email, senha, auth_provider) VALUES (101, 'Mestre ficticio', 'mestre-migracao', 'migracao@example.test', 'hash-ficticio', 'LOCAL')");
            comando.executeUpdate("INSERT INTO campanha_membros (id, campanha_id, usuario_id, papel) VALUES (101, 101, 101, 'MESTRE')");
            comando.executeUpdate("INSERT INTO personagens (id, campanha_membro_id, nome, historia, dados_ficha_json) VALUES (101, 101, 'Investigadora ficticia', 'Historia preservada', '{\"vida\":7,\"sanidade\":55}')");
            comando.executeUpdate("INSERT INTO campanha_npcs (id, campanha_id, nome, dados_ficha_json) VALUES (101, 101, 'Bibliotecaria ficticia', '{\"vida\":5}')");

            new Liquibase(caminhoMaster, recursos, banco).update(new Contexts(), new LabelExpression());

            try (ResultSet resultado = comando.executeQuery("SELECT c.nome, c.descricao, u.email, m.papel, p.historia, p.dados_ficha_json, n.dados_ficha_json FROM campanhas c JOIN campanha_membros m ON m.campanha_id = c.id JOIN usuarios u ON u.id = m.usuario_id JOIN personagens p ON p.campanha_membro_id = m.id JOIN campanha_npcs n ON n.campanha_id = c.id WHERE c.id = 101")) {
                assertTrue(resultado.next());
                assertEquals("Campanha ficticia", resultado.getString(1));
                assertEquals("Objetivo preservado", resultado.getString(2));
                assertEquals("migracao@example.test", resultado.getString(3));
                assertEquals("MESTRE", resultado.getString(4));
                assertEquals("Historia preservada", resultado.getString(5));
                assertEquals("{\"vida\":7,\"sanidade\":55}", resultado.getString(6));
                assertEquals("{\"vida\":5}", resultado.getString(7));
                assertFalse(resultado.next());
            }

            comando.executeUpdate("INSERT INTO sessoes (id, campanha_id, numero, status, criado_em, atualizado_em) VALUES (101, 101, 1, 'PLANEJADA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)");
            comando.executeUpdate("INSERT INTO sessoes (id, campanha_id, status, criado_em, atualizado_em) VALUES (102, 101, 'PLANEJADA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)");
            comando.executeUpdate("INSERT INTO sessoes (id, campanha_id, status, criado_em, atualizado_em) VALUES (103, 101, 'PLANEJADA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)");
            comando.executeUpdate("INSERT INTO eventos (id, campanha_id, titulo, descricao, status, criado_em, atualizado_em) VALUES (101, 101, 'Descoberta ficticia', 'Registro narrativo preservavel', 'PENDENTE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)");
            comando.executeUpdate("INSERT INTO sessao_eventos (id, sessao_id, evento_id, ordem, status) VALUES (101, 101, 101, 0, 'PENDENTE')");
            comando.executeUpdate("INSERT INTO notas_sessao (id, sessao_id, evento_id, conteudo, categoria, criado_em, atualizado_em) VALUES (101, 101, 101, 'Diario ficticio', 'OBSERVACAO_GERAL', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)");
            comando.executeUpdate("INSERT INTO sessao_personagens (sessao_id, personagem_id) VALUES (101, 101)");
            comando.executeUpdate("INSERT INTO evento_npcs (evento_id, npc_id) VALUES (101, 101)");
            comando.executeUpdate("INSERT INTO nota_sessao_personagens (nota_id, personagem_id) VALUES (101, 101)");
            assertThrows(SQLException.class, () -> comando.executeUpdate("INSERT INTO sessoes (campanha_id, numero, status, criado_em, atualizado_em) VALUES (101, 1, 'PLANEJADA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"));
            assertThrows(SQLException.class, () -> comando.executeUpdate("INSERT INTO sessao_eventos (sessao_id, evento_id, ordem, status) VALUES (101, 101, 1, 'PENDENTE')"));
            assertThrows(SQLException.class, () -> comando.executeUpdate("DELETE FROM eventos WHERE id = 101"));
            try (ResultSet resultado = comando.executeQuery("SELECT conteudo FROM notas_sessao WHERE id = 101")) {
                assertTrue(resultado.next());
                assertEquals("Diario ficticio", resultado.getString(1));
            }
        }
    }

    @Test
    void migracaoDeSessoesFlexiveisPreservaRegistrosNarrativosEPermiteNumeroNulo() throws Exception {
        String caminhoMaster = "db/changelog/db.changelog-master.yaml";
        String master;
        try (var entrada = getClass().getClassLoader().getResourceAsStream(caminhoMaster)) {
            assertNotNull(entrada);
            master = new String(entrada.readAllBytes(), StandardCharsets.UTF_8);
        }
        String baseline = master.replaceAll("  - include:\\R        file: db/changelog/changes/2026-2/012-[^\\r\\n]+", "");
        assertFalse(master.equals(baseline), "A migracao 012 deve estar incluida no master");
        Files.writeString(temporario.resolve("narrativa-011.yaml"), baseline);

        try (var conexao = DriverManager.getConnection("jdbc:h2:mem:narrativa-flexivel-" + UUID.randomUUID());
             var recursos = new CompositeResourceAccessor(new DirectoryResourceAccessor(temporario), new ClassLoaderResourceAccessor());
             Statement comando = conexao.createStatement()) {
            var banco = DatabaseFactory.getInstance().findCorrectDatabaseImplementation(new JdbcConnection(conexao));
            new Liquibase("narrativa-011.yaml", recursos, banco).update(new Contexts(), new LabelExpression());
            comando.executeUpdate("INSERT INTO campanhas (id, nome, sistema) VALUES (201, 'Campanha existente', 'COC')");
            comando.executeUpdate("INSERT INTO usuarios (id, nome, username, email, senha, auth_provider) VALUES (201, 'Mestre', 'mestre-flexivel', 'flexivel@example.test', 'hash-ficticio', 'LOCAL')");
            comando.executeUpdate("INSERT INTO campanha_membros (id, campanha_id, usuario_id, papel) VALUES (201, 201, 201, 'MESTRE')");
            comando.executeUpdate("INSERT INTO personagens (id, campanha_membro_id, nome, dados_ficha_json) VALUES (201, 201, 'Investigadora', '{\"vidaAtual\":7,\"sanidade\":55}')");
            comando.executeUpdate("INSERT INTO sessoes (id, campanha_id, numero, titulo, descricao, resumo, data_real, data_narrativa, inicio, fim, status, criado_em, atualizado_em) VALUES (201, 201, 9, 'Arquivo antigo', 'Objetivo preservado', 'Resumo preservado', DATE '2026-11-24', 'Lua ficticia', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'CONCLUIDA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)");
            comando.executeUpdate("INSERT INTO eventos (id, campanha_id, titulo, data_narrativa, status, criado_em, atualizado_em) VALUES (201, 201, 'Descoberta existente', 'Meia-noite', 'REALIZADO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)");
            comando.executeUpdate("INSERT INTO sessao_eventos (id, sessao_id, evento_id, ordem, status, resultado, evidencias, realizado_em) VALUES (201, 201, 201, 0, 'REALIZADO', 'Documento encontrado', 'Carta revelada', CURRENT_TIMESTAMP)");
            comando.executeUpdate("INSERT INTO notas_sessao (id, sessao_id, evento_id, conteudo, categoria, criado_em, atualizado_em) VALUES (201, 201, 201, 'Diario preservado', 'INFORMACAO_REVELADA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)");
            comando.executeUpdate("INSERT INTO sessao_personagens (sessao_id, personagem_id) VALUES (201, 201)");

            new Liquibase(caminhoMaster, recursos, banco).update(new Contexts(), new LabelExpression());

            try (ResultSet resultado = comando.executeQuery("SELECT s.numero, s.titulo, s.descricao, s.resumo, s.status, e.data_narrativa, se.resultado, se.evidencias, se.realizado_em, n.conteudo, p.dados_ficha_json FROM sessoes s JOIN sessao_eventos se ON se.sessao_id = s.id JOIN eventos e ON e.id = se.evento_id JOIN notas_sessao n ON n.sessao_id = s.id JOIN sessao_personagens sp ON sp.sessao_id = s.id JOIN personagens p ON p.id = sp.personagem_id WHERE s.id = 201")) {
                assertTrue(resultado.next());
                assertEquals(9, resultado.getInt(1));
                assertEquals("Arquivo antigo", resultado.getString(2));
                assertEquals("Objetivo preservado", resultado.getString(3));
                assertEquals("Resumo preservado", resultado.getString(4));
                assertEquals("CONCLUIDA", resultado.getString(5));
                assertEquals("Meia-noite", resultado.getString(6));
                assertEquals("Documento encontrado", resultado.getString(7));
                assertEquals("Carta revelada", resultado.getString(8));
                assertNotNull(resultado.getTimestamp(9));
                assertEquals("Diario preservado", resultado.getString(10));
                assertEquals("{\"vidaAtual\":7,\"sanidade\":55}", resultado.getString(11));
                assertFalse(resultado.next());
            }
            comando.executeUpdate("INSERT INTO sessoes (id, campanha_id, status, criado_em, atualizado_em) VALUES (202, 201, 'PLANEJADA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)");
            comando.executeUpdate("INSERT INTO sessoes (id, campanha_id, status, criado_em, atualizado_em) VALUES (203, 201, 'PLANEJADA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)");
            assertThrows(SQLException.class, () -> comando.executeUpdate("INSERT INTO sessoes (id, campanha_id, numero, status, criado_em, atualizado_em) VALUES (204, 201, 9, 'PLANEJADA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"));
            try (ResultSet resultado = conexao.getMetaData().getColumns(null, null, "SESSOES", null)) {
                while (resultado.next()) assertFalse(java.util.Set.of("DATA_REAL", "DATA_NARRATIVA", "INICIO", "FIM").contains(resultado.getString("COLUMN_NAME")));
            }
        }
    }
}
