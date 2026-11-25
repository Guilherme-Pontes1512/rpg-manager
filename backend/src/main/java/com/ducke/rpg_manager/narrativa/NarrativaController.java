package com.ducke.rpg_manager.narrativa;

import com.ducke.rpg_manager.narrativa.dtos.NarrativaDtos.*;
import com.ducke.rpg_manager.narrativa.entidade.CategoriaNota;
import com.ducke.rpg_manager.narrativa.entidade.StatusSessao;
import com.ducke.rpg_manager.narrativa.entidade.StatusEvento;
import com.ducke.rpg_manager.narrativa.entidade.TipoEvento;
import com.ducke.rpg_manager.narrativa.service.NarrativaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/campanhas/{campanhaId}/narrativa")
@RequiredArgsConstructor
public class NarrativaController {
    private final NarrativaService service;

    @GetMapping("/sessoes")
    public List<SessaoOutput> sessoes(@PathVariable Long campanhaId,
            @RequestParam(defaultValue = "") String busca, @RequestParam(required = false) StatusSessao status) {
        String termo = busca.toLowerCase(java.util.Locale.ROOT);
        return service.listarSessoes(campanhaId).stream()
                .filter(sessao -> status == null || sessao.status() == status)
                .filter(sessao -> (java.util.Objects.toString(sessao.numero(), "") + " "
                        + (sessao.titulo() == null || sessao.titulo().isBlank() ? "Sessão sem título" : sessao.titulo()))
                        .toLowerCase(java.util.Locale.ROOT).contains(termo)).toList();
    }
    @PostMapping("/sessoes") @ResponseStatus(HttpStatus.CREATED)
    public SessaoOutput criarSessao(@PathVariable Long campanhaId, @Valid @RequestBody SessaoInput input) { return service.criarSessao(campanhaId, input); }
    @GetMapping("/sessoes/{id}")
    public SessaoOutput sessao(@PathVariable Long campanhaId, @PathVariable Long id) { return service.obterSessao(campanhaId, id); }
    @PutMapping("/sessoes/{id}")
    public SessaoOutput editarSessao(@PathVariable Long campanhaId, @PathVariable Long id, @Valid @RequestBody SessaoInput input) { return service.editarSessao(campanhaId, id, input); }
    @DeleteMapping("/sessoes/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluirSessao(@PathVariable Long campanhaId, @PathVariable Long id) { service.excluirSessao(campanhaId, id); }
    @PostMapping("/sessoes/{id}/iniciar")
    public SessaoOutput iniciar(@PathVariable Long campanhaId, @PathVariable Long id) { return service.iniciar(campanhaId, id); }
    @PostMapping("/sessoes/{id}/cancelar")
    public SessaoOutput cancelar(@PathVariable Long campanhaId, @PathVariable Long id) { return service.cancelar(campanhaId, id); }
    @PostMapping("/sessoes/{id}/encerrar")
    public SessaoOutput encerrar(@PathVariable Long campanhaId, @PathVariable Long id, @Valid @RequestBody EncerramentoInput input) { return service.encerrar(campanhaId, id, input); }
    @GetMapping("/eventos")
    public List<EventoOutput> eventos(@PathVariable Long campanhaId, @RequestParam(defaultValue = "") String busca,
            @RequestParam(required = false) StatusEvento status, @RequestParam(required = false) TipoEvento tipo,
            @RequestParam(required = false) Long npcId, @RequestParam(required = false) Long sessaoId,
            @RequestParam(defaultValue = "false") boolean semSessao) {
        String termo = busca.toLowerCase(java.util.Locale.ROOT);
        return service.listarEventos(campanhaId).stream()
                .filter(evento -> evento.titulo().toLowerCase(java.util.Locale.ROOT).contains(termo))
                .filter(evento -> status == null || evento.status() == status)
                .filter(evento -> tipo == null || evento.tipo() == tipo)
                .filter(evento -> npcId == null || evento.npcs().contains(npcId))
                .filter(evento -> sessaoId == null || sessaoId.equals(evento.sessaoPlanejadaId()))
                .filter(evento -> !semSessao || evento.sessaoPlanejadaId() == null).toList();
    }
    @PostMapping("/eventos") @ResponseStatus(HttpStatus.CREATED)
    public EventoOutput criarEvento(@PathVariable Long campanhaId, @Valid @RequestBody EventoInput input) { return service.criarEvento(campanhaId, input); }
    @GetMapping("/eventos/{id}")
    public EventoOutput evento(@PathVariable Long campanhaId, @PathVariable Long id) { return service.obterEvento(campanhaId, id); }
    @PutMapping("/eventos/{id}")
    public EventoOutput editarEvento(@PathVariable Long campanhaId, @PathVariable Long id, @Valid @RequestBody EventoInput input) { return service.editarEvento(campanhaId, id, input); }
    @DeleteMapping("/eventos/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluirEvento(@PathVariable Long campanhaId, @PathVariable Long id) { service.excluirEvento(campanhaId, id); }
    @GetMapping("/sessoes/{sessaoId}/eventos")
    public List<AssociacaoOutput> associacoes(@PathVariable Long campanhaId, @PathVariable Long sessaoId) { return service.listarAssociacoes(campanhaId, sessaoId); }
    @PostMapping("/sessoes/{sessaoId}/eventos") @ResponseStatus(HttpStatus.CREATED)
    public AssociacaoOutput associar(@PathVariable Long campanhaId, @PathVariable Long sessaoId, @Valid @RequestBody AssociacaoInput input) { return service.associar(campanhaId, sessaoId, input); }
    @PostMapping("/sessoes/{sessaoId}/eventos/novo") @ResponseStatus(HttpStatus.CREATED)
    public AssociacaoOutput criarNaSessao(@PathVariable Long campanhaId, @PathVariable Long sessaoId, @Valid @RequestBody EventoInput input) { return service.criarNaSessao(campanhaId, sessaoId, input); }
    @PutMapping("/sessoes/{sessaoId}/eventos/ordem") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void ordenar(@PathVariable Long campanhaId, @PathVariable Long sessaoId, @Valid @RequestBody OrdemInput input) { service.reordenar(campanhaId, sessaoId, input.ids()); }
    @PutMapping("/sessoes/{sessaoId}/eventos/{id}")
    public AssociacaoOutput registrar(@PathVariable Long campanhaId, @PathVariable Long sessaoId, @PathVariable Long id, @Valid @RequestBody RegistroInput input) { return service.registrar(campanhaId, sessaoId, id, input); }
    @DeleteMapping("/sessoes/{sessaoId}/eventos/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remover(@PathVariable Long campanhaId, @PathVariable Long sessaoId, @PathVariable Long id) { service.removerAssociacao(campanhaId, sessaoId, id); }
    @PostMapping("/sessoes/{sessaoId}/eventos/{id}/transferir")
    public AssociacaoOutput transferir(@PathVariable Long campanhaId, @PathVariable Long sessaoId, @PathVariable Long id, @Valid @RequestBody TransferenciaInput input) { return service.transferir(campanhaId, sessaoId, id, input.sessaoDestinoId()); }
    @PostMapping("/sessoes/{sessaoId}/eventos/{id}/banco") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void banco(@PathVariable Long campanhaId, @PathVariable Long sessaoId, @PathVariable Long id) { service.retornarBanco(campanhaId, sessaoId, id); }
    @GetMapping("/sessoes/{sessaoId}/notas")
    public List<NotaOutput> notas(@PathVariable Long campanhaId, @PathVariable Long sessaoId, @RequestParam(required = false) String pesquisa, @RequestParam(required = false) String busca, @RequestParam(required = false) CategoriaNota categoria) { return service.listarNotas(campanhaId, sessaoId, pesquisa == null ? busca : pesquisa, categoria); }
    @PostMapping("/sessoes/{sessaoId}/notas") @ResponseStatus(HttpStatus.CREATED)
    public NotaOutput criarNota(@PathVariable Long campanhaId, @PathVariable Long sessaoId, @Valid @RequestBody NotaInput input) { return service.salvarNota(campanhaId, sessaoId, null, input); }
    @PutMapping("/sessoes/{sessaoId}/notas/{id}")
    public NotaOutput editarNota(@PathVariable Long campanhaId, @PathVariable Long sessaoId, @PathVariable Long id, @Valid @RequestBody NotaInput input) { return service.salvarNota(campanhaId, sessaoId, id, input); }
    @DeleteMapping("/sessoes/{sessaoId}/notas/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluirNota(@PathVariable Long campanhaId, @PathVariable Long sessaoId, @PathVariable Long id) { service.excluirNota(campanhaId, sessaoId, id); }
}
