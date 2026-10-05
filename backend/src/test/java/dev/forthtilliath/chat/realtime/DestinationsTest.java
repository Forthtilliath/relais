package dev.forthtilliath.chat.realtime;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class DestinationsTest {

	@Test
	void clientsOnlySendToApplicationControllers() {
		assertThat(Destinations.canSend("/app/rooms/42/messages")).isTrue();
		assertThat(Destinations.canSend("/topic/rooms/42")).isFalse();
		assertThat(Destinations.canSend("/user/queue/mentions")).isFalse();
		assertThat(Destinations.canSend(null)).isFalse();
	}

	@Test
	void clientsSubscribeToTopicsTheirOwnQueuesAndThePresenceSnapshot() {
		assertThat(Destinations.canSubscribe("/topic/rooms/42")).isTrue();
		assertThat(Destinations.canSubscribe("/user/queue/mentions")).isTrue();
		assertThat(Destinations.canSubscribe("/app/presence")).isTrue();

		assertThat(Destinations.canSubscribe("/queue/mentions-usera1b2c3")).isFalse();
		assertThat(Destinations.canSubscribe("/app/rooms/42/messages")).isFalse();
	}
}
