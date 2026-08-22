package com.ducke.rpg_manager.usuario.repository;

import com.ducke.rpg_manager.usuario.entidade.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByEmail(String email);

    Optional<Usuario> findByEmailIgnoreCase(String email);

    Optional<Usuario> findByUsernameIgnoreCase(String username);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);
}
