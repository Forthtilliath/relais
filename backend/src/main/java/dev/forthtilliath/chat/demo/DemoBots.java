package dev.forthtilliath.chat.demo;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBooleanProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

import dev.forthtilliath.chat.message.MessagePostedEvent;
import dev.forthtilliath.chat.message.MessageService;
import dev.forthtilliath.chat.message.MessageView;
import dev.forthtilliath.chat.presence.PresenceTracker;
import dev.forthtilliath.chat.room.RoomService;
import dev.forthtilliath.chat.user.ChatUserRepository;
import dev.forthtilliath.chat.user.UserCreatedEvent;
import dev.forthtilliath.chat.user.UserRef;

/**
 * Fait vivre la démo quand on la visite seul : les bots (créés par la migration V2) sont toujours en ligne,
 * accueillent chaque nouvel indicatif et répondent à leurs mentions après un « … écrit » réaliste.
 * Désactivable avec {@code relais.demo-bots=false}.
 */
@Component
@ConditionalOnBooleanProperty(name = "relais.demo-bots", matchIfMissing = true)
public class DemoBots {

	private static final Logger log = LoggerFactory.getLogger(DemoBots.class);
	private static final long WELCOME_DELAY_MS = 2_500;

	private final ChatUserRepository users;
	private final RoomService rooms;
	private final MessageService messages;
	private final PresenceTracker presence;
	private final Map<UUID, UserRef> bots = new ConcurrentHashMap<>();

	public DemoBots(ChatUserRepository users, RoomService rooms, MessageService messages, PresenceTracker presence) {
		this.users = users;
		this.rooms = rooms;
		this.messages = messages;
		this.presence = presence;
	}

	@EventListener(ApplicationReadyEvent.class)
	public void wakeUp() {
		users.findByBotTrue().forEach(bot -> {
			bots.put(bot.getId(), UserRef.of(bot));
			presence.pin(bot.getId());
		});
		log.info("Bots de démonstration à l'antenne : {}", bots.values().stream().map(UserRef::nickname).toList());
	}

	@TransactionalEventListener(fallbackExecution = true)
	public void onMessage(MessagePostedEvent event) {
		MessageView message = event.message();
		if (message.author().bot()) {
			return;
		}
		List<UserRef> mentioned = event.mentionedIds().stream().map(bots::get).filter(Objects::nonNull).toList();
		for (int rank = 0; rank < mentioned.size(); rank++) {
			reply(mentioned.get(rank), message, rank);
		}
	}

	@TransactionalEventListener(fallbackExecution = true)
	public void onNewcomer(UserCreatedEvent event) {
		UserRef host = bots.values().stream().min(Comparator.comparing(UserRef::nickname)).orElse(null);
		if (host == null) {
			return;
		}
		List<String> names = bots.values().stream().map(UserRef::nickname).sorted().toList();
		rooms.findByName(RoomService.DEFAULT_ROOM).ifPresent(general -> later(WELCOME_DELAY_MS,
				() -> messages.post(host.id(), general.getId(), BotLines.welcome(event.user().nickname(), names), null)));
	}

	/** Les bots mentionnés ensemble répondent l'un après l'autre, pas en chœur. */
	private void reply(UserRef bot, MessageView to, int rank) {
		ThreadLocalRandom random = ThreadLocalRandom.current();
		long typingAt = 500 + rank * 2_500L + random.nextLong(400);
		long replyAt = typingAt + 1_400 + random.nextLong(900);
		later(typingAt, () -> {
			rooms.ensureMember(to.roomId(), bot);
			messages.typing(bot, to.roomId());
		});
		later(replyAt, () -> messages.post(bot.id(), to.roomId(),
				BotLines.reply(bot.nickname(), to.author().nickname(), to.content()), null));
	}

	private static void later(long delayMs, Runnable task) {
		CompletableFuture.runAsync(() -> {
			try {
				task.run();
			} catch (RuntimeException ex) {
				log.warn("Action de bot abandonnée : {}", ex.getMessage());
			}
		}, CompletableFuture.delayedExecutor(delayMs, TimeUnit.MILLISECONDS));
	}
}
