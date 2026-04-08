package com.ducke.rpg_manager.usuario.repository;

import com.ducke.rpg_manager.usuario.entidade.UsuarioRecuperacaoSenha;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsuarioRecuperacaoSenhaRepository extends JpaRepository<UsuarioRecuperacaoSenha, Long> {

    Optional<UsuarioRecuperacaoSenha> findByToken(String token);

    void deleteAllByUsuarioIdAndUsedAtIsNull(Long usuarioId);
}
