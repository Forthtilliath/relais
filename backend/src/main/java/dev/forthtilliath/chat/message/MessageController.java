package dev.forthtilliath.chat.message;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import dev.forthtilliath.chat.user.ChatUser;
import dev.forthtilliath.chat.user.CurrentUser;

/** Historique en REST (pagination par curseur) ; l'envoi passe par STOMP ({@link ChatMessagingController}). */
@RestController
public class MessageController {

	private final MessageService messages;

	public MessageController(MessageService messages) {
		this.messages = messages;
	}

	@GetMapping("/api/rooms/{roomId}/messages")
	public List<MessageView> history(@CurrentUser ChatUser user, @PathVariable UUID roomId,
			@RequestParam(required = false) Long before,
			@RequestParam(defaultValue = "" + MessageService.PAGE_SIZE) int limit) {
		return messages.history(roomId, before, limit);
	}
}
