package com.ducke.rpg_manager.usuario.entidade;

import com.ducke.rpg_manager.usuario.enumx.AuthProviderEnum;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name = "usuarios",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_usuario_email", columnNames = "email"),
                @UniqueConstraint(name = "uk_usuario_provider", columnNames = {"authProvider", "providerUserId"})
        }
)
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String nome;

    @NotBlank
    @Column(nullable = false, unique = true, length = 30)
    private String username;

    @NotBlank
    @Column(nullable = false, unique = true)
    @Email
    private String email;

    @Column
    private String senha;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private AuthProviderEnum authProvider;

    @Column
    private String providerUserId;
}
