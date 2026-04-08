package com.ducke.rpg_manager.email;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificacaoEmailService {

    private final EmailService emailService;

    public void enviarVerificacaoCadastro(String destinatario, String nome, String verificationUrl) {
        emailService.send(new EmailMessage(
                destinatario,
                "Confirme seu cadastro no RPG Manager",
                """
                Ola, %s.

                Confirme seu cadastro no RPG Manager acessando o link abaixo:
                %s

                Se voce nao criou essa conta, ignore este email.
                """.formatted(nome, verificationUrl)
        ));
    }

    public void enviarRecuperacaoSenha(String destinatario, String nome, String resetUrl) {
        emailService.send(new EmailMessage(
                destinatario,
                "Recupere sua senha no RPG Manager",
                """
                Ola, %s.

                Recebemos um pedido para redefinir sua senha no RPG Manager.
                Use o link abaixo para cadastrar uma nova senha:
                %s

                Se voce nao pediu essa alteracao, ignore este email.
                """.formatted(nome, resetUrl)
        ));
    }

    public void enviarNotificacaoInclusaoCampanha(String destinatario, String nomeCampanha) {
        emailService.send(new EmailMessage(
                destinatario,
                "Voce foi incluido em uma campanha",
                "Voce foi incluido na campanha %s no RPG Manager.".formatted(nomeCampanha)
        ));
    }
}
