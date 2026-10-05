package dev.forthtilliath.chat.common;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * Réglages propres à Relais ({@code relais.*}).
 *
 * @param allowedOrigins origines autorisées à ouvrir le WebSocket (motifs Spring, ex. {@code http://localhost:*})
 * @param demoBots       active les bots de démonstration qui répondent aux mentions
 */
@ConfigurationProperties("relais")
public record RelaisProperties(
		@DefaultValue("http://localhost:*") List<String> allowedOrigins,
		@DefaultValue("true") boolean demoBots) {
}
