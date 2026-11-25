package com.ducke.rpg_manager;

import com.ducke.rpg_manager.campanha.entidade.Campanha;
import com.ducke.rpg_manager.common.SistemaEnum;
import com.ducke.rpg_manager.narrativa.repository.CampanhaNarrativaRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(properties = {
        "app.email.enabled=false",
        "spring.profiles.active=dev,h2",
        "spring.datasource.url=jdbc:h2:mem:narrativa-lock-test;DB_CLOSE_DELAY=-1;LOCK_TIMEOUT=10000"
})
class CampanhaNarrativaLockTests {
    @Autowired private CampanhaNarrativaRepository campanhas;
    @Autowired private PlatformTransactionManager transactionManager;

    @Test
    void deveBloquearSegundaTransacaoAtePrimeiraLiberarCampanha() throws Exception {
        TransactionTemplate transacao = new TransactionTemplate(transactionManager);
        Long campanhaId = transacao.execute(status -> campanhas.saveAndFlush(
                new Campanha(null, "Campanha ficticia do teste de bloqueio", null, SistemaEnum.COC, null)).getId());
        CountDownLatch primeiroBloqueio = new CountDownLatch(1);
        CountDownLatch segundaTentativa = new CountDownLatch(1);
        CountDownLatch liberarPrimeira = new CountDownLatch(1);
        var executor = Executors.newFixedThreadPool(2);
        try {
            var primeira = executor.submit(() -> transacao.execute(status -> {
                Campanha campanha = campanhas.lockById(campanhaId).orElseThrow();
                primeiroBloqueio.countDown();
                try {
                    assertTrue(liberarPrimeira.await(10, TimeUnit.SECONDS));
                } catch (InterruptedException exception) {
                    Thread.currentThread().interrupt();
                    throw new IllegalStateException(exception);
                }
                return campanha.getId();
            }));
            assertTrue(primeiroBloqueio.await(5, TimeUnit.SECONDS));
            var segunda = executor.submit(() -> transacao.execute(status -> {
                segundaTentativa.countDown();
                Campanha campanha = campanhas.lockById(campanhaId).orElseThrow();
                assertEquals("Campanha ficticia do teste de bloqueio", campanha.getNome());
                return campanha.getId();
            }));
            assertTrue(segundaTentativa.await(5, TimeUnit.SECONDS));
            assertThrows(TimeoutException.class, () -> segunda.get(300, TimeUnit.MILLISECONDS));
            liberarPrimeira.countDown();
            assertEquals(campanhaId, primeira.get(5, TimeUnit.SECONDS));
            assertEquals(campanhaId, segunda.get(5, TimeUnit.SECONDS));
        } finally {
            liberarPrimeira.countDown();
            executor.shutdownNow();
            assertTrue(executor.awaitTermination(5, TimeUnit.SECONDS));
            transacao.executeWithoutResult(status -> campanhas.deleteById(campanhaId));
        }
    }
}
