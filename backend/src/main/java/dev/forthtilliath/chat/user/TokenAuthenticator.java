package dev.forthtilliath.chat.user;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import dev.forthtilliath.chat.common.ApiException;

/**
 * Résout un jeton en utilisateur. Volontairement isolé (dépend du seul dépôt) : il est utilisé par
 * l'intercepteur STOMP, qui ne doit pas tirer toute la couche service dans la configuration WebSocket.
 */
@Component
public class TokenAuthenticator {

	private final ChatUserRepository users;

	public TokenAuthenticator(ChatUserRepository users) {
		this.users = users;
	}

	@Transactional(readOnly = true)
	public ChatUser authenticate(String token) {
		if (token == null) {
			throw ApiException.unauthorized("Connexion requise.");
		}
		return users.findByTokenHash(Tokens.hash(token))
				.orElseThrow(() -> ApiException.unauthorized("Session expirée : reconnectez-vous."));
	}
}
