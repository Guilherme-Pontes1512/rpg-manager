package com.ducke.rpg_manager.campanha.entidade;

import com.ducke.rpg_manager.usuario.entidade.Usuario;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "campanha_documento_downloads", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"documento_id", "usuario_id"})
})
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class CampanhaDocumentoDownloadStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "documento_id", nullable = false)
    private CampanhaDocumento documento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "baixado_em", nullable = false)
    private Instant baixadoEm;
}
