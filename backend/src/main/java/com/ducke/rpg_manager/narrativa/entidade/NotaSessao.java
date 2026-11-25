package com.ducke.rpg_manager.narrativa.entidade;

import com.ducke.rpg_manager.campanha.entidade.Campanha;
import com.ducke.rpg_manager.campanha_npcs.entidade.CampanhaNpc;
import com.ducke.rpg_manager.personagens.entidade.Personagem;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Entity
@org.hibernate.annotations.BatchSize(size = 100)
@Table(name = "notas_sessao")
@Getter
@Setter
public class NotaSessao {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sessao_id", nullable = false)
    private Sessao sessao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evento_id")
    private Evento evento;
    private String titulo;
    @Column(columnDefinition = "text")
    private String conteudo;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CategoriaNota categoria = CategoriaNota.OBSERVACAO_GERAL;
    @ManyToMany
    @org.hibernate.annotations.BatchSize(size = 100)
    @JoinTable(name = "nota_sessao_personagens", joinColumns = @JoinColumn(name = "nota_id"), inverseJoinColumns = @JoinColumn(name = "personagem_id"))
    private Set<Personagem> participantes = new HashSet<>();

    @ManyToMany
    @org.hibernate.annotations.BatchSize(size = 100)
    @JoinTable(name = "nota_sessao_npcs", joinColumns = @JoinColumn(name = "nota_id"), inverseJoinColumns = @JoinColumn(name = "npc_id"))
    private Set<CampanhaNpc> npcs = new HashSet<>();
    @Column(nullable = false, updatable = false)
    private Instant criadoEm;

    @Column(nullable = false)
    private Instant atualizadoEm;

    @PrePersist
    void criar() {
        criadoEm = Instant.now();
        atualizadoEm = criadoEm;
    }

    @PreUpdate
    void atualizar() {
        atualizadoEm = Instant.now();
    }
}
