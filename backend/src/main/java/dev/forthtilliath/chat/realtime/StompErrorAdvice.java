package dev.forthtilliath.chat.realtime;

import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.web.bind.annotation.ControllerAdvice;

import com.fasterxml.jackson.annotation.JsonInclude;

import dev.forthtilliath.chat.common.ApiException;
import dev.forthtilliath.chat.message.MessageRejectedException;

/**
 * Erreurs des {@code @MessageMapping} renvoyées à la seule session fautive ({@code /user/queue/errors}),
 * plutôt qu'une trame ERROR qui couperait la connexion.
 */
@ControllerAdvice
public class StompErrorAdvice {

	@MessageExceptionHandler
	@SendToUser(destinations = Topics.USER_ERRORS, broadcast = false)
	public ChatError rejected(MessageRejectedException ex) {
		return new ChatError(ex.getReason().getStatus().value(), ex.getMessage(), ex.getClientId());
	}

	@MessageExceptionHandler
	@SendToUser(destinations = Topics.USER_ERRORS, broadcast = false)
	public ChatError api(ApiException ex) {
		return new ChatError(ex.getStatus().value(), ex.getMessage(), null);
	}

	@JsonInclude(JsonInclude.Include.NON_NULL)
	public record ChatError(int status, String detail, String clientId) {
	}
}
