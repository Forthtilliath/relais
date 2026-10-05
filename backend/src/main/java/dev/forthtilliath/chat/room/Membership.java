package dev.forthtilliath.chat.room;

import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

/**
 * Appartenance à un canal, avec le marque-page de lecture : tout message d'un autre auteur dont l'id dépasse
 * {@code lastReadMessageId} est non lu.
 */
@Entity
@Table(name = "memberships")
@IdClass(Membership.Key.class)
public class Membership {

	@Id
	@Column(name = "room_id")
	private UUID roomId;

	@Id
	@Column(name = "user_id")
	private UUID userId;

	@Column(name = "last_read_message_id")
	private Long lastReadMessageId;

	@Column(name = "joined_at", nullable = false)
	private Instant joinedAt;

	protected Membership() {
	}

	public Membership(UUID roomId, UUID userId, Long lastReadMessageId) {
		this.roomId = roomId;
		this.userId = userId;
		this.lastReadMessageId = lastReadMessageId;
		this.joinedAt = Instant.now();
	}

	/** Le marque-page n'avance que vers l'avant (deux onglets peuvent signaler leur lecture dans le désordre). */
	public void markRead(long messageId) {
		if (lastReadMessageId == null || messageId > lastReadMessageId) {
			lastReadMessageId = messageId;
		}
	}

	public UUID getRoomId() {
		return roomId;
	}

	public UUID getUserId() {
		return userId;
	}

	public Long getLastReadMessageId() {
		return lastReadMessageId;
	}

	public static class Key implements Serializable {

		private UUID roomId;
		private UUID userId;

		protected Key() {
		}

		public Key(UUID roomId, UUID userId) {
			this.roomId = roomId;
			this.userId = userId;
		}

		@Override
		public boolean equals(Object other) {
			return other instanceof Key key && Objects.equals(roomId, key.roomId) && Objects.equals(userId, key.userId);
		}

		@Override
		public int hashCode() {
			return Objects.hash(roomId, userId);
		}
	}
}
