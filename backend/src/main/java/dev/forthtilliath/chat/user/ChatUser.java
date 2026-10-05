package dev.forthtilliath.chat.user;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Compte invité : un indicatif (pseudo) et une couleur, sans mot de passe. Le jeton de session n'est stocké
 * qu'en empreinte SHA-256 ; un indicatif sans jeton (déconnecté) peut être repris par quelqu'un d'autre.
 */
@Entity
@Table(name = "chat_users")
public class ChatUser {

	@Id
	private UUID id;

	@Column(nullable = false, length = 24)
	private String nickname;

	/** Indicatif en minuscules : unicité insensible à la casse et résolution des mentions. */
	@Column(name = "nickname_key", nullable = false, unique = true, length = 24)
	private String nicknameKey;

	@Enumerated(EnumType.STRING)
	@JdbcTypeCode(SqlTypes.VARCHAR)
	@Column(nullable = false, length = 16)
	private LampColor color;

	@Column(name = "token_hash", unique = true, length = 64)
	private String tokenHash;

	@Column(nullable = false)
	private boolean bot;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	@Column(name = "last_seen_at")
	private Instant lastSeenAt;

	protected ChatUser() {
	}

	public ChatUser(String nickname, LampColor color) {
		this.id = UUID.randomUUID();
		this.color = color;
		this.createdAt = Instant.now();
		rename(nickname);
	}

	public void rename(String nickname) {
		this.nickname = nickname;
		this.nicknameKey = Nicknames.key(nickname);
	}

	public void issueToken(String tokenHash) {
		this.tokenHash = tokenHash;
	}

	public void revokeToken() {
		this.tokenHash = null;
	}

	public UUID getId() {
		return id;
	}

	public String getNickname() {
		return nickname;
	}

	public LampColor getColor() {
		return color;
	}

	public void setColor(LampColor color) {
		this.color = color;
	}

	public String getTokenHash() {
		return tokenHash;
	}

	public boolean isBot() {
		return bot;
	}

	public Instant getLastSeenAt() {
		return lastSeenAt;
	}
}
