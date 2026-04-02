package com.ducke.rpg_manager.campanha.entidade;

import com.ducke.rpg_manager.campanha_membros.entidade.CampanhaMembro;
import com.ducke.rpg_manager.common.SistemaEnum;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "campanhas")
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class Campanha {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String nome;

    @Lob
    @Column
    private String descricao;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SistemaEnum sistema;

    @OneToMany(mappedBy = "campanha", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<CampanhaMembro> membros = new HashSet<>();
}
