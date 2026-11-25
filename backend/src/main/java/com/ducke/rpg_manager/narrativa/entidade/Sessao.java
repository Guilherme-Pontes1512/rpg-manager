package com.ducke.rpg_manager.narrativa.entidade;

import com.ducke.rpg_manager.campanha.entidade.Campanha;
import com.ducke.rpg_manager.campanha_npcs.entidade.CampanhaNpc;
import com.ducke.rpg_manager.personagens.entidade.Personagem;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@org.hibernate.annotations.BatchSize(size = 100)
@Table(name = "sessoes", uniqueConstraints = @UniqueConstraint(name = "uk_sessao_campanha_numero", columnNames = {"campanha_id", "numero"}))
@Getter
@Setter
public class Sessao {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campanha_id", nullable = false)
    private Campanha campanha;
    private Integer numero;
    private String titulo;
    @Column(columnDefinition = "text")
    private String descricao;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusSessao status = StatusSessao.PLANEJADA;
    @Column(columnDefinition = "text")
    private String resumo;
    @ManyToMany
    @org.hibernate.annotations.BatchSize(size = 100)
    @JoinTable(name = "sessao_personagens", joinColumns = @JoinColumn(name = "sessao_id"), inverseJoinColumns = @JoinColumn(name = "personagem_id"))
    private Set<Personagem> participantes = new HashSet<>();

    @ManyToMany
    @org.hibernate.annotations.BatchSize(size = 100)
    @JoinTable(name = "sessao_npcs", joinColumns = @JoinColumn(name = "sessao_id"), inverseJoinColumns = @JoinColumn(name = "npc_id"))
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
