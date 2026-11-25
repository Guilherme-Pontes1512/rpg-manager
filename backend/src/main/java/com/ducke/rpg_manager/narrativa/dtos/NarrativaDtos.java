package com.ducke.rpg_manager.narrativa.dtos;

import com.ducke.rpg_manager.narrativa.entidade.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.List;
import java.util.Set;

public final class NarrativaDtos {
    private NarrativaDtos() {}

    public record SessaoInput(@Positive Integer numero, @Size(max = 255) String titulo,
            String descricao, String resumo, Set<Long> participantes, Set<Long> npcs) {}

    public record EventoInput(@NotBlank @Size(max = 255) String titulo, String descricao,
            TipoEvento tipo, StatusEvento status, @Size(max = 255) String local,
            @Size(max = 255) String dataNarrativa, String condicoes, String orientacoes,
            String evidencias, String consequencias, Set<Long> participantes, Set<Long> npcs) {}

    public record AssociacaoInput(@NotNull Long eventoId, @PositiveOrZero Integer ordem, String observacoes) {}
    public record RegistroInput(@NotNull StatusSessaoEvento status, String observacoes,
            String resultado, String consequencias, String evidencias, Instant realizadoEm) {}
    public record TransferenciaInput(@NotNull Long sessaoDestinoId) {}
    public record OrdemInput(@NotNull List<@NotNull Long> ids) {}
    public record NotaInput(@Size(max = 255) String titulo, @NotBlank String conteudo,
            CategoriaNota categoria, Set<Long> participantes, Set<Long> npcs, Long eventoId) {}

    public enum DestinoPendente { TRANSFERIR, NOVA_SESSAO, BANCO, REALIZADO_FORA_CENA, DESCARTAR_SESSAO, DESCARTAR_CAMPANHA }
    public record DecisaoInput(@NotNull Long associacaoId, @NotNull DestinoPendente destino,
            Long sessaoDestinoId, @Valid SessaoInput novaSessao) {}
    public record EncerramentoInput(String resumo, Boolean retornarTodosAoBanco, @Valid List<@NotNull DecisaoInput> decisoes) {}

    public record SessaoOutput(Long id, Long campanhaId, Integer numero, String titulo, String descricao,
            StatusSessao status, String resumo, Instant criadoEm, Instant atualizadoEm, Set<Long> participantes, Set<Long> npcs,
            long quantidadeEventos, long eventosRealizados, long quantidadeNotas) {}
    public record EventoOutput(Long id, Long campanhaId, String titulo, String descricao, TipoEvento tipo,
            StatusEvento status, String local, String dataNarrativa, String condicoes, String orientacoes,
            String evidencias, String consequencias, Set<Long> participantes, Set<Long> npcs,
            Instant criadoEm, Instant atualizadoEm, Long sessaoPlanejadaId) {}
    public record AssociacaoOutput(Long id, Long sessaoId, EventoOutput evento, Integer ordem,
            StatusSessaoEvento status, String observacoes, String resultado, String consequencias,
            String evidencias, Instant realizadoEm) {}
    public record NotaOutput(Long id, Long sessaoId, String titulo, String conteudo, CategoriaNota categoria,
            Set<Long> participantes, Set<Long> npcs, Long eventoId, Instant criadoEm, Instant atualizadoEm) {}
}
