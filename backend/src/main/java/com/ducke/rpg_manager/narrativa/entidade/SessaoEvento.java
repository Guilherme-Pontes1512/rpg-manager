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
@Table(name = "sessao_eventos", uniqueConstraints = @UniqueConstraint(name = "uk_sessao_evento", columnNames = {"sessao_id", "evento_id"}))
@Getter
@Setter
public class SessaoEvento {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sessao_id", nullable = false)
    private Sessao sessao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evento_id", nullable = false)
    private Evento evento;
    @Column(nullable = false)
    private Integer ordem;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusSessaoEvento status = StatusSessaoEvento.PENDENTE;
    @Column(columnDefinition = "text")
    private String observacoes;
    @Column(columnDefinition = "text")
    private String resultado;
    @Column(columnDefinition = "text")
    private String consequencias;
    @Column(columnDefinition = "text")
    private String evidencias;
    private Instant realizadoEm;
}
