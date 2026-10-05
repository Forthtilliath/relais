package dev.forthtilliath.chat.realtime;

import org.springframework.messaging.Message;
import org.springframework.web.socket.messaging.StompSubProtocolErrorHandler;

import dev.forthtilliath.chat.common.ApiException;

/**
 * Trame ERROR (CONNECT refusé, destination interdite) : par défaut Spring y met le message générique du canal
 * ({@code Failed to send message to …}). On remonte la cause métier pour que le client affiche le vrai motif.
 */
public class StompErrorHandler extends StompSubProtocolErrorHandler {

	@Override
	public Message<byte[]> handleClientMessageProcessingError(Message<byte[]> clientMessage, Throwable ex) {
		Throwable cause = ex;
		while (cause != null && !(cause instanceof ApiException)) {
			cause = cause.getCause();
		}
		return super.handleClientMessageProcessingError(clientMessage, cause != null ? cause : ex);
	}
}
