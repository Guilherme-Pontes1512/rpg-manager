package com.ducke.rpg_manager;

import com.ducke.rpg_manager.campanha.entidade.Campanha;
import com.ducke.rpg_manager.campanha.enumx.CampanhaPapelEnum;
import com.ducke.rpg_manager.campanha.repository.CampanhaRepository;
import com.ducke.rpg_manager.campanha_membros.entidade.CampanhaMembro;
import com.ducke.rpg_manager.campanha_membros.repository.CampanhaMembrosRepository;
import com.ducke.rpg_manager.campanha_npcs.entidade.CampanhaNpc;
import com.ducke.rpg_manager.campanha_npcs.repository.CampanhaNpcRepository;
import com.ducke.rpg_manager.common.SistemaEnum;
import com.ducke.rpg_manager.narrativa.repository.EventoRepository;
import com.ducke.rpg_manager.narrativa.repository.NotaSessaoRepository;
import com.ducke.rpg_manager.narrativa.repository.SessaoEventoRepository;
import com.ducke.rpg_manager.narrativa.repository.SessaoRepository;
import com.ducke.rpg_manager.personagens.coc.repository.PersonagemCocRepository;
import com.ducke.rpg_manager.personagens.entidade.Personagem;
import com.ducke.rpg_manager.personagens.enumx.PersonagemStatusEnum;
import com.ducke.rpg_manager.usuario.entidade.Usuario;
import com.ducke.rpg_manager.usuario.enumx.AuthProviderEnum;
import com.ducke.rpg_manager.usuario.repository.UsuarioRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {"app.email.enabled=false", "spring.profiles.active=dev,h2"})
@AutoConfigureMockMvc
@Transactional
class NarrativaIntegrationTests {
    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private UsuarioRepository usuarios;
    @Autowired private CampanhaRepository campanhas;
    @Autowired private CampanhaMembrosRepository membros;
    @Autowired private PersonagemCocRepository personagens;
    @Autowired private CampanhaNpcRepository npcs;
    @Autowired private SessaoRepository sessoes;
    @Autowired private EventoRepository eventos;
    @Autowired private SessaoEventoRepository associacoes;
    @Autowired private NotaSessaoRepository notas;
    @Autowired private PlatformTransactionManager transactionManager;

    private Usuario mestre;
    private Usuario jogador;
    private Campanha campanha;
    private Campanha outraCampanha;
    private Personagem personagem;
    private Personagem personagemExterno;
    private CampanhaNpc npc;
    private CampanhaNpc npcExterno;
    private String base;

    @BeforeEach
    void prepararCampanhasFicticias() {
        mestre = usuario("narrativa-mestre");
        jogador = usuario("narrativa-jogador");
        campanha = campanhas.save(new Campanha(null, "Arquivo de Arkham", "Dados ficticios", SistemaEnum.COC, null));
        outraCampanha = campanhas.save(new Campanha(null, "Outro arquivo", "Dados ficticios", SistemaEnum.COC, null));
        membros.save(new CampanhaMembro(null, campanha, mestre, CampanhaPapelEnum.MESTRE));
        membros.save(new CampanhaMembro(null, outraCampanha, mestre, CampanhaPapelEnum.MESTRE));
        CampanhaMembro membro = membros.save(new CampanhaMembro(null, campanha, jogador, CampanhaPapelEnum.JOGADOR));
        CampanhaMembro externo = membros.save(new CampanhaMembro(null, outraCampanha, jogador, CampanhaPapelEnum.JOGADOR));
        personagem = personagens.save(new Personagem(null, membro, "Alice", null, null, null, PersonagemStatusEnum.ATIVO, "{}"));
        personagemExterno = personagens.save(new Personagem(null, externo, "Outro investigador", null, null, null, PersonagemStatusEnum.ATIVO, "{}"));
        npc = npcs.save(new CampanhaNpc(null, campanha, "Bibliotecaria", null, "{}"));
        npcExterno = npcs.save(new CampanhaNpc(null, outraCampanha, "Outro contato", null, "{}"));
        base = "/api/campanhas/" + campanha.getId() + "/narrativa";
    }

