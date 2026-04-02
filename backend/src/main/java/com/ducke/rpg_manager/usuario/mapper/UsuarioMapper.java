package com.ducke.rpg_manager.usuario.mapper;

import com.ducke.rpg_manager.usuario.dtos.UsuarioDto;
import com.ducke.rpg_manager.usuario.entidade.Usuario;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Mapper(componentModel = "spring")
public interface UsuarioMapper {

    @Mapping(target = "authProvider", expression = "java(com.ducke.rpg_manager.usuario.enumx.AuthProviderEnum.LOCAL)")
    Usuario toEntity(UsuarioDto usuarioDto);

    UsuarioDto toDto(Usuario usuario);
}
