package dev.forthtilliath.chat.presence;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;

import org.junit.jupiter.api.Test;

class PresenceTrackerTest {

	private final PresenceTracker tracker = new PresenceTracker();
	private final UUID user = UUID.randomUUID();

	@Test
	void appearsWithTheFirstTabAndLeavesWithTheLast() {
		assertThat(tracker.connect(user, "tab-1")).isTrue();
		assertThat(tracker.connect(user, "tab-2")).isFalse();

		assertThat(tracker.disconnect(user, "tab-1")).isFalse();
		assertThat(tracker.isOnline(user)).isTrue();

		assertThat(tracker.disconnect(user, "tab-2")).isTrue();
		assertThat(tracker.isOnline(user)).isFalse();
	}

	@Test
	void ignoresUnknownSessions() {
		tracker.connect(user, "tab-1");
		assertThat(tracker.disconnect(user, "ghost")).isFalse();
		assertThat(tracker.disconnect(UUID.randomUUID(), "tab-1")).isFalse();
		assertThat(tracker.isOnline(user)).isTrue();
	}

	@Test
	void pinnedUsersStayOnlineWithoutAnnouncements() {
		tracker.pin(user);
		assertThat(tracker.isOnline(user)).isTrue();
		assertThat(tracker.onlineIds()).containsExactly(user);

		assertThat(tracker.connect(user, "tab-1")).isFalse();
		assertThat(tracker.disconnect(user, "tab-1")).isFalse();
		assertThat(tracker.isOnline(user)).isTrue();
	}
}