    @Test
    void deveCriarEditarPesquisarEExcluirSessoesComNumeroOpcional() throws Exception {
        JsonNode primeira = criar("/sessoes", Map.of("titulo", "A chegada"));
        assertTrue(primeira.path("numero").isNull() || primeira.path("numero").isMissingNode());
        assertEquals("PLANEJADA", primeira.path("status").asText());
        assertNotNull(primeira.get("criadoEm"));
        JsonNode segunda = criar("/sessoes", Map.of("titulo", "O arquivo"));
        assertTrue(segunda.path("numero").isNull() || segunda.path("numero").isMissingNode());
        requisitar(put(base + "/sessoes/" + primeira.path("id").asLong()), Map.of(
                "numero", 7, "titulo", "Investigacao revisada", "descricao", "Encontrar pistas",
                "participantes", List.of(personagem.getId()), "npcs", List.of(npc.getId())))
                .andExpect(status().isOk()).andExpect(jsonPath("$.numero").value(7))
                .andExpect(jsonPath("$.participantes[0]").value(personagem.getId()));
        requisitar(get(base + "/sessoes").param("busca", "Investigacao"), null)
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1));
        requisitar(get(base + "/sessoes").param("busca", "7").param("status", "PLANEJADA"), null)
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].numero").value(7));
        requisitar(delete(base + "/sessoes/" + segunda.path("id").asLong()), null).andExpect(status().isNoContent());
        requisitar(get(base + "/sessoes/" + segunda.path("id").asLong()), null).andExpect(status().isNotFound());
    }

    @Test
    void deveImpedirNumeroDuplicadoEPermitirMesmoNumeroEmOutraCampanha() throws Exception {
        criar("/sessoes", Map.of("numero", 12));
        requisitar(post(base + "/sessoes"), Map.of("numero", 12)).andExpect(status().isConflict());
        requisitar(post(outraBase() + "/sessoes"), Map.of("numero", 12)).andExpect(status().isCreated());
        requisitar(post(base + "/sessoes"), Map.of("numero", 0)).andExpect(status().isBadRequest());
    }

    @Test
    void deveCriarMultiplasSessoesVaziasSemGerarNumeroOuExigirParticipantes() throws Exception {
        JsonNode primeira = criar("/sessoes", Map.of());
        JsonNode segunda = criar("/sessoes", Map.of());
        assertFalse(primeira.path("id").equals(segunda.path("id")));
        for (JsonNode sessao : List.of(primeira, segunda)) {
            assertTrue(sessao.path("numero").isNull() || sessao.path("numero").isMissingNode());
            assertTrue(sessao.path("titulo").isNull() || sessao.path("titulo").isMissingNode());
            assertEquals(0, sessao.path("participantes").size());
            assertEquals(0, sessao.path("npcs").size());
            assertEquals("PLANEJADA", sessao.path("status").asText());
            for (String campo : List.of("dataReal", "dataNarrativa", "inicio", "fim")) assertFalse(sessao.has(campo));
        }
        requisitar(put(base + "/sessoes/" + primeira.path("id").asLong()), Map.of("numero", 5))
                .andExpect(status().isOk()).andExpect(jsonPath("$.numero").value(5));
        requisitar(put(base + "/sessoes/" + segunda.path("id").asLong()), Map.of("numero", 5))
                .andExpect(status().isConflict());
    }

    @Test
    void devePermitirSomenteNumeroOuSomenteTituloEComplementarDepois() throws Exception {
        JsonNode numerada = criar("/sessoes", Map.of("numero", 3));
        JsonNode nomeada = criar("/sessoes", Map.of("titulo", "A chegada"));
        assertEquals(3, numerada.path("numero").asInt());
        assertTrue(numerada.path("titulo").isNull() || numerada.path("titulo").isMissingNode());
        assertTrue(nomeada.path("numero").isNull() || nomeada.path("numero").isMissingNode());
        requisitar(put(base + "/sessoes/" + numerada.path("id").asLong()), Map.of(
                "numero", 3, "titulo", "Arquivo complementado", "descricao", "Objetivo registrado depois", "resumo", "Resumo posterior"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.descricao").value("Objetivo registrado depois"))
                .andExpect(jsonPath("$.resumo").value("Resumo posterior"));
        requisitar(put(base + "/sessoes/" + numerada.path("id").asLong()), Map.of())
                .andExpect(status().isOk()).andExpect(jsonPath("$.numero").isEmpty());
        requisitar(put(base + "/sessoes/" + nomeada.path("id").asLong()), Map.of("numero", 3))
                .andExpect(status().isOk()).andExpect(jsonPath("$.numero").value(3));
    }

    @Test
    void deveIniciarEEncerrarSessaoVaziaEPreservarDiarioSemExigirDatas() throws Exception {
        long sessaoId = criar("/sessoes", Map.of()).path("id").asLong();
        requisitar(post(base + "/sessoes/" + sessaoId + "/iniciar"), null)
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("EM_ANDAMENTO"));
        criar("/sessoes/" + sessaoId + "/notas", Map.of("conteudo", "Registro sem planejamento previo"));
        requisitar(post(base + "/sessoes/" + sessaoId + "/encerrar"), Map.of())
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("CONCLUIDA"))
                .andExpect(jsonPath("$.inicio").doesNotExist()).andExpect(jsonPath("$.fim").doesNotExist());
        requisitar(put(base + "/sessoes/" + sessaoId), Map.of("resumo", "Complemento posterior"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.quantidadeNotas").value(1));
        requisitar(get(base + "/sessoes/" + sessaoId + "/notas"), null)
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].conteudo").value("Registro sem planejamento previo"));
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void deveCarregarPessoasDaCampanhaECriarSessaoVaziaSemTransacaoExterna() throws Exception {
        try {
            requisitar(get("/api/campanhas/" + campanha.getId() + "/acompanhamento"), null)
                    .andExpect(status().isOk()).andExpect(jsonPath("$.personagens.length()").value(1))
                    .andExpect(jsonPath("$.personagens[0].id").value(personagem.getId()))
                    .andExpect(jsonPath("$.npcs.length()").value(1)).andExpect(jsonPath("$.npcs[0].id").value(npc.getId()));
            JsonNode criada = criar("/sessoes", Map.of());
            requisitar(get(base + "/sessoes/" + criada.path("id").asLong()), null)
                    .andExpect(status().isOk()).andExpect(jsonPath("$.numero").isEmpty())
                    .andExpect(jsonPath("$.participantes.length()").value(0)).andExpect(jsonPath("$.npcs.length()").value(0));
            requisitar(get(outraBase() + "/sessoes"), null).andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(0));
        } finally {
            limparFixturesPersistidas();
        }
    }

    @Test
    void deveControlarInicioEncerramentoCancelamentoEEdicaoPosterior() throws Exception {
        long primeira = sessao("Primeira");
        long segunda = sessao("Segunda");
        requisitar(post(base + "/sessoes/" + primeira + "/iniciar"), null)
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("EM_ANDAMENTO"))
                .andExpect(jsonPath("$.inicio").doesNotExist()).andExpect(jsonPath("$.dataReal").doesNotExist())
                .andExpect(jsonPath("$.dataNarrativa").doesNotExist());
        requisitar(post(base + "/sessoes/" + segunda + "/iniciar"), null).andExpect(status().isConflict());
        requisitar(post(base + "/sessoes/" + primeira + "/encerrar"), Map.of())
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("CONCLUIDA"))
                .andExpect(jsonPath("$.fim").doesNotExist());
        requisitar(put(base + "/sessoes/" + primeira), Map.of("titulo", "Registro corrigido", "resumo", "Revisao posterior"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.resumo").value("Revisao posterior"))
                .andExpect(jsonPath("$.status").value("CONCLUIDA"));
        requisitar(post(base + "/sessoes/" + primeira + "/iniciar"), null).andExpect(status().isConflict());
        requisitar(post(base + "/sessoes/" + segunda + "/cancelar"), null)
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("CANCELADA"));
        requisitar(post(base + "/sessoes/" + segunda + "/iniciar"), null).andExpect(status().isConflict());
    }

    @Test
    void deveGerenciarBancoDeEventosERealizacaoForaDeCena() throws Exception {
        JsonNode evento = criar("/eventos", Map.of("titulo", "Reuniao secreta"));
        long eventoId = evento.path("id").asLong();
        assertEquals("PENDENTE", evento.path("status").asText());
        requisitar(put(base + "/eventos/" + eventoId), Map.of("titulo", "Ritual secreto", "tipo", "INDEPENDENTE",
                "status", "REALIZADO", "local", "Farol", "dataNarrativa", "Meia-noite",
                "npcs", List.of(npc.getId())))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("REALIZADO"));
        requisitar(get(base + "/eventos").param("busca", "Ritual").param("tipo", "INDEPENDENTE")
                .param("status", "REALIZADO").param("npcId", npc.getId().toString()).param("semSessao", "true"), null)
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1));
        long descartavel = evento("Ideia temporaria");
        requisitar(delete(base + "/eventos/" + descartavel), null).andExpect(status().isNoContent());
        requisitar(get(base + "/eventos/" + descartavel), null).andExpect(status().isNotFound());
        requisitar(post(base + "/eventos"), Map.of("titulo", " ")).andExpect(status().isBadRequest());
    }

    @Test
    void deveAssociarReordenarECriarEventoDiretamenteNaSessao() throws Exception {
        long sessaoId = sessao("Planejamento");
        long eventoId = evento("Encontro");
        JsonNode primeiro = associar(sessaoId, eventoId);
        JsonNode segundo = criar("/sessoes/" + sessaoId + "/eventos/novo", Map.of("titulo", "Improviso"));
        requisitar(put(base + "/sessoes/" + sessaoId + "/eventos/ordem"),
                Map.of("ids", List.of(segundo.path("id").asLong(), primeiro.path("id").asLong())))
                .andExpect(status().isNoContent());
        requisitar(get(base + "/sessoes/" + sessaoId + "/eventos"), null)
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].evento.titulo").value("Improviso"));
        requisitar(post(base + "/sessoes/" + sessaoId + "/eventos"), Map.of("eventoId", eventoId))
                .andExpect(status().isConflict());
        long outraSessao = sessao("Futuro");
        requisitar(post(base + "/sessoes/" + outraSessao + "/eventos"), Map.of("eventoId", eventoId))
                .andExpect(status().isConflict());
        requisitar(delete(base + "/sessoes/" + sessaoId + "/eventos/" + segundo.path("id").asLong()), null)
                .andExpect(status().isNoContent());
        requisitar(get(base + "/eventos/" + segundo.path("evento").path("id").asLong()), null)
                .andExpect(status().isOk());
    }

    @Test
    void devePreservarHistoricoAoTransferirAdiarERetornarAoBanco() throws Exception {
        long origem = sessao("Origem");
        long destino = sessao("Destino");
        long eventoId = evento("Encontro adiado");
        long associacao = associar(origem, eventoId).path("id").asLong();
        requisitar(post(base + "/sessoes/" + origem + "/eventos/" + associacao + "/transferir"),
                Map.of("sessaoDestinoId", destino)).andExpect(status().isOk());
        requisitar(get(base + "/sessoes/" + origem + "/eventos"), null)
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].status").value("ADIADO"));
        JsonNode novo = ler(requisitar(get(base + "/sessoes/" + destino + "/eventos"), null).andExpect(status().isOk())).get(0);
        requisitar(post(base + "/sessoes/" + destino + "/eventos/" + novo.path("id").asLong() + "/banco"), null)
                .andExpect(status().isNoContent());
        requisitar(get(base + "/eventos/" + eventoId), null).andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDENTE")).andExpect(jsonPath("$.sessaoPlanejadaId").isEmpty());
        requisitar(get(base + "/sessoes/" + destino + "/eventos"), null)
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].status").value("ADIADO"));
    }

    @Test
    void deveRegistrarResultadoEProtegerHistoricoRealizado() throws Exception {
        long sessaoId = sessao("Descoberta");
        long eventoId = evento("Documento");
        long associacaoId = associar(sessaoId, eventoId).path("id").asLong();
        requisitar(put(base + "/sessoes/" + sessaoId + "/eventos/" + associacaoId), Map.of(
                "status", "REALIZADO", "resultado", "Documento queimado", "consequencias", "Suspeita crescente",
                "evidencias", "Assinatura legivel"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.evento.status").value("REALIZADO"))
                .andExpect(jsonPath("$.realizadoEm").isNotEmpty()).andExpect(jsonPath("$.resultado").value("Documento queimado"));
        requisitar(get(base + "/sessoes/" + sessaoId), null).andExpect(status().isOk())
                .andExpect(jsonPath("$.eventosRealizados").value(1));
        requisitar(delete(base + "/eventos/" + eventoId), null).andExpect(status().isConflict());
        requisitar(delete(base + "/sessoes/" + sessaoId), null).andExpect(status().isConflict());
        requisitar(delete(base + "/sessoes/" + sessaoId + "/eventos/" + associacaoId), null).andExpect(status().isConflict());
    }

    @Test
    void deveDescartarSomentePlanejamentoSemDescartarEventoOriginal() throws Exception {
        long sessaoId = sessao("Descarte parcial");
        long eventoId = evento("Possibilidade");
        long associacaoId = associar(sessaoId, eventoId).path("id").asLong();
        requisitar(put(base + "/sessoes/" + sessaoId + "/eventos/" + associacaoId), Map.of("status", "DESCARTADO"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.evento.status").value("PENDENTE"));
        associar(sessao("Nova tentativa"), eventoId);
    }

    @Test
    void devePreservarEventoOriginalAoExcluirSessaoPlanejada() throws Exception {
        long sessaoId = sessao("Rascunho");
        long eventoId = evento("Ideia preservada");
        associar(sessaoId, eventoId);
        criar("/sessoes/" + sessaoId + "/notas", Map.of("conteudo", "Rascunho de planejamento"));
        requisitar(delete(base + "/sessoes/" + sessaoId), null).andExpect(status().isNoContent());
        requisitar(get(base + "/eventos/" + eventoId), null).andExpect(status().isOk())
                .andExpect(jsonPath("$.sessaoPlanejadaId").isEmpty());
    }

    @Test
    void deveGerenciarDiarioCronologicoComPesquisaERelacionamentos() throws Exception {
        long sessaoId = sessao("Diario");
        long eventoId = evento("Pista");
        JsonNode primeira = criar("/sessoes/" + sessaoId + "/notas", Map.of("conteudo", "Chegaram ao farol"));
        assertEquals("OBSERVACAO_GERAL", primeira.path("categoria").asText());
        JsonNode segunda = criar("/sessoes/" + sessaoId + "/notas", Map.of("conteudo", "Assinatura descoberta",
                "categoria", "EVIDENCIA_DESCOBERTA", "eventoId", eventoId,
                "participantes", List.of(personagem.getId()), "npcs", List.of(npc.getId())));
        JsonNode diario = ler(requisitar(get(base + "/sessoes/" + sessaoId + "/notas"), null).andExpect(status().isOk()));
        assertEquals(primeira.path("id").asLong(), diario.get(0).path("id").asLong());
        requisitar(get(base + "/sessoes/" + sessaoId + "/notas").param("pesquisa", "Assinatura")
                .param("categoria", "EVIDENCIA_DESCOBERTA"), null)
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1));
        requisitar(put(base + "/sessoes/" + sessaoId + "/notas/" + segunda.path("id").asLong()),
                Map.of("conteudo", "Assinatura confirmada", "categoria", "INFORMACAO_REVELADA"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.conteudo").value("Assinatura confirmada"));
        requisitar(delete(base + "/sessoes/" + sessaoId + "/notas/" + primeira.path("id").asLong()), null)
                .andExpect(status().isNoContent());
        requisitar(post(base + "/sessoes/" + sessaoId + "/notas"), Map.of("conteudo", " "))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deveExigirDecisaoExplicitaParaPendenciasNoEncerramento() throws Exception {
        long sessaoId = sessao("Revisao");
        long eventoId = evento("Pendente");
        associar(sessaoId, eventoId);
        requisitar(post(base + "/sessoes/" + sessaoId + "/iniciar"), null).andExpect(status().isOk());
        requisitar(post(base + "/sessoes/" + sessaoId + "/encerrar"), Map.of()).andExpect(status().isBadRequest());
        requisitar(get(base + "/sessoes/" + sessaoId), null).andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("EM_ANDAMENTO")).andExpect(jsonPath("$.fim").doesNotExist());
        requisitar(post(base + "/sessoes/" + sessaoId + "/encerrar"), Map.of("retornarTodosAoBanco", true))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("CONCLUIDA"));
        requisitar(get(base + "/eventos/" + eventoId), null).andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDENTE")).andExpect(jsonPath("$.sessaoPlanejadaId").isEmpty());
    }

    @Test
    void deveAplicarDecisoesIndividuaisNoEncerramento() throws Exception {
        long sessaoId = sessao("Revisao detalhada");
        long destino = sessao("Proxima");
        long transferido = evento("Transferir");
        long foraDeCena = evento("Fora de cena");
        long descartado = evento("Descarte definitivo");
        long parcial = evento("Descarte parcial");
        long nova = evento("Novo planejamento");
        List<Map<String, Object>> decisoes = List.of(
                Map.of("associacaoId", associar(sessaoId, transferido).path("id").asLong(), "destino", "TRANSFERIR", "sessaoDestinoId", destino),
                Map.of("associacaoId", associar(sessaoId, foraDeCena).path("id").asLong(), "destino", "REALIZADO_FORA_CENA"),
                Map.of("associacaoId", associar(sessaoId, descartado).path("id").asLong(), "destino", "DESCARTAR_CAMPANHA"),
                Map.of("associacaoId", associar(sessaoId, parcial).path("id").asLong(), "destino", "DESCARTAR_SESSAO"),
                Map.of("associacaoId", associar(sessaoId, nova).path("id").asLong(), "destino", "NOVA_SESSAO", "novaSessao", Map.of("titulo", "Futuro distante")));
        requisitar(post(base + "/sessoes/" + sessaoId + "/iniciar"), null).andExpect(status().isOk());
        requisitar(post(base + "/sessoes/" + sessaoId + "/encerrar"), Map.of("decisoes", decisoes, "resumo", "Revisao registrada"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.resumo").value("Revisao registrada"));
        requisitar(get(base + "/eventos/" + transferido), null).andExpect(status().isOk()).andExpect(jsonPath("$.sessaoPlanejadaId").value(destino));
        requisitar(get(base + "/eventos/" + foraDeCena), null).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("REALIZADO"));
        requisitar(get(base + "/eventos/" + descartado), null).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("DESCARTADO"));
        requisitar(get(base + "/eventos/" + parcial), null).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("PENDENTE"));
        requisitar(get(base + "/eventos/" + nova), null).andExpect(status().isOk()).andExpect(jsonPath("$.sessaoPlanejadaId").isNumber());
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void deveReverterTodasAsDecisoesQuandoEncerramentoFalharParcialmente() throws Exception {
        try {
            long sessaoId = sessao("Revisao atomica");
            long primeiroEvento = evento("Retorno que deve ser revertido");
            long segundoEvento = evento("Transferencia invalida");
            long primeiroRegistro = associar(sessaoId, primeiroEvento).path("id").asLong();
            long segundoRegistro = associar(sessaoId, segundoEvento).path("id").asLong();
            requisitar(post(base + "/sessoes/" + sessaoId + "/iniciar"), null).andExpect(status().isOk());
            requisitar(post(base + "/sessoes/" + sessaoId + "/encerrar"), Map.of(
                    "resumo", "Resumo que nao deve persistir",
                    "decisoes", List.of(
                            Map.of("associacaoId", primeiroRegistro, "destino", "BANCO"),
                            Map.of("associacaoId", segundoRegistro, "destino", "TRANSFERIR", "sessaoDestinoId", Long.MAX_VALUE))))
                    .andExpect(status().isNotFound());
            requisitar(get(base + "/sessoes/" + sessaoId), null).andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("EM_ANDAMENTO"))
                    .andExpect(jsonPath("$.fim").doesNotExist()).andExpect(jsonPath("$.resumo").isEmpty());
            requisitar(get(base + "/sessoes/" + sessaoId + "/eventos"), null).andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(2))
                    .andExpect(jsonPath("$[0].status").value("PENDENTE"))
                    .andExpect(jsonPath("$[1].status").value("PENDENTE"));
            requisitar(get(base + "/eventos/" + primeiroEvento), null).andExpect(status().isOk())
                    .andExpect(jsonPath("$.sessaoPlanejadaId").value(sessaoId));
        } finally {
            limparFixturesPersistidas();
        }
    }

    private void limparFixturesPersistidas() {
        new TransactionTemplate(transactionManager).executeWithoutResult(transaction -> {
            notas.deleteAll(notas.findAllBySessaoCampanhaId(campanha.getId()));
            associacoes.deleteAll(associacoes.findAllByEventoCampanhaId(campanha.getId()));
            associacoes.flush();
            eventos.deleteAll(eventos.findAllByCampanhaIdOrderByCriadoEmDesc(campanha.getId()));
            sessoes.deleteAll(sessoes.findAllByCampanhaIdOrderByCriadoEmDescIdDesc(campanha.getId()));
            sessoes.flush();
            personagens.deleteAll(List.of(personagem, personagemExterno));
            npcs.deleteAll(List.of(npc, npcExterno));
            personagens.flush();
            membros.deleteAll(membros.findAll().stream().filter(membro ->
                    membro.getCampanha().getId().equals(campanha.getId())
                            || membro.getCampanha().getId().equals(outraCampanha.getId())).toList());
            membros.flush();
            campanhas.deleteAll(List.of(campanha, outraCampanha));
            campanhas.flush();
            usuarios.deleteAll(List.of(mestre, jogador));
        });
    }

    @Test
    void deveBloquearJogadorEUsuarioSemVinculoEmTodosOsRecursosPrivados() throws Exception {
        long sessaoId = sessao("Privada");
        long eventoId = evento("Segredo");
        long associacaoId = associar(sessaoId, eventoId).path("id").asLong();
        long notaId = criar("/sessoes/" + sessaoId + "/notas", Map.of("conteudo", "Anotacao privada")).path("id").asLong();
        Usuario externo = usuario("narrativa-externo");
        for (Usuario usuario : List.of(jogador, externo)) {
            for (String caminho : List.of("/sessoes", "/sessoes/" + sessaoId, "/eventos", "/eventos/" + eventoId,
                    "/sessoes/" + sessaoId + "/eventos", "/sessoes/" + sessaoId + "/notas")) {
                mockMvc.perform(get(base + caminho).with(httpBasic(usuario.getEmail(), "senha123")))
                        .andExpect(status().isForbidden());
            }
            for (MockHttpServletRequestBuilder request : List.of(post(base + "/sessoes/" + sessaoId + "/iniciar"),
                    delete(base + "/eventos/" + eventoId), delete(base + "/sessoes/" + sessaoId + "/eventos/" + associacaoId),
                    delete(base + "/sessoes/" + sessaoId + "/notas/" + notaId))) {
                mockMvc.perform(request.with(httpBasic(usuario.getEmail(), "senha123"))).andExpect(status().isForbidden());
            }
        }
        mockMvc.perform(get(base + "/sessoes")).andExpect(status().isUnauthorized());
    }

    @Test
    void deveImpedirRelacionamentosEntreCampanhas() throws Exception {
        long sessaoId = sessao("Isolada");
        long eventoExterno = ler(requisitar(post(outraBase() + "/eventos"), Map.of("titulo", "Evento externo"))
                .andExpect(status().isCreated())).path("id").asLong();
        requisitar(post(base + "/sessoes/" + sessaoId + "/eventos"), Map.of("eventoId", eventoExterno))
                .andExpect(status().isNotFound());
        requisitar(get(outraBase() + "/sessoes/" + sessaoId), null).andExpect(status().isNotFound());
        requisitar(post(base + "/sessoes"), Map.of("participantes", List.of(personagemExterno.getId())))
                .andExpect(status().isBadRequest());
        requisitar(post(base + "/eventos"), Map.of("titulo", "Invalido", "npcs", List.of(npcExterno.getId())))
                .andExpect(status().isBadRequest());
        requisitar(post(base + "/sessoes/" + sessaoId + "/notas"), Map.of("conteudo", "Invalida", "eventoId", eventoExterno))
                .andExpect(status().isNotFound());
        requisitar(post(base + "/sessoes/" + sessaoId + "/notas"), Map.of("conteudo", "Invalida", "participantes", List.of(personagemExterno.getId())))
                .andExpect(status().isBadRequest());
    }

    private Usuario usuario(String nome) {
        Usuario usuario = new Usuario();
        usuario.setNome(nome);
        usuario.setUsername(nome);
        usuario.setEmail(nome + "@example.com");
        usuario.setSenha(passwordEncoder.encode("senha123"));
        usuario.setAuthProvider(AuthProviderEnum.LOCAL);
        usuario.setEmailVerificado(true);
        usuario.setEmailVerificadoEm(Instant.now());
        return usuarios.save(usuario);
    }

    private ResultActions requisitar(MockHttpServletRequestBuilder request, Object payload) throws Exception {
        request.with(httpBasic(mestre.getEmail(), "senha123"));
        if (payload != null) request.contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(payload));
        return mockMvc.perform(request);
    }

    private JsonNode criar(String caminho, Object payload) throws Exception {
        return ler(requisitar(post(base + caminho), payload).andExpect(status().isCreated()));
    }

    private JsonNode ler(ResultActions resultado) throws Exception {
        return objectMapper.readTree(resultado.andReturn().getResponse().getContentAsString());
    }

    private long sessao(String titulo) throws Exception {
        return criar("/sessoes", Map.of("titulo", titulo)).path("id").asLong();
    }

    private long evento(String titulo) throws Exception {
        return criar("/eventos", Map.of("titulo", titulo)).path("id").asLong();
    }

    private JsonNode associar(long sessaoId, long eventoId) throws Exception {
        return criar("/sessoes/" + sessaoId + "/eventos", Map.of("eventoId", eventoId));
    }

    private String outraBase() {
        return "/api/campanhas/" + outraCampanha.getId() + "/narrativa";
    }
}
