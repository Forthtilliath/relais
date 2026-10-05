package dev.forthtilliath.chat.realtime;

import org.springframework.http.HttpHeaders;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import dev.forthtilliath.chat.common.ApiException;
import dev.forthtilliath.chat.user.TokenAuthenticator;
import dev.forthtilliath.chat.user.Tokens;
import dev.forthtilliath.chat.user.UserRef;

/**
 * Authentifie la trame CONNECT avec le jeton {@code Authorization: Bearer …} (les navigateurs ne permettent
 * pas d'en-tête sur la poignée de main WebSocket), puis filtre chaque SEND / SUBSCRIBE.
 */
@Component
public class StompAuthInterceptor implements ChannelInterceptor {

	private final TokenAuthenticator authenticator;

	public StompAuthInterceptor(TokenAuthenticator authenticator) {
		this.authenticator = authenticator;
	}

	@Override
	public Message<?> preSend(Message<?> message, MessageChannel channel) {
		StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
		if (accessor == null || accessor.getCommand() == null) {
			return message;
		}
		StompCommand command = accessor.getCommand();
		if (command == StompCommand.CONNECT) {
			String token = Tokens.fromBearer(accessor.getFirstNativeHeader(HttpHeaders.AUTHORIZATION));
			accessor.setUser(new ChatPrincipal(UserRef.of(authenticator.authenticate(token))));
		} else if (command == StompCommand.SEND) {
			require(accessor, Destinations.canSend(accessor.getDestination()));
		} else if (command == StompCommand.SUBSCRIBE) {
			require(accessor, Destinations.canSubscribe(accessor.getDestination()));
		}
		return message;
	}

	private static void require(StompHeaderAccessor accessor, boolean allowed) {
		if (accessor.getUser() == null) {
			throw ApiException.unauthorized("Connexion requise.");
		}
		if (!allowed) {
			throw ApiException.forbidden("Destination interdite : " + accessor.getDestination());
		}
	}
}
