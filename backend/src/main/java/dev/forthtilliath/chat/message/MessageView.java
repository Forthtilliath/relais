package dev.forthtilliath.chat.message;

import java.time.Instant;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonInclude;

import dev.forthtilliath.chat.user.UserRef;

/**
 * Message diffusé. {@code clientId} n'est renvoyé qu'à la diffusion qui suit un envoi : l'expéditeur
 * reconnaît ainsi son message affiché en attente (envoi optimiste) et le remplace par la version serveur.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record MessageView(long id, UUID roomId, UserRef author, String content, Instant sentAt, String clientId) {

	public static MessageView of(Message message, String clientId) {
		return new MessageView(message.getId(), message.getRoomId(), UserRef.of(message.getAuthor()),
				message.getContent(), message.getSentAt(), clientId);
	}
}
