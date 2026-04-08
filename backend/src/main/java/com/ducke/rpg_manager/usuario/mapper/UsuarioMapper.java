package com.ducke.rpg_manager.usuario.mapper;

import com.ducke.rpg_manager.usuario.dtos.AuthRegisterInput;
import com.ducke.rpg_manager.usuario.dtos.AuthUserOutput;
import com.ducke.rpg_manager.usuario.entidade.Usuario;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UsuarioMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "nome", source = "nome")
    @Mapping(target = "username", source = "username")
    @Mapping(target = "senha", ignore = true)
    @Mapping(target = "authProvider", expression = "java(com.ducke.rpg_manager.usuario.enumx.AuthProviderEnum.LOCAL)")
    @Mapping(target = "providerUserId", ignore = true)
    @Mapping(target = "emailVerificado", constant = "false")
    @Mapping(target = "emailVerificadoEm", ignore = true)
    Usuario toEntity(AuthRegisterInput input);

    AuthUserOutput toAuthOutput(Usuario usuario);
}
