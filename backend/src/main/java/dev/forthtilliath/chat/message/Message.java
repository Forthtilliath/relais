package dev.forthtilliath.chat.message;

import java.time.Instant;
import java.util.UUID;

import dev.forthtilliath.chat.user.ChatUser;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * Identifiant séquentiel : il ordonne les messages, sert de curseur de pagination ({@code before=id}) et de
 * marque-page de lecture, sans dépendre de l'horloge.
 */
@Entity
@Table(name = "messages")
public class Message {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "room_id", nullable = false)
	private UUID roomId;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "author_id")
	private ChatUser author;

	@Column(nullable = false, length = MessageService.MAX_LENGTH)
	private String content;

	@Column(name = "sent_at", nullable = false)
	private Instant sentAt;

	protected Message() {
	}

	public Message(UUID roomId, ChatUser author, String content) {
		this.roomId = roomId;
		this.author = author;
		this.content = content;
		this.sentAt = Instant.now();
	}

	public Long getId() {
		return id;
	}

	public UUID getRoomId() {
		return roomId;
	}

	public ChatUser getAuthor() {
		return author;
	}

	public String getContent() {
		return content;
	}

	public Instant getSentAt() {
		return sentAt;
	}
}
