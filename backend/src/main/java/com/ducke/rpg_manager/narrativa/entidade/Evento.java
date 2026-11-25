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
@Table(name = "eventos")
@Getter
@Setter
public class Evento {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campanha_id", nullable = false)
    private Campanha campanha;
    @Column(nullable = false)
    private String titulo;
    @Column(columnDefinition = "text")
    private String descricao;
    @Enumerated(EnumType.STRING)
    private TipoEvento tipo;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusEvento status = StatusEvento.PENDENTE;
    private String local;
    private String dataNarrativa;
    @Column(columnDefinition = "text")
    private String condicoes;
    @Column(columnDefinition = "text")
    private String orientacoes;
    @Column(columnDefinition = "text")
    private String evidencias;
    @Column(columnDefinition = "text")
    private String consequencias;
    @ManyToMany
    @org.hibernate.annotations.BatchSize(size = 100)
    @JoinTable(name = "evento_personagens", joinColumns = @JoinColumn(name = "evento_id"), inverseJoinColumns = @JoinColumn(name = "personagem_id"))
    private Set<Personagem> participantes = new HashSet<>();

    @ManyToMany
    @org.hibernate.annotations.BatchSize(size = 100)
    @JoinTable(name = "evento_npcs", joinColumns = @JoinColumn(name = "evento_id"), inverseJoinColumns = @JoinColumn(name = "npc_id"))
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
