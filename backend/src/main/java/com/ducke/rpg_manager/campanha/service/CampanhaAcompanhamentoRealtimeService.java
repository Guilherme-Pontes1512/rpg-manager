package com.ducke.rpg_manager.campanha.service;

import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class CampanhaAcompanhamentoRealtimeService {

    private static final long TIMEOUT_MS = 30 * 60 * 1000L;

    private final Map<Long, List<SseEmitter>> emittersPorCampanha = new ConcurrentHashMap<>();

    public SseEmitter conectar(Long campanhaId) {
        SseEmitter emitter = new SseEmitter(TIMEOUT_MS);
        emittersPorCampanha.computeIfAbsent(campanhaId, ignored -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> remover(campanhaId, emitter));
        emitter.onTimeout(() -> remover(campanhaId, emitter));
        emitter.onError(ignored -> remover(campanhaId, emitter));

        enviar(emitter, "connected", campanhaId);
        return emitter;
    }

    public void notificarFichaAtualizada(Long campanhaId) {
        List<SseEmitter> emitters = emittersPorCampanha.get(campanhaId);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }

        emitters.forEach(emitter -> enviar(emitter, "character-sheet-updated", campanhaId));
    }

    private void enviar(SseEmitter emitter, String eventName, Long campanhaId) {
        try {
            emitter.send(SseEmitter.event()
                    .name(eventName)
                    .data(Map.of("campanhaId", campanhaId)));
        } catch (IOException | IllegalStateException ex) {
            emitter.completeWithError(ex);
        }
    }

    private void remover(Long campanhaId, SseEmitter emitter) {
        List<SseEmitter> emitters = emittersPorCampanha.get(campanhaId);
        if (emitters == null) {
            return;
        }

        emitters.remove(emitter);
        if (emitters.isEmpty()) {
            emittersPorCampanha.remove(campanhaId);
        }
    }
}
