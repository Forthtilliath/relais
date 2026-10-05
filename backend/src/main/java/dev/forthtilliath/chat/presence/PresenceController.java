package dev.forthtilliath.chat.presence;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.annotation.SubscribeMapping;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import dev.forthtilliath.chat.realtime.ChatPrincipal;
import dev.forthtilliath.chat.realtime.Topics;
import dev.forthtilliath.chat.user.ChatUserRepository;
import dev.forthtilliath.chat.user.UserRef;
import dev.forthtilliath.chat.user.UserView;

/**
 * Relie le cycle de vie des sessions STOMP au {@link PresenceTracker} et diffuse arrivées et départs.
 * Le client s'abonne d'abord à {@code /topic/presence}, puis à {@code /app/presence} pour l'instantané.
 */
@Controller
public class PresenceController {

	private final PresenceTracker tracker;
	private final ChatUserRepository users;
	private final SimpMessageSendingOperations broker;

	public PresenceController(PresenceTracker tracker, ChatUserRepository users, SimpMessageSendingOperations broker) {
		this.tracker = tracker;
		this.users = users;
		this.broker = broker;
	}

	/** Réponse directe à l'abonnement (sans passer par le broker) : qui est en ligne maintenant. */
	@SubscribeMapping("/presence")
	@Transactional(readOnly = true)
	public List<UserView> online() {
		return users.findAllById(tracker.onlineIds()).stream()
				.map(user -> UserView.of(user, true))
				.sorted(UserView.PRESENCE_ORDER)
				.toList();
	}

	@EventListener
	public void connected(SessionConnectedEvent event) {
		if (event.getUser() instanceof ChatPrincipal principal) {
			String sessionId = SimpMessageHeaderAccessor.getSessionId(event.getMessage().getHeaders());
			UserRef user = principal.user();
			if (tracker.connect(user.id(), sessionId)) {
				broker.convertAndSend(Topics.PRESENCE, new PresenceEvent(UserView.of(user, true, null)));
			}
		}
	}

	@EventListener
	@Transactional
	public void disconnected(SessionDisconnectEvent event) {
		if (event.getUser() instanceof ChatPrincipal principal) {
			UUID userId = principal.user().id();
			if (tracker.disconnect(userId, event.getSessionId())) {
				Instant now = Instant.now();
				users.touchLastSeen(userId, now);
				broker.convertAndSend(Topics.PRESENCE, new PresenceEvent(UserView.of(principal.user(), false, now)));
			}
		}
	}
}
