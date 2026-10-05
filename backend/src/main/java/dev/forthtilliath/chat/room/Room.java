package dev.forthtilliath.chat.room;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Un canal public, nommé comme un slug ({@code angular-signals}) et affiché {@code #angular-signals}. */
@Entity
@Table(name = "rooms")
public class Room {

	@Id
	private UUID id;

	@Column(nullable = false, unique = true, length = 32)
	private String name;

	@Column(length = 160)
	private String topic;

	@Column(name = "created_by")
	private UUID createdBy;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	protected Room() {
	}

	public Room(String name, String topic, UUID createdBy) {
		this.id = UUID.randomUUID();
		this.name = name;
		this.topic = topic;
		this.createdBy = createdBy;
		this.createdAt = Instant.now();
	}

	public UUID getId() {
		return id;
	}

	public String getName() {
		return name;
	}

	public String getTopic() {
		return topic;
	}
}
