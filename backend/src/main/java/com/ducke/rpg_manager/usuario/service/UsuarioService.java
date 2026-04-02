package com.ducke.rpg_manager.usuario.service;

import com.ducke.rpg_manager.usuario.dtos.UsuarioDto;
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

    public UsuarioDto cadastrar(UsuarioDto usuarioDto) {
        usuarioValidator.validarCadastro(usuarioDto);
        Usuario entity = usuarioMapper.toEntity(usuarioDto);
        entity.setSenha(passwordEncoder.encode(entity.getSenha()));
        usuarioRepository.save(entity);

        return usuarioMapper.toDto(entity);
    }
}
