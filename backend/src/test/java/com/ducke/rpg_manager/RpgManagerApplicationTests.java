package com.ducke.rpg_manager;

import com.ducke.rpg_manager.campanha.entidade.Campanha;
import com.ducke.rpg_manager.campanha.enumx.CampanhaPapelEnum;
import com.ducke.rpg_manager.campanha.repository.CampanhaRepository;
import com.ducke.rpg_manager.campanha_membros.entidade.CampanhaMembro;
import com.ducke.rpg_manager.campanha_membros.repository.CampanhaMembrosRepository;
import com.ducke.rpg_manager.common.SistemaEnum;
import com.ducke.rpg_manager.personagens.coc.repository.PersonagemCocRepository;
import com.ducke.rpg_manager.usuario.entidade.Usuario;
import com.ducke.rpg_manager.usuario.enumx.AuthProviderEnum;
import com.ducke.rpg_manager.usuario.repository.UsuarioEmailVerificacaoRepository;
import com.ducke.rpg_manager.usuario.repository.UsuarioRecuperacaoSenhaRepository;
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
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.Map;

import static java.util.Map.entry;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "app.email.enabled=false",
        "spring.profiles.active=dev,h2"
})
@AutoConfigureMockMvc
class RpgManagerApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private UsuarioEmailVerificacaoRepository usuarioEmailVerificacaoRepository;

    @Autowired
    private UsuarioRecuperacaoSenhaRepository usuarioRecuperacaoSenhaRepository;

    @Autowired
    private CampanhaRepository campanhaRepository;

    @Autowired
    private CampanhaMembrosRepository campanhaMembrosRepository;

    @Autowired
    private PersonagemCocRepository personagemCocRepository;

    @BeforeEach
    void cleanDatabase() {
        personagemCocRepository.deleteAll();
        campanhaMembrosRepository.deleteAll();
        campanhaRepository.deleteAll();
        usuarioRecuperacaoSenhaRepository.deleteAll();
        usuarioEmailVerificacaoRepository.deleteAll();
        usuarioRepository.deleteAll();
    }

    @Test
    void deveCadastrarUsuarioSemAutenticacao() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nome": "Alice",
                                  "username": "alice",
                                  "email": "alice@example.com",
                                  "senha": "123456",
                                  "confirmarSenha": "123456"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("alice@example.com"))
                .andExpect(jsonPath("$.username").value("alice"))
                .andExpect(jsonPath("$.emailVerificado").value(false));

        String token = usuarioEmailVerificacaoRepository.findAll().getFirst().getToken();

        mockMvc.perform(get("/api/auth/me")
                        .with(httpBasic("alice@example.com", "123456")))
                .andExpect(status().isUnauthorized());

        String tokenAnterior = token;

        mockMvc.perform(post("/api/auth/resend-verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "alice@example.com"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").exists());

        String novoToken = usuarioEmailVerificacaoRepository.findAll().getFirst().getToken();
        org.junit.jupiter.api.Assertions.assertNotEquals(tokenAnterior, novoToken);

        mockMvc.perform(get("/api/auth/verify-email")
                        .param("token", novoToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("alice@example.com"))
                .andExpect(jsonPath("$.emailVerificado").value(true));

        mockMvc.perform(get("/api/auth/me")
                        .with(httpBasic("alice@example.com", "123456")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emailVerificado").value(true));
    }

    @Test
    void deveRetornarUsuarioAtualQuandoAutenticado() throws Exception {
        Usuario usuario = criarUsuarioLocal("mestre", "mestre@example.com", "senha123");

        mockMvc.perform(get("/api/auth/me")
                        .with(httpBasic(usuario.getEmail(), "senha123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("mestre"))
                .andExpect(jsonPath("$.email").value("mestre@example.com"));
    }

    @Test
    void devePermitirRecuperarSenha() throws Exception {
        Usuario usuario = criarUsuarioLocal("investigador", "investigador@example.com", "senha123");

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "investigador@example.com"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").exists());

        String token = usuarioRecuperacaoSenhaRepository.findAll().getFirst().getToken();

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "token", token,
                                "senha", "novaSenha123",
                                "confirmarSenha", "novaSenha123"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Senha redefinida com sucesso. Agora voce ja pode fazer login."));

        mockMvc.perform(get("/api/auth/me")
                        .with(httpBasic(usuario.getEmail(), "senha123")))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/auth/me")
                        .with(httpBasic(usuario.getEmail(), "novaSenha123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("investigador@example.com"));
    }

    @Test
    void deveExecutarCrudDeCampanha() throws Exception {
        Usuario usuario = criarUsuarioLocal("mestre", "mestre@example.com", "senha123");

        MvcResult createResult = mockMvc.perform(post("/api/campanhas")
                        .with(httpBasic(usuario.getEmail(), "senha123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nome": "Mesa do Horror",
                                  "descricao": "Campanha investigativa",
                                  "sistema": "COC"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nome").value("Mesa do Horror"))
                .andReturn();

        Long campanhaId = lerId(createResult);

        mockMvc.perform(get("/api/campanhas/{id}", campanhaId)
                        .with(httpBasic(usuario.getEmail(), "senha123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(campanhaId))
                .andExpect(jsonPath("$.sistema").value("COC"));

        mockMvc.perform(get("/api/campanhas")
                        .with(httpBasic(usuario.getEmail(), "senha123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(campanhaId))
                .andExpect(jsonPath("$.content[0].papel").value("MESTRE"))
                .andExpect(jsonPath("$.content[0].mestreUsername").value("mestre"));

        mockMvc.perform(put("/api/campanhas/{id}", campanhaId)
                        .with(httpBasic(usuario.getEmail(), "senha123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nome": "Mesa Atualizada",
                                  "descricao": "Campanha revisada",
                                  "sistema": "DND"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Mesa Atualizada"))
                .andExpect(jsonPath("$.sistema").value("DND"))
                .andExpect(jsonPath("$.membros[0].username").value("mestre"));

        mockMvc.perform(delete("/api/campanhas/{id}", campanhaId)
                        .with(httpBasic(usuario.getEmail(), "senha123")))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/campanhas/{id}", campanhaId)
                        .with(httpBasic(usuario.getEmail(), "senha123")))
                .andExpect(status().isNotFound());
    }

    @Test
    void deveGerenciarPlayersDaCampanha() throws Exception {
        Usuario mestre = criarUsuarioLocal("mestre", "mestre@example.com", "senha123");
        Usuario player = criarUsuarioLocal("player", "player@example.com", "senha123");

        MvcResult createResult = mockMvc.perform(post("/api/campanhas")
                        .with(httpBasic(mestre.getEmail(), "senha123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nome": "Mesa com players",
                                  "descricao": "Campanha cooperativa",
                                  "sistema": "DND"
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn();

        Long campanhaId = lerId(createResult);

        mockMvc.perform(post("/api/campanhas/{campanhaId}/membros/players", campanhaId)
                        .with(httpBasic(mestre.getEmail(), "senha123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "identificador": "player@example.com"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("player"))
                .andExpect(jsonPath("$.papel").value("JOGADOR"));

        mockMvc.perform(get("/api/campanhas/{id}", campanhaId)
                        .with(httpBasic(mestre.getEmail(), "senha123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.membros.length()").value(2))
                .andExpect(jsonPath("$.membros[1].username").value("player"));

        mockMvc.perform(delete("/api/campanhas/{campanhaId}/membros/{usuarioId}", campanhaId, player.getId())
                        .with(httpBasic(mestre.getEmail(), "senha123")))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/campanhas/{id}", campanhaId)
                        .with(httpBasic(mestre.getEmail(), "senha123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.membros.length()").value(1));
    }

    @Test
    void deveRemoverPlayerMesmoComPersonagemVinculado() throws Exception {
        Usuario mestre = criarUsuarioLocal("mestre", "mestre@example.com", "senha123");
        Usuario player = criarUsuarioLocal("player", "player@example.com", "senha123");

        Campanha campanha = campanhaRepository.save(new Campanha(null, "Arkham", "Campanha COC", SistemaEnum.COC, null));
        campanhaMembrosRepository.save(new CampanhaMembro(null, campanha, mestre, CampanhaPapelEnum.MESTRE));
        CampanhaMembro membroPlayer = campanhaMembrosRepository.save(new CampanhaMembro(null, campanha, player, CampanhaPapelEnum.JOGADOR));

        String payload = objectMapper.writeValueAsString(personagemPayload(
                campanha.getId(),
                "Harvey Walters",
                "Professor de historia",
                "Terno gasto",
                "https://example.com/harvey.png",
                "ATIVO"
        ));

        mockMvc.perform(post("/api/personagens/coc")
                        .with(httpBasic(player.getEmail(), "senha123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/campanhas/{campanhaId}/membros/{usuarioId}", campanha.getId(), player.getId())
                        .with(httpBasic(mestre.getEmail(), "senha123")))
                .andExpect(status().isNoContent());

        org.junit.jupiter.api.Assertions.assertTrue(
                campanhaMembrosRepository.findByCampanhaIdAndUsuarioId(campanha.getId(), player.getId()).isEmpty()
        );
        org.junit.jupiter.api.Assertions.assertTrue(
                personagemCocRepository.findAllByCampanhaMembroUsuarioId(player.getId()).isEmpty()
        );
    }

    @Test
    void deveExecutarCrudDePersonagemCoc() throws Exception {
        Usuario usuario = criarUsuarioLocal("investigador", "investigador@example.com", "senha123");
        Campanha campanha = campanhaRepository.save(new Campanha(null, "Arkham", "Campanha COC", SistemaEnum.COC, null));
        CampanhaMembro membro = campanhaMembrosRepository.save(new CampanhaMembro(null, campanha, usuario, CampanhaPapelEnum.MESTRE));

        String payload = objectMapper.writeValueAsString(personagemPayload(
                campanha.getId(),
                "Harvey Walters",
                "Professor de historia",
                "Terno gasto",
                "https://example.com/harvey.png",
                "ATIVO"
        ));

        MvcResult createResult = mockMvc.perform(post("/api/personagens/coc")
                        .with(httpBasic(usuario.getEmail(), "senha123"))
                        .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Harvey Walters"))
                .andExpect(jsonPath("$.campanhaId").value(campanha.getId()))
                .andExpect(jsonPath("$.dadosFichaJson.anotacoes").value("Cicatriz no rosto"))
                .andExpect(jsonPath("$.dadosFichaJson.aparencia").value("Olhar cansado"))
                .andReturn();

        Long personagemId = lerId(createResult);

        mockMvc.perform(get("/api/personagens/coc/{id}", personagemId)
                        .with(httpBasic(usuario.getEmail(), "senha123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(personagemId))
                .andExpect(jsonPath("$.dadosFichaJson.vidaMaxima").value(12));

        String updatePayload = objectMapper.writeValueAsString(personagemPayload(
                campanha.getId(),
                "Harvey Walters",
                "Professor aposentado",
                "Terno escuro",
                "https://example.com/harvey-dark.png",
                "INATIVO"
        ));

        mockMvc.perform(put("/api/personagens/coc/{id}", personagemId)
                        .with(httpBasic(usuario.getEmail(), "senha123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updatePayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.historia").value("Professor aposentado"))
                .andExpect(jsonPath("$.status").value("INATIVO"));

        mockMvc.perform(delete("/api/personagens/coc/{id}", personagemId)
                        .with(httpBasic(usuario.getEmail(), "senha123")))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/personagens/coc/{id}", personagemId)
                        .with(httpBasic(usuario.getEmail(), "senha123")))
                .andExpect(status().isNotFound());
    }

    private Usuario criarUsuarioLocal(String username, String email, String senha) {
        Usuario usuario = new Usuario();
        usuario.setNome(username);
        usuario.setUsername(username);
        usuario.setEmail(email);
        usuario.setSenha(passwordEncoder.encode(senha));
        usuario.setAuthProvider(AuthProviderEnum.LOCAL);
        usuario.setEmailVerificado(true);
        usuario.setEmailVerificadoEm(java.time.Instant.now());
        return usuarioRepository.save(usuario);
    }

    private Long lerId(MvcResult result) throws Exception {
        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        return body.get("id").asLong();
    }

    private Map<String, Object> personagemPayload(
            Long campanhaId,
            String nome,
            String historia,
            String aparencia,
            String imageUrl,
            String status
    ) {
        return Map.of(
                "campanhaId", campanhaId,
                "nome", nome,
                "historia", historia,
                "aparencia", aparencia,
                "imageUrl", imageUrl,
                "status", status,
                "dadosFichaJson", Map.ofEntries(
                        entry("ocupacao", "Professor"),
                        entry("sexo", "M"),
                        entry("idade", 54),
                        entry("nacionalidade", "US"),
                        entry("atributos", Map.of(
                                "forca", 40,
                                "destreza", 55,
                                "constituicao", 50,
                                "inteligencia", 75,
                                "presenca", 60,
                                "vontade", 70
                        )),
                        entry("vidaAtual", 10),
                        entry("vidaMaxima", 12),
                        entry("sanidade", 2),
                        entry("pontosDeDestino", 1),
                        entry("pericias", List.of(Map.of("nome", "Biblioteca", "base", 20, "valor", 65))),
                        entry("origem", "Academico"),
                        entry("origemHabilidade", "Conhecimento aplicado"),
                        entry("origemBuff", "Recebe +10% em um teste de pericia."),
                        entry("origemPericias", "Ciencias e Historia"),
                        entry("anotacoes", "Cicatriz no rosto"),
                        entry("historico", "Professor de historia em Arkham"),
                        entry("aparencia", "Olhar cansado"),
                        entry("importantes", "Contato na universidade"),
                        entry("inventario", "Lanterna"),
                        entry("armas", "Revolver"),
                        entry("rituais", "Nenhum")
                )
        );
    }
}
