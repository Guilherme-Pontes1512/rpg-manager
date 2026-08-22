package com.ducke.rpg_manager.campanha_npcs.entidade;

import com.ducke.rpg_manager.campanha.entidade.Campanha;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "campanha_npcs")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class CampanhaNpc {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campanha_id", nullable = false)
    private Campanha campanha;

    @Column(nullable = false)
    private String nome;

    @Column(name = "image_url")
    private String imageUrl;

    @Lob
    @Column(name = "dados_ficha_json", columnDefinition = "longtext")
    private String dadosFichaJson;
}
