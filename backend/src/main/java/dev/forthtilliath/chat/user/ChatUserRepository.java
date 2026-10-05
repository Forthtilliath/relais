package dev.forthtilliath.chat.user;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface ChatUserRepository extends JpaRepository<ChatUser, UUID> {

	Optional<ChatUser> findByNicknameKey(String nicknameKey);

	Optional<ChatUser> findByTokenHash(String tokenHash);

	List<ChatUser> findByNicknameKeyIn(Collection<String> nicknameKeys);

	List<ChatUser> findByBotTrue();

	@Modifying
	@Query("update ChatUser u set u.lastSeenAt = :at where u.id = :id")
	void touchLastSeen(UUID id, Instant at);
}
