package dev.forthtilliath.chat.message;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.UUID;

import org.junit.jupiter.api.Test;

class FloodGuardTest {

	private final MutableClock clock = new MutableClock(Instant.parse("2026-10-05T10:00:00Z"));
	private final FloodGuard guard = new FloodGuard(clock);
	private final UUID user = UUID.randomUUID();

	@Test
	void allowsABurstUpToTheLimitThenRefuses() {
		for (int i = 0; i < FloodGuard.MAX_MESSAGES; i++) {
			assertThat(guard.tryAcquire(user)).isTrue();
		}
		assertThat(guard.tryAcquire(user)).isFalse();
	}

	@Test
	void slidingWindowFreesSlotsOverTime() {
		for (int i = 0; i < FloodGuard.MAX_MESSAGES; i++) {
			guard.tryAcquire(user);
		}
		clock.advance(FloodGuard.WINDOW);
		assertThat(guard.tryAcquire(user)).isTrue();
	}

	@Test
	void countsEachUserSeparately() {
		for (int i = 0; i < FloodGuard.MAX_MESSAGES; i++) {
			guard.tryAcquire(user);
		}
		assertThat(guard.tryAcquire(UUID.randomUUID())).isTrue();
	}

	private static final class MutableClock extends Clock {

		private Instant now;

		MutableClock(Instant now) {
			this.now = now;
		}

		void advance(Duration duration) {
			now = now.plus(duration);
		}

		@Override
		public Instant instant() {
			return now;
		}

		@Override
		public ZoneId getZone() {
			return ZoneOffset.UTC;
		}

		@Override
		public Clock withZone(ZoneId zone) {
			return this;
		}
	}
}
