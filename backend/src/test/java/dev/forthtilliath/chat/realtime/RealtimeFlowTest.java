package dev.forthtilliath.chat.realtime;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Type;
import java.net.URI;
import java.util.Map;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.messaging.converter.JacksonJsonMessageConverter;
import org.springframework.messaging.simp.stomp.StompFrameHandler;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

import dev.forthtilliath.chat.IntegrationTest;
import dev.forthtilliath.chat.user.LampColor;
import dev.forthtilliath.chat.user.SessionService;
import dev.forthtilliath.chat.user.dto.SessionRequest;
import dev.forthtilliath.chat.user.dto.SessionResponse;

/** Bout en bout : vrais clients STOMP sur le WebSocket du serveur démarré sur un port aléatoire. */
@IntegrationTest
class RealtimeFlowTest {

	private static final long TIMEOUT_S = 5;

	@LocalServerPort
	private int port;

	@Autowired
	private SessionService sessions;

	private final WebSocketStompClient client = stompClient();

	@AfterEach
	void tearDown() {
		client.stop();
	}

	@Test
	void broadcastsMessagesToTheRoomAndNotifiesMentionedUsers() throws Exception {
		SessionResponse alice = sessions.open(new SessionRequest("ws-alice", LampColor.AZUR), null);
		SessionResponse bob = sessions.open(new SessionRequest("ws-bob", LampColor.CORAIL), null);
		StompSession aliceStomp = connect(alice.token());
		StompSession bobStomp = connect(bob.token());

		BlockingQueue<Map<String, Object>> roomEvents = subscribe(bobStomp, Topics.room(IntegrationTest.GENERAL));
		BlockingQueue<Map<String, Object>> mentions = subscribe(bobStomp, "/user/queue/mentions");
		awaitSubscriptionsOf(bobStomp, roomEvents);

		aliceStomp.send("/app/rooms/" + IntegrationTest.GENERAL + "/messages",
				Map.of("content", "  Salut @WS-bob !  ", "clientId", "c-1"));

		Map<String, Object> event = next(roomEvents, "message");
		Map<?, ?> message = (Map<?, ?>) event.get("message");
		assertThat(message.get("content")).isEqualTo("Salut @WS-bob !");
		assertThat(message.get("clientId")).isEqualTo("c-1");
		assertThat(((Map<?, ?>) message.get("author")).get("nickname")).isEqualTo("ws-alice");

		Map<String, Object> notice = mentions.poll(TIMEOUT_S, TimeUnit.SECONDS);
		assertThat(notice).isNotNull().containsEntry("roomName", "general");
	}

	@Test
	void rejectsMessagesToRoomsNotJoinedOnTheSenderQueueOnly() throws Exception {
		SessionResponse carol = sessions.open(new SessionRequest("ws-carol", LampColor.MENTHE), null);
		StompSession stomp = connect(carol.token());
		BlockingQueue<Map<String, Object>> errors = subscribe(stomp, "/user/queue/errors");
		BlockingQueue<Map<String, Object>> general = subscribe(stomp, Topics.room(IntegrationTest.GENERAL));
		awaitSubscriptionsOf(stomp, general);

		stomp.send("/app/rooms/" + IntegrationTest.ANGULAR + "/messages", Map.of("content", "Coucou", "clientId", "c-9"));

		Map<String, Object> error = errors.poll(TIMEOUT_S, TimeUnit.SECONDS);
		assertThat(error).isNotNull().containsEntry("status", 403).containsEntry("clientId", "c-9");
		assertThat(stomp.isConnected()).isTrue();
	}

	@Test
	void refusesToConnectWithoutAValidToken() throws Exception {
		CompletableFuture<String> refusal = new CompletableFuture<>();
		StompHeaders headers = new StompHeaders();
		headers.add("Authorization", "Bearer inconnu");
		client.connectAsync(URI.create("ws://localhost:" + port + "/ws"), null, headers, new StompSessionHandlerAdapter() {
			@Override
			public void handleFrame(StompHeaders frameHeaders, Object payload) {
				refusal.complete(frameHeaders.getFirst("message"));
			}
		});

		assertThat(refusal.get(TIMEOUT_S, TimeUnit.SECONDS)).isEqualTo("Session expirée : reconnectez-vous.");
	}

	private StompSession connect(String token) throws Exception {
		StompHeaders headers = new StompHeaders();
		headers.add("Authorization", "Bearer " + token);
		return client.connectAsync(URI.create("ws://localhost:" + port + "/ws"), null, headers,
				new StompSessionHandlerAdapter() {
				}).get(TIMEOUT_S, TimeUnit.SECONDS);
	}

	private static BlockingQueue<Map<String, Object>> subscribe(StompSession session, String destination) {
		BlockingQueue<Map<String, Object>> queue = new LinkedBlockingQueue<>();
		session.subscribe(destination, new StompFrameHandler() {
			@Override
			public Type getPayloadType(StompHeaders headers) {
				return Map.class;
			}

			@Override
			@SuppressWarnings("unchecked")
			public void handleFrame(StompHeaders headers, Object payload) {
				queue.add((Map<String, Object>) payload);
			}
		});
		return queue;
	}

	/**
	 * Les trames d'une même session sont traitées dans l'ordre : quand l'écho de notre propre « … écrit » revient
	 * sur le canal, les abonnements envoyés avant lui sont actifs.
	 */
	private static void awaitSubscriptionsOf(StompSession session, BlockingQueue<Map<String, Object>> generalEvents)
			throws InterruptedException {
		session.send("/app/rooms/" + IntegrationTest.GENERAL + "/typing", Map.of());
		next(generalEvents, "typing");
	}

	private static Map<String, Object> next(BlockingQueue<Map<String, Object>> queue, String type)
			throws InterruptedException {
		long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(TIMEOUT_S);
		while (System.nanoTime() < deadline) {
			Map<String, Object> event = queue.poll(100, TimeUnit.MILLISECONDS);
			if (event != null && type.equals(event.get("type"))) {
				return event;
			}
		}
		throw new AssertionError("Aucun événement « " + type + " » reçu");
	}

	private static WebSocketStompClient stompClient() {
		WebSocketStompClient stomp = new WebSocketStompClient(new StandardWebSocketClient());
		stomp.setMessageConverter(new JacksonJsonMessageConverter());
		return stomp;
	}
}
