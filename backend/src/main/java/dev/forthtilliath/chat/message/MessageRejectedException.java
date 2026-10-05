package dev.forthtilliath.chat.message;

import dev.forthtilliath.chat.common.ApiException;

/** Refus d'un envoi STOMP, avec l'identifiant provisoire du message pour que le client le marque en échec. */
public class MessageRejectedException extends RuntimeException {

	private final ApiException reason;
	private final String clientId;

	public MessageRejectedException(ApiException reason, String clientId) {
		super(reason.getMessage(), reason);
		this.reason = reason;
		this.clientId = clientId;
	}

	public ApiException getReason() {
		return reason;
	}

	public String getClientId() {
		return clientId;
	}
}
