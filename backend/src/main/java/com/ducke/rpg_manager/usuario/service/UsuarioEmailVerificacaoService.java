package com.ducke.rpg_manager.usuario.service;

import com.ducke.rpg_manager.email.EmailProperties;
import com.ducke.rpg_manager.email.NotificacaoEmailService;
import com.ducke.rpg_manager.usuario.entidade.Usuario;
import com.ducke.rpg_manager.usuario.entidade.UsuarioEmailVerificacao;
import com.ducke.rpg_manager.usuario.repository.UsuarioEmailVerificacaoRepository;
import com.ducke.rpg_manager.usuario.repository.UsuarioRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UsuarioEmailVerificacaoService {

    private final UsuarioEmailVerificacaoRepository repository;
    private final UsuarioRepository usuarioRepository;
    private final NotificacaoEmailService notificacaoEmailService;
    private final EmailProperties emailProperties;

    @Transactional
    public void criarEEnviarToken(Usuario usuario) {
        repository.deleteAllByUsuarioIdAndUsedAtIsNull(usuario.getId());

        UsuarioEmailVerificacao verificacao = new UsuarioEmailVerificacao();
        verificacao.setUsuario(usuario);
        verificacao.setToken(UUID.randomUUID().toString());
        verificacao.setExpiresAt(Instant.now().plus(24, ChronoUnit.HOURS));

        repository.save(verificacao);

        notificacaoEmailService.enviarVerificacaoCadastro(
                usuario.getEmail(),
                usuario.getNome(),
                emailProperties.resolvedFrontendBaseUrl() + "/?verifyEmailToken=" + verificacao.getToken()
        );
    }

    @Transactional
    public Usuario confirmarEmail(String token) {
        UsuarioEmailVerificacao verificacao = repository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Token de verificacao invalido"));

        if (verificacao.getUsedAt() != null) {
            throw new IllegalStateException("Token de verificacao ja utilizado");
        }

        if (verificacao.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalStateException("Token de verificacao expirado");
        }

        Usuario usuario = verificacao.getUsuario();
        usuario.setEmailVerificado(true);
        usuario.setEmailVerificadoEm(Instant.now());
        verificacao.setUsedAt(Instant.now());

        usuarioRepository.save(usuario);
        repository.save(verificacao);

        return usuario;
    }
}
