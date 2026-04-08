package com.ducke.rpg_manager.personagens.entidade;

import com.ducke.rpg_manager.campanha_membros.entidade.CampanhaMembro;
import com.ducke.rpg_manager.personagens.enumx.PersonagemStatusEnum;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "personagens")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Personagem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch =  FetchType.LAZY)
    @JoinColumn(name = "campanha_membro_id", nullable = false)
    private CampanhaMembro campanhaMembro;

    @Column(nullable = false)
    private String nome;

    @Lob
    @Column(columnDefinition = "text")
    private String historia;

    @Lob
    @Column(columnDefinition = "text")
    private String aparencia;

    @Column(name = "image_url")
    private String imageUrl;

    @Column
    @Enumerated(EnumType.STRING)
    private PersonagemStatusEnum status;

    @Lob
    @Column(name = "dados_ficha_json", columnDefinition = "longtext")
    private String dadosFichaJson;
}
