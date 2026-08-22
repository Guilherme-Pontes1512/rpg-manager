package com.ducke.rpg_manager.campanha.repository;

import com.ducke.rpg_manager.campanha.entidade.CampanhaDocumentoDownloadStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CampanhaDocumentoDownloadStatusRepository extends JpaRepository<CampanhaDocumentoDownloadStatus, Long> {

    boolean existsByDocumentoIdAndUsuarioId(Long documentoId, Long usuarioId);

    Optional<CampanhaDocumentoDownloadStatus> findByDocumentoIdAndUsuarioId(Long documentoId, Long usuarioId);
}
