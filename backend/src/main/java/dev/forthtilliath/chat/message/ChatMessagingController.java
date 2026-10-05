package dev.forthtilliath.chat.message;

import java.util.UUID;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import dev.forthtilliath.chat.common.ApiException;
import dev.forthtilliath.chat.realtime.ChatPrincipal;

/** Trames STOMP envoyées par le client sur {@code /app/…}. */
@Controller
public class ChatMessagingController {

	private static final int MAX_CLIENT_ID = 64;

	private final MessageService messages;

	public ChatMessagingController(MessageService messages) {
		this.messages = messages;
	}

	@MessageMapping("/rooms/{roomId}/messages")
	public void send(@DestinationVariable UUID roomId, @Payload OutgoingMessage payload, ChatPrincipal principal) {
		String clientId = payload.clientId() != null && payload.clientId().length() <= MAX_CLIENT_ID
				? payload.clientId()
				: null;
		try {
			messages.post(principal.user().id(), roomId, payload.content(), clientId);
		} catch (ApiException ex) {
			throw new MessageRejectedException(ex, clientId);
		}
	}

	@MessageMapping("/rooms/{roomId}/typing")
	public void typing(@DestinationVariable UUID roomId, ChatPrincipal principal) {
		messages.typing(principal.user(), roomId);
	}

	/** Corps d'un SEND : le texte et l'identifiant provisoire choisi par le client. */
	public record OutgoingMessage(String content, String clientId) {
	}
}
