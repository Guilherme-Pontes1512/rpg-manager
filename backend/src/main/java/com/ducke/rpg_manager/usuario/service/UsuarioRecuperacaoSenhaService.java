package com.ducke.rpg_manager.usuario.service;

import com.ducke.rpg_manager.email.EmailProperties;
import com.ducke.rpg_manager.email.NotificacaoEmailService;
import com.ducke.rpg_manager.usuario.entidade.Usuario;
import com.ducke.rpg_manager.usuario.entidade.UsuarioRecuperacaoSenha;
import com.ducke.rpg_manager.usuario.repository.UsuarioRecuperacaoSenhaRepository;
import com.ducke.rpg_manager.usuario.repository.UsuarioRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UsuarioRecuperacaoSenhaService {

    private final UsuarioRecuperacaoSenhaRepository repository;
    private final UsuarioRepository usuarioRepository;
    private final NotificacaoEmailService notificacaoEmailService;
    private final EmailProperties emailProperties;

    @Transactional
    public void criarEEnviarToken(Usuario usuario) {
        repository.deleteAllByUsuarioIdAndUsedAtIsNull(usuario.getId());

        UsuarioRecuperacaoSenha recuperacao = new UsuarioRecuperacaoSenha();
        recuperacao.setUsuario(usuario);
        recuperacao.setToken(UUID.randomUUID().toString());
        recuperacao.setExpiresAt(Instant.now().plus(2, ChronoUnit.HOURS));

        repository.save(recuperacao);

        notificacaoEmailService.enviarRecuperacaoSenha(
                usuario.getEmail(),
                usuario.getNome(),
                emailProperties.resolvedFrontendBaseUrl() + "/?resetPasswordToken=" + recuperacao.getToken()
        );
    }

    @Transactional
    public Usuario redefinirSenha(String token, String senhaCodificada) {
        UsuarioRecuperacaoSenha recuperacao = repository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Token de recuperacao invalido"));

        if (recuperacao.getUsedAt() != null) {
            throw new IllegalStateException("Token de recuperacao ja utilizado");
        }

        if (recuperacao.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalStateException("Token de recuperacao expirado");
        }

        Usuario usuario = recuperacao.getUsuario();
        usuario.setSenha(senhaCodificada);
        recuperacao.setUsedAt(Instant.now());

        usuarioRepository.save(usuario);
        repository.save(recuperacao);

        return usuario;
    }
}
