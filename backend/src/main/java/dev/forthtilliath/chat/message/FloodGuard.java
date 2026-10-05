package dev.forthtilliath.chat.message;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

/** Fenêtre glissante par utilisateur : au plus {@value #MAX_MESSAGES} messages toutes les 5 secondes. */
@Component
public class FloodGuard {

	static final int MAX_MESSAGES = 5;
	static final Duration WINDOW = Duration.ofSeconds(5);

	private final Clock clock;
	private final Map<UUID, Deque<Instant>> recent = new ConcurrentHashMap<>();

	public FloodGuard() {
		this(Clock.systemUTC());
	}

	FloodGuard(Clock clock) {
		this.clock = clock;
	}

	public boolean tryAcquire(UUID userId) {
		Instant now = clock.instant();
		Instant windowStart = now.minus(WINDOW);
		boolean[] allowed = { false };
		recent.compute(userId, (id, stamps) -> {
			Deque<Instant> queue = stamps == null ? new ArrayDeque<>() : stamps;
			while (!queue.isEmpty() && !queue.peekFirst().isAfter(windowStart)) {
				queue.pollFirst();
			}
			if (queue.size() < MAX_MESSAGES) {
				queue.addLast(now);
				allowed[0] = true;
			}
			return queue;
		});
		return allowed[0];
	}
}
