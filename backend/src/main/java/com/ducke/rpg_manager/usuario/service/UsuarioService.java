package com.ducke.rpg_manager.usuario.service;

import com.ducke.rpg_manager.usuario.dtos.AuthActionOutput;
import com.ducke.rpg_manager.usuario.dtos.AuthEmailInput;
import com.ducke.rpg_manager.usuario.dtos.AuthRegisterInput;
import com.ducke.rpg_manager.usuario.dtos.AuthResetPasswordInput;
import com.ducke.rpg_manager.usuario.dtos.AuthUserOutput;
import com.ducke.rpg_manager.usuario.entidade.Usuario;
import com.ducke.rpg_manager.usuario.mapper.UsuarioMapper;
import com.ducke.rpg_manager.usuario.repository.UsuarioRepository;
import com.ducke.rpg_manager.usuario.validator.UsuarioValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioValidator usuarioValidator;
    private final UsuarioRepository usuarioRepository;
    private final UsuarioMapper usuarioMapper;
    private final PasswordEncoder passwordEncoder;
    private final UsuarioAtualService usuarioAtualService;
    private final UsuarioEmailVerificacaoService usuarioEmailVerificacaoService;
    private final UsuarioRecuperacaoSenhaService usuarioRecuperacaoSenhaService;

    public AuthUserOutput cadastrar(AuthRegisterInput input) {
        usuarioValidator.validarCadastro(input);

        Usuario entity = usuarioMapper.toEntity(input);
        entity.setSenha(passwordEncoder.encode(input.senha()));
        usuarioRepository.save(entity);
        usuarioEmailVerificacaoService.criarEEnviarToken(entity);

        return usuarioMapper.toAuthOutput(entity);
    }

    public AuthUserOutput confirmarEmail(String token) {
        Usuario usuario = usuarioEmailVerificacaoService.confirmarEmail(token);
        return usuarioMapper.toAuthOutput(usuario);
    }

    public AuthUserOutput obterUsuarioAtual() {
        return usuarioMapper.toAuthOutput(usuarioAtualService.getRequired());
    }

    public AuthActionOutput reenviarVerificacaoEmail(AuthEmailInput input) {
        usuarioRepository.findByEmailIgnoreCase(input.email())
                .filter(usuario -> !usuario.isEmailVerificado())
                .ifPresent(usuarioEmailVerificacaoService::criarEEnviarToken);

        return new AuthActionOutput("Se existir uma conta pendente de confirmacao, enviaremos um novo email.");
    }

    public AuthActionOutput solicitarRecuperacaoSenha(AuthEmailInput input) {
        usuarioRepository.findByEmailIgnoreCase(input.email())
                .filter(usuario -> usuario.getSenha() != null && !usuario.getSenha().isBlank())
                .ifPresent(usuarioRecuperacaoSenhaService::criarEEnviarToken);

        return new AuthActionOutput("Se existir uma conta com esse email, enviaremos instrucoes para redefinir a senha.");
    }

    public AuthActionOutput redefinirSenha(AuthResetPasswordInput input) {
        usuarioValidator.validarConfirmacaoSenha(input.senha(), input.confirmarSenha());
        usuarioRecuperacaoSenhaService.redefinirSenha(input.token(), passwordEncoder.encode(input.senha()));
        return new AuthActionOutput("Senha redefinida com sucesso. Agora voce ja pode fazer login.");
    }
}
