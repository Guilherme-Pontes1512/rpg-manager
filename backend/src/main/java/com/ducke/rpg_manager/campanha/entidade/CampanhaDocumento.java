package com.ducke.rpg_manager.campanha.entidade;

import com.ducke.rpg_manager.usuario.entidade.Usuario;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "campanha_documentos")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class CampanhaDocumento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campanha_id", nullable = false)
    private Campanha campanha;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enviado_por_id", nullable = false)
    private Usuario enviadoPor;

    @Column(name = "nome_arquivo", nullable = false)
    private String nomeArquivo;

    @Column(name = "tipo_conteudo", nullable = false, length = 100)
    private String tipoConteudo;

    @Column(name = "tamanho_bytes", nullable = false)
    private Long tamanhoBytes;

    @Lob
    @Column(nullable = false, columnDefinition = "blob")
    private byte[] conteudo;

    @Column(name = "enviado_em", nullable = false)
    private Instant enviadoEm;
}
