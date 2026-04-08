package com.ducke.rpg_manager.usuario.repository;

import com.ducke.rpg_manager.usuario.entidade.UsuarioEmailVerificacao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsuarioEmailVerificacaoRepository extends JpaRepository<UsuarioEmailVerificacao, Long> {

    Optional<UsuarioEmailVerificacao> findByToken(String token);

    void deleteAllByUsuarioIdAndUsedAtIsNull(Long usuarioId);
}
