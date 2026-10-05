package dev.forthtilliath.chat;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.util.UUID;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;

/**
 * Contexte complet sur un port aléatoire (WebSocket réel) avec H2 : une seule configuration pour que Spring
 * réutilise le même contexte entre les classes de test. La base est partagée : chaque test prend ses propres
 * indicatifs.
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
public @interface IntegrationTest {

	/** Canaux créés par la migration V2. */
	UUID GENERAL = UUID.fromString("c0000000-0000-4000-8000-000000000001");
	UUID ANGULAR = UUID.fromString("c0000000-0000-4000-8000-000000000002");
}
