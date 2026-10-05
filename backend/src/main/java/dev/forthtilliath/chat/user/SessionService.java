package dev.forthtilliath.chat.user;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.forthtilliath.chat.common.ApiException;
import dev.forthtilliath.chat.presence.PresenceTracker;
import dev.forthtilliath.chat.room.RoomService;
import dev.forthtilliath.chat.user.dto.SessionRequest;
import dev.forthtilliath.chat.user.dto.SessionResponse;

/** Prise d'antenne (connexion invitée), reprise de session et déconnexion. */
@Service
@Transactional
public class SessionService {

	private final ChatUserRepository users;
	private final RoomService rooms;
	private final PresenceTracker presence;
	private final ApplicationEventPublisher events;

	public SessionService(ChatUserRepository users, RoomService rooms, PresenceTracker presence,
			ApplicationEventPublisher events) {
		this.users = users;
		this.rooms = rooms;
		this.presence = presence;
		this.events = events;
	}

	/**
	 * Ouvre une session pour un indicatif. Trois cas : indicatif libre (création), indicatif libéré par une
	 * déconnexion (reprise par n'importe qui), indicatif actif (reprise seulement avec son propre jeton).
	 */
	public SessionResponse open(SessionRequest request, String currentToken) {
		String nickname = request.nickname().strip();
		ChatUser user = users.findByNicknameKey(Nicknames.key(nickname)).orElse(null);
		String token = Tokens.generate();
		boolean created = user == null;

		if (created) {
			user = users.save(new ChatUser(nickname, request.color()));
			rooms.joinDefaults(UserRef.of(user));
		} else if (user.isBot()) {
			throw ApiException.conflict("Cet indicatif est réservé à un bot de démonstration.");
		} else if (user.getTokenHash() != null) {
			if (currentToken == null || !user.getTokenHash().equals(Tokens.hash(currentToken))) {
				throw ApiException.conflict("Cet indicatif est déjà à l'antenne. Choisissez-en un autre.");
			}
			token = currentToken;
		}

		user.rename(nickname);
		user.setColor(request.color());
		user.issueToken(Tokens.hash(token));
		if (created) {
			events.publishEvent(new UserCreatedEvent(UserRef.of(user)));
		}
		return new SessionResponse(token, UserView.of(user, presence.isOnline(user.getId())));
	}

	@Transactional(readOnly = true)
	public UserView me(ChatUser user) {
		return UserView.of(user, presence.isOnline(user.getId()));
	}

	/** Libère l'indicatif : le jeton est révoqué, le pseudo redevient disponible. */
	public void close(ChatUser user) {
		users.findById(user.getId()).ifPresent(ChatUser::revokeToken);
	}
}
