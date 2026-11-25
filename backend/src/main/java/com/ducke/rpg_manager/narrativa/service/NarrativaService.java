package com.ducke.rpg_manager.narrativa.service;

import com.ducke.rpg_manager.campanha.entidade.Campanha;
import com.ducke.rpg_manager.campanha.enumx.CampanhaPapelEnum;
import com.ducke.rpg_manager.campanha_membros.repository.CampanhaMembrosRepository;
import com.ducke.rpg_manager.campanha_npcs.entidade.CampanhaNpc;
import com.ducke.rpg_manager.campanha_npcs.repository.CampanhaNpcRepository;
import com.ducke.rpg_manager.narrativa.dtos.NarrativaDtos.*;
import com.ducke.rpg_manager.narrativa.entidade.*;
import com.ducke.rpg_manager.narrativa.repository.*;
import com.ducke.rpg_manager.personagens.entidade.Personagem;
import com.ducke.rpg_manager.personagens.repository.PersonagemRepository;
import com.ducke.rpg_manager.usuario.service.UsuarioAtualService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class NarrativaService {
    private final CampanhaNarrativaRepository campanhas;
    private final CampanhaMembrosRepository membros;
    private final UsuarioAtualService usuario;
    private final SessaoRepository sessoes;
    private final EventoRepository eventos;
    private final SessaoEventoRepository associacoes;
    private final NotaSessaoRepository notas;
    private final PersonagemRepository personagens;
    private final CampanhaNpcRepository npcs;

    private Campanha autorizar(Long campanhaId) {
        if (!membros.existsByCampanhaIdAndUsuarioIdAndPapel(campanhaId, usuario.getId(), CampanhaPapelEnum.MESTRE)) {
            throw new AccessDeniedException("Apenas o mestre pode acessar os registros narrativos");
        }
        return campanhas.lockById(campanhaId).orElseThrow(() -> ausente("Campanha"));
    }

    public List<SessaoOutput> listarSessoes(Long campanhaId) {
        autorizar(campanhaId);
        List<SessaoEvento> registros = associacoes.findAllByEventoCampanhaId(campanhaId);
        Map<Long, List<SessaoEvento>> porSessao = registros.stream().collect(Collectors.groupingBy(registro -> registro.getSessao().getId()));
        Map<Long, Long> contagemNotas = notas.findAllBySessaoCampanhaId(campanhaId).stream()
                .collect(Collectors.groupingBy(nota -> nota.getSessao().getId(), Collectors.counting()));
        return sessoes.findAllByCampanhaIdOrderByCriadoEmDescIdDesc(campanhaId).stream()
                .map(sessao -> output(sessao, porSessao.getOrDefault(sessao.getId(), List.of()), contagemNotas.getOrDefault(sessao.getId(), 0L))).toList();
    }

    public SessaoOutput obterSessao(Long campanhaId, Long id) {
        autorizar(campanhaId);
        return output(sessao(campanhaId, id));
    }

    public SessaoOutput criarSessao(Long campanhaId, SessaoInput input) {
        Campanha campanha = autorizar(campanhaId);
        return output(criarSessaoInterna(campanha, input));
    }

    private Sessao criarSessaoInterna(Campanha campanha, SessaoInput input) {
        Sessao sessao = new Sessao();
        sessao.setCampanha(campanha);
        sessao.setStatus(StatusSessao.PLANEJADA);
        preencherSessao(sessao, input);
        return sessoes.saveAndFlush(sessao);
    }

    public SessaoOutput editarSessao(Long campanhaId, Long id, SessaoInput input) {
        autorizar(campanhaId);
        Sessao sessao = sessao(campanhaId, id);
        preencherSessao(sessao, input);
        sessoes.flush();
        return output(sessao);
    }

    private void preencherSessao(Sessao sessao, SessaoInput input) {
        Integer numero = input.numero();
        if (numero != null && (numero < 1 || sessoes.findAllByCampanhaIdOrderByCriadoEmDescIdDesc(sessao.getCampanha().getId()).stream()
                .anyMatch(outra -> numero.equals(outra.getNumero()) && !Objects.equals(outra.getId(), sessao.getId())))) {
            throw new IllegalStateException("Numero de sessao indisponivel nesta campanha");
        }
        sessao.setNumero(numero);
        sessao.setTitulo(input.titulo());
        sessao.setDescricao(input.descricao());
        sessao.setResumo(input.resumo());
        sessao.setParticipantes(validarPersonagens(sessao.getCampanha().getId(), input.participantes()));
        sessao.setNpcs(validarNpcs(sessao.getCampanha().getId(), input.npcs()));
    }

    public void excluirSessao(Long campanhaId, Long id) {
        autorizar(campanhaId);
        Sessao sessao = sessao(campanhaId, id);
        if (sessao.getStatus() == StatusSessao.EM_ANDAMENTO || registros(id).stream().anyMatch(registro -> registro.getStatus() == StatusSessaoEvento.REALIZADO)) {
            throw new IllegalStateException("Sessao em andamento ou com acontecimentos realizados deve ser preservada");
        }
        notas.deleteAllBySessaoId(id);
        associacoes.deleteAllBySessaoId(id);
        sessoes.delete(sessao);
    }

    public SessaoOutput iniciar(Long campanhaId, Long id) {
        autorizar(campanhaId);
        Sessao sessao = sessao(campanhaId, id);
        if (sessao.getStatus() != StatusSessao.PLANEJADA) throw new IllegalStateException("Apenas sessoes planejadas podem ser iniciadas");
        if (sessoes.findAllByCampanhaIdOrderByCriadoEmDescIdDesc(campanhaId).stream().anyMatch(outra -> outra.getStatus() == StatusSessao.EM_ANDAMENTO)) {
            throw new IllegalStateException("Ja existe uma sessao em andamento");
        }
        sessao.setStatus(StatusSessao.EM_ANDAMENTO);
        sessoes.flush();
        return output(sessao);
    }

    public SessaoOutput cancelar(Long campanhaId, Long id) {
        autorizar(campanhaId);
        Sessao sessao = sessao(campanhaId, id);
        if (sessao.getStatus() != StatusSessao.PLANEJADA && sessao.getStatus() != StatusSessao.EM_ANDAMENTO) {
            throw new IllegalStateException("Esta sessao nao pode ser cancelada");
        }
        registros(id).stream().filter(this::pendente).forEach(registro -> registro.setStatus(StatusSessaoEvento.ADIADO));
        sessao.setStatus(StatusSessao.CANCELADA);
        sessoes.flush();
        return output(sessao);
    }

    public List<EventoOutput> listarEventos(Long campanhaId) {
        autorizar(campanhaId);
        Map<Long, Long> planejamento = planejamento(campanhaId);
        return eventos.findAllByCampanhaIdOrderByCriadoEmDesc(campanhaId).stream().map(evento -> output(evento, planejamento.get(evento.getId()))).toList();
    }

    public EventoOutput obterEvento(Long campanhaId, Long id) {
        autorizar(campanhaId);
        return output(evento(campanhaId, id), planejamento(campanhaId).get(id));
    }

    public EventoOutput criarEvento(Long campanhaId, EventoInput input) {
        Campanha campanha = autorizar(campanhaId);
        Evento evento = new Evento();
        evento.setCampanha(campanha);
        preencherEvento(evento, input);
        eventos.saveAndFlush(evento);
        return output(evento, null);
    }

    public EventoOutput editarEvento(Long campanhaId, Long id, EventoInput input) {
        autorizar(campanhaId);
        Evento evento = evento(campanhaId, id);
        preencherEvento(evento, input);
        eventos.flush();
        return output(evento, planejamento(campanhaId).get(id));
    }

    private void preencherEvento(Evento evento, EventoInput input) {
        StatusEvento status = input.status() == null ? (evento.getStatus() == null ? StatusEvento.PENDENTE : evento.getStatus()) : input.status();
        if (evento.getStatus() == StatusEvento.REALIZADO && status != StatusEvento.REALIZADO) {
            throw new IllegalStateException("O registro de realizacao deve ser preservado");
        }
        evento.setTitulo(input.titulo().trim());
        evento.setDescricao(input.descricao());
        evento.setTipo(input.tipo() == null ? TipoEvento.OPCIONAL : input.tipo());
        evento.setStatus(status);
        evento.setLocal(input.local());
        evento.setDataNarrativa(input.dataNarrativa());
        evento.setCondicoes(input.condicoes());
        evento.setOrientacoes(input.orientacoes());
        evento.setEvidencias(input.evidencias());
        evento.setConsequencias(input.consequencias());
        evento.setParticipantes(validarPersonagens(evento.getCampanha().getId(), input.participantes()));
        evento.setNpcs(validarNpcs(evento.getCampanha().getId(), input.npcs()));
        if (evento.getId() != null && status != StatusEvento.PENDENTE) {
            associacoes.findAllByEventoId(evento.getId()).stream().filter(this::pendente)
                    .forEach(registro -> registro.setStatus(status == StatusEvento.DESCARTADO ? StatusSessaoEvento.DESCARTADO : StatusSessaoEvento.ADIADO));
        }
    }

    public void excluirEvento(Long campanhaId, Long id) {
        autorizar(campanhaId);
        Evento evento = evento(campanhaId, id);
        if (evento.getStatus() == StatusEvento.REALIZADO || !associacoes.findAllByEventoId(id).isEmpty()
                || notas.existsByEventoId(id)) {
            throw new IllegalStateException("Evento com historico ou anotacoes nao pode ser excluido; use o descarte narrativo");
        }
        eventos.delete(evento);
    }

    public List<AssociacaoOutput> listarAssociacoes(Long campanhaId, Long sessaoId) {
        autorizar(campanhaId);
        sessao(campanhaId, sessaoId);
        Map<Long, Long> planejamento = planejamento(campanhaId);
        return registros(sessaoId).stream().map(registro -> output(registro, planejamento.get(registro.getEvento().getId()))).toList();
    }

    public AssociacaoOutput associar(Long campanhaId, Long sessaoId, AssociacaoInput input) {
        autorizar(campanhaId);
        SessaoEvento registro = associarInterno(sessao(campanhaId, sessaoId), evento(campanhaId, input.eventoId()), input.ordem(), input.observacoes());
        return output(registro, sessaoId);
    }

    private SessaoEvento associarInterno(Sessao sessao, Evento evento, Integer ordem, String observacoes) {
        if (sessao.getStatus() != StatusSessao.PLANEJADA && sessao.getStatus() != StatusSessao.EM_ANDAMENTO) {
            throw new IllegalStateException("O planejamento exige sessao planejada ou em andamento");
        }
        if (evento.getStatus() != StatusEvento.PENDENTE) throw new IllegalStateException("Apenas eventos pendentes podem ser planejados");
        List<SessaoEvento> historico = associacoes.findAllByEventoId(evento.getId());
        if (historico.stream().anyMatch(registro -> registro.getSessao().getId().equals(sessao.getId()) || pendente(registro))) {
            throw new IllegalStateException("Evento ja associado a esta sessao ou com planejamento ativo");
        }
        SessaoEvento registro = new SessaoEvento();
        registro.setSessao(sessao);
        registro.setEvento(evento);
        registro.setOrdem(ordem == null ? registros(sessao.getId()).stream().mapToInt(SessaoEvento::getOrdem).max().orElse(-1) + 1 : ordem);
        registro.setStatus(StatusSessaoEvento.PENDENTE);
        registro.setObservacoes(observacoes);
        return associacoes.saveAndFlush(registro);
    }

    public AssociacaoOutput criarNaSessao(Long campanhaId, Long sessaoId, EventoInput input) {
        EventoOutput criado = criarEvento(campanhaId, input);
        return associar(campanhaId, sessaoId, new AssociacaoInput(criado.id(), null, null));
    }

    public AssociacaoOutput registrar(Long campanhaId, Long sessaoId, Long id, RegistroInput input) {
        autorizar(campanhaId);
        SessaoEvento registro = registro(campanhaId, sessaoId, id);
        if (registro.getStatus() != input.status() && !pendente(registro)) {
            throw new IllegalStateException("Uma associacao historica nao pode ser reaberta ou mudar de desfecho");
        }
        if (input.status() == StatusSessaoEvento.REALIZADO) {
            if (registro.getEvento().getStatus() == StatusEvento.DESCARTADO) throw new IllegalStateException("Evento descartado nao pode ser realizado");
            registro.getEvento().setStatus(StatusEvento.REALIZADO);
            registro.setRealizadoEm(input.realizadoEm() == null ? Instant.now() : input.realizadoEm());
        }
        registro.setStatus(input.status());
        registro.setObservacoes(input.observacoes());
        registro.setResultado(input.resultado());
        registro.setConsequencias(input.consequencias());
        registro.setEvidencias(input.evidencias());
        associacoes.flush();
        return output(registro, pendente(registro) ? sessaoId : null);
    }

    public void removerAssociacao(Long campanhaId, Long sessaoId, Long id) {
        autorizar(campanhaId);
        SessaoEvento registro = registro(campanhaId, sessaoId, id);
        if (!pendente(registro)) throw new IllegalStateException("Apenas associacoes ainda nao utilizadas podem ser removidas");
        associacoes.delete(registro);
    }

    public void retornarBanco(Long campanhaId, Long sessaoId, Long id) {
        autorizar(campanhaId);
        SessaoEvento registro = registro(campanhaId, sessaoId, id);
        exigirPendente(registro);
        registro.setStatus(StatusSessaoEvento.ADIADO);
    }

    public AssociacaoOutput transferir(Long campanhaId, Long sessaoId, Long id, Long destinoId) {
        autorizar(campanhaId);
        SessaoEvento registro = registro(campanhaId, sessaoId, id);
        return output(transferirInterno(registro, sessao(campanhaId, destinoId)), destinoId);
    }

    private SessaoEvento transferirInterno(SessaoEvento registro, Sessao destino) {
        exigirPendente(registro);
        if (destino.getStatus() != StatusSessao.PLANEJADA || destino.getId().equals(registro.getSessao().getId())) {
            throw new IllegalStateException("Selecione outra sessao futura planejada");
        }
        registro.setStatus(StatusSessaoEvento.ADIADO);
        associacoes.flush();
        return associarInterno(destino, registro.getEvento(), null, null);
    }

    public void reordenar(Long campanhaId, Long sessaoId, List<Long> ids) {
        autorizar(campanhaId);
        sessao(campanhaId, sessaoId);
        List<SessaoEvento> registros = registros(sessaoId);
        Set<Long> esperados = registros.stream().map(SessaoEvento::getId).collect(Collectors.toSet());
        if (ids.size() != esperados.size() || !new HashSet<>(ids).equals(esperados)) {
            throw new IllegalArgumentException("Informe todas as associacoes, sem duplicidades");
        }
        registros.forEach(registro -> registro.setOrdem(ids.indexOf(registro.getId())));
    }

    public List<NotaOutput> listarNotas(Long campanhaId, Long sessaoId, String pesquisa, CategoriaNota categoria) {
        autorizar(campanhaId);
        sessao(campanhaId, sessaoId);
        String termo = pesquisa == null ? "" : pesquisa.toLowerCase(Locale.ROOT);
        return notas.findAllBySessaoIdOrderByCriadoEmAscIdAsc(sessaoId).stream()
                .filter(nota -> categoria == null || nota.getCategoria() == categoria)
                .filter(nota -> (Objects.toString(nota.getTitulo(), "") + " " + nota.getConteudo()).toLowerCase(Locale.ROOT).contains(termo))
                .map(this::output).toList();
    }

    public NotaOutput salvarNota(Long campanhaId, Long sessaoId, Long id, NotaInput input) {
        autorizar(campanhaId);
        Sessao sessao = sessao(campanhaId, sessaoId);
        NotaSessao nota = id == null ? new NotaSessao() : notas.findById(id).filter(registro -> registro.getSessao().getId().equals(sessaoId)).orElseThrow(() -> ausente("Anotacao"));
        nota.setSessao(sessao);
        nota.setTitulo(input.titulo());
        nota.setConteudo(input.conteudo());
        nota.setCategoria(input.categoria() == null ? CategoriaNota.OBSERVACAO_GERAL : input.categoria());
        nota.setEvento(input.eventoId() == null ? null : evento(campanhaId, input.eventoId()));
        nota.setParticipantes(validarPersonagens(campanhaId, input.participantes()));
        nota.setNpcs(validarNpcs(campanhaId, input.npcs()));
        return output(notas.saveAndFlush(nota));
    }

    public void excluirNota(Long campanhaId, Long sessaoId, Long id) {
        autorizar(campanhaId);
        sessao(campanhaId, sessaoId);
        NotaSessao nota = notas.findById(id).filter(registro -> registro.getSessao().getId().equals(sessaoId)).orElseThrow(() -> ausente("Anotacao"));
        notas.delete(nota);
    }

    public SessaoOutput encerrar(Long campanhaId, Long sessaoId, EncerramentoInput input) {
        Campanha campanha = autorizar(campanhaId);
        Sessao sessao = sessao(campanhaId, sessaoId);
        if (sessao.getStatus() != StatusSessao.EM_ANDAMENTO) throw new IllegalStateException("Apenas sessoes em andamento podem ser encerradas");
        List<SessaoEvento> pendentes = registros(sessaoId).stream().filter(this::pendente).toList();
        List<DecisaoInput> decisoes = input.decisoes() == null ? List.of() : input.decisoes();
        Set<Long> ids = new HashSet<>();
        for (DecisaoInput decisao : decisoes) {
            if (!ids.add(decisao.associacaoId()) || pendentes.stream().noneMatch(registro -> registro.getId().equals(decisao.associacaoId()))) {
                throw new IllegalArgumentException("Decisao duplicada ou referente a evento nao pendente");
            }
        }
        if (!Boolean.TRUE.equals(input.retornarTodosAoBanco()) && ids.size() != pendentes.size()) throw new IllegalArgumentException("Defina o destino de todos os eventos pendentes");
        for (SessaoEvento registro : pendentes) {
            DecisaoInput decisao = decisoes.stream().filter(item -> item.associacaoId().equals(registro.getId())).findFirst().orElse(null);
            if (decisao == null) { registro.setStatus(StatusSessaoEvento.ADIADO); continue; }
            switch (decisao.destino()) {
                case BANCO -> registro.setStatus(StatusSessaoEvento.ADIADO);
                case DESCARTAR_SESSAO -> registro.setStatus(StatusSessaoEvento.DESCARTADO);
                case DESCARTAR_CAMPANHA -> { registro.setStatus(StatusSessaoEvento.DESCARTADO); registro.getEvento().setStatus(StatusEvento.DESCARTADO); }
                case REALIZADO_FORA_CENA -> {
                    registro.setStatus(StatusSessaoEvento.REALIZADO);
                    registro.setRealizadoEm(Instant.now());
                    registro.getEvento().setStatus(StatusEvento.REALIZADO);
                }
                case TRANSFERIR -> {
                    if (decisao.sessaoDestinoId() == null) throw new IllegalArgumentException("Informe a sessao de destino");
                    transferirInterno(registro, sessao(campanhaId, decisao.sessaoDestinoId()));
                }
                case NOVA_SESSAO -> {
                    if (decisao.novaSessao() == null) throw new IllegalArgumentException("Informe os dados da nova sessao");
                    transferirInterno(registro, criarSessaoInterna(campanha, decisao.novaSessao()));
                }
            }
        }
        sessao.setResumo(input.resumo());
        sessao.setStatus(StatusSessao.CONCLUIDA);
        sessoes.flush();
        return output(sessao);
    }

    private Set<Personagem> validarPersonagens(Long campanhaId, Set<Long> ids) {
        if (ids == null || ids.isEmpty()) return new HashSet<>();
        List<Personagem> encontrados = personagens.findAllById(ids);
        if (encontrados.size() != ids.size() || encontrados.stream().anyMatch(personagem -> !personagem.getCampanhaMembro().getCampanha().getId().equals(campanhaId))) {
            throw new IllegalArgumentException("Personagem nao pertence a campanha");
        }
        return new HashSet<>(encontrados);
    }

    private Set<CampanhaNpc> validarNpcs(Long campanhaId, Set<Long> ids) {
        if (ids == null || ids.isEmpty()) return new HashSet<>();
        List<CampanhaNpc> encontrados = npcs.findAllById(ids);
        if (encontrados.size() != ids.size() || encontrados.stream().anyMatch(npc -> !npc.getCampanha().getId().equals(campanhaId))) {
            throw new IllegalArgumentException("NPC nao pertence a campanha");
        }
        return new HashSet<>(encontrados);
    }

    private Sessao sessao(Long campanhaId, Long id) { return sessoes.findByIdAndCampanhaId(id, campanhaId).orElseThrow(() -> ausente("Sessao")); }
    private Evento evento(Long campanhaId, Long id) { return eventos.findByIdAndCampanhaId(id, campanhaId).orElseThrow(() -> ausente("Evento")); }
    private SessaoEvento registro(Long campanhaId, Long sessaoId, Long id) {
        sessao(campanhaId, sessaoId);
        return associacoes.findById(id).filter(registro -> registro.getSessao().getId().equals(sessaoId)).orElseThrow(() -> ausente("Associacao"));
    }
    private List<SessaoEvento> registros(Long id) { return associacoes.findAllBySessaoIdOrderByOrdemAscIdAsc(id); }
    private boolean pendente(SessaoEvento registro) { return registro.getStatus() == StatusSessaoEvento.PENDENTE; }
    private void exigirPendente(SessaoEvento registro) { if (!pendente(registro)) throw new IllegalStateException("Apenas eventos pendentes podem ser transferidos ou retornados"); }
    private EntityNotFoundException ausente(String recurso) { return new EntityNotFoundException(recurso + " nao encontrado nesta campanha"); }
    private Map<Long, Long> planejamento(Long campanhaId) {
        return associacoes.findAllByEventoCampanhaId(campanhaId).stream().filter(this::pendente)
                .collect(Collectors.toMap(registro -> registro.getEvento().getId(), registro -> registro.getSessao().getId()));
    }
    private Set<Long> idsPersonagens(Set<Personagem> registros) { return registros.stream().map(Personagem::getId).collect(Collectors.toSet()); }
    private Set<Long> idsNpcs(Set<CampanhaNpc> registros) { return registros.stream().map(CampanhaNpc::getId).collect(Collectors.toSet()); }
    private SessaoOutput output(Sessao sessao) { return output(sessao, registros(sessao.getId()), (long) notas.findAllBySessaoIdOrderByCriadoEmAscIdAsc(sessao.getId()).size()); }
    private SessaoOutput output(Sessao sessao, List<SessaoEvento> registros, long quantidadeNotas) {
        return new SessaoOutput(sessao.getId(), sessao.getCampanha().getId(), sessao.getNumero(), sessao.getTitulo(), sessao.getDescricao(), sessao.getStatus(), sessao.getResumo(), sessao.getCriadoEm(), sessao.getAtualizadoEm(), idsPersonagens(sessao.getParticipantes()), idsNpcs(sessao.getNpcs()), registros.size(), registros.stream().filter(registro -> registro.getStatus() == StatusSessaoEvento.REALIZADO).count(), quantidadeNotas);
    }
    private EventoOutput output(Evento evento, Long sessaoPlanejadaId) {
        return new EventoOutput(evento.getId(), evento.getCampanha().getId(), evento.getTitulo(), evento.getDescricao(), evento.getTipo(), evento.getStatus(), evento.getLocal(), evento.getDataNarrativa(), evento.getCondicoes(), evento.getOrientacoes(), evento.getEvidencias(), evento.getConsequencias(), idsPersonagens(evento.getParticipantes()), idsNpcs(evento.getNpcs()), evento.getCriadoEm(), evento.getAtualizadoEm(), sessaoPlanejadaId);
    }
    private AssociacaoOutput output(SessaoEvento registro, Long planejadaId) {
        return new AssociacaoOutput(registro.getId(), registro.getSessao().getId(), output(registro.getEvento(), planejadaId), registro.getOrdem(), registro.getStatus(), registro.getObservacoes(), registro.getResultado(), registro.getConsequencias(), registro.getEvidencias(), registro.getRealizadoEm());
    }
    private NotaOutput output(NotaSessao nota) {
        return new NotaOutput(nota.getId(), nota.getSessao().getId(), nota.getTitulo(), nota.getConteudo(), nota.getCategoria(), idsPersonagens(nota.getParticipantes()), idsNpcs(nota.getNpcs()), nota.getEvento() == null ? null : nota.getEvento().getId(), nota.getCriadoEm(), nota.getAtualizadoEm());
    }
}
