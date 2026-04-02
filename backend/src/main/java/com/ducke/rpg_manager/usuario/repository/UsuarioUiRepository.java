package com.ducke.rpg_manager.usuario.repository;

import com.ducke.rpg_manager.usuario.entidade.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsuarioUiRepository extends JpaRepository<Usuario, Long> {

        Long findIdByUsername(String username);
}
