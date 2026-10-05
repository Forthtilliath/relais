package dev.forthtilliath.chat.presence;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

/**
 * Qui est en ligne, en mémoire. Une personne peut ouvrir plusieurs onglets (sessions STOMP) : elle n'apparaît
 * qu'à la première session et ne disparaît qu'à la fermeture de la dernière. Les bots sont épinglés en ligne.
 */
@Component
public class PresenceTracker {

	private final Map<UUID, Set<String>> sessions = new ConcurrentHashMap<>();
	private final Set<UUID> pinned = ConcurrentHashMap.newKeySet();

	/** @return {@code true} si l'utilisateur vient d'apparaître (premier onglet, hors épinglés) */
	public boolean connect(UUID userId, String sessionId) {
		boolean[] first = { false };
		sessions.compute(userId, (id, current) -> {
			Set<String> set = current == null ? new HashSet<>() : current;
			first[0] = set.isEmpty();
			set.add(sessionId);
			return set;
		});
		return first[0] && !pinned.contains(userId);
	}

	/** @return {@code true} si l'utilisateur vient de disparaître (dernier onglet fermé, hors épinglés) */
	public boolean disconnect(UUID userId, String sessionId) {
		boolean[] last = { false };
		sessions.computeIfPresent(userId, (id, set) -> {
			if (set.remove(sessionId) && set.isEmpty()) {
				last[0] = true;
				return null;
			}
			return set;
		});
		return last[0] && !pinned.contains(userId);
	}

	public void pin(UUID userId) {
		pinned.add(userId);
	}

	public boolean isOnline(UUID userId) {
		return pinned.contains(userId) || sessions.containsKey(userId);
	}

	public Set<UUID> onlineIds() {
		Set<UUID> ids = new HashSet<>(sessions.keySet());
		ids.addAll(pinned);
		return ids;
	}
}
