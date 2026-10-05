package dev.forthtilliath.chat.room;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.forthtilliath.chat.common.AfterCommit;
import dev.forthtilliath.chat.common.ApiException;
import dev.forthtilliath.chat.message.Message;
import dev.forthtilliath.chat.message.MessageRepository;
import dev.forthtilliath.chat.message.MessageView;
import dev.forthtilliath.chat.presence.PresenceTracker;
import dev.forthtilliath.chat.realtime.RoomEvent;
import dev.forthtilliath.chat.realtime.Topics;
import dev.forthtilliath.chat.room.dto.RoomRequest;
import dev.forthtilliath.chat.room.dto.RoomView;
import dev.forthtilliath.chat.user.ChatUser;
import dev.forthtilliath.chat.user.ChatUserRepository;
import dev.forthtilliath.chat.user.UserRef;
import dev.forthtilliath.chat.user.UserView;

@Service
@Transactional
public class RoomService {

	/** Canal commun : tout nouvel indicatif y entre, personne ne peut le quitter. */
	public static final String DEFAULT_ROOM = "general";

	private final RoomRepository rooms;
	private final MembershipRepository memberships;
	private final MessageRepository messages;
	private final ChatUserRepository users;
	private final PresenceTracker presence;
	private final SimpMessageSendingOperations broker;

	public RoomService(RoomRepository rooms, MembershipRepository memberships, MessageRepository messages,
			ChatUserRepository users, PresenceTracker presence, SimpMessageSendingOperations broker) {
		this.rooms = rooms;
		this.memberships = memberships;
		this.messages = messages;
		this.users = users;
		this.presence = presence;
		this.broker = broker;
	}

	/** Tous les canaux, avec 4 requêtes au total (membres, non-lus, appartenances, derniers messages). */
	@Transactional(readOnly = true)
	public List<RoomView> list(UUID userId) {
		Map<UUID, Long> memberCounts = byRoom(memberships.countMembers());
		Map<UUID, Long> unread = byRoom(messages.countUnread(userId));
		Map<UUID, Membership> joined = memberships.findByUserId(userId).stream()
				.collect(Collectors.toMap(Membership::getRoomId, Function.identity()));
		Map<UUID, Message> lastMessages = messages.findLastOfEachRoom().stream()
				.collect(Collectors.toMap(Message::getRoomId, Function.identity()));

		return rooms.findAll(Sort.by("name")).stream().map(room -> {
			Membership membership = joined.get(room.getId());
			Message last = lastMessages.get(room.getId());
			return new RoomView(room.getId(), room.getName(), room.getTopic(),
					memberCounts.getOrDefault(room.getId(), 0L), membership != null,
					unread.getOrDefault(room.getId(), 0L),
					membership == null ? null : membership.getLastReadMessageId(),
					last == null ? null : MessageView.of(last, null));
		}).toList();
	}

	public RoomView create(ChatUser creator, RoomRequest request) {
		String name = request.name().strip();
		if (rooms.existsByName(name)) {
			throw ApiException.conflict("Le canal #" + name + " existe déjà.");
		}
		String topic = request.topic() == null || request.topic().isBlank() ? null : request.topic().strip();
		Room room = rooms.save(new Room(name, topic, creator.getId()));
		memberships.save(new Membership(room.getId(), creator.getId(), null));

		RoomView announced = new RoomView(room.getId(), name, topic, 1, false, 0, null, null);
		AfterCommit.run(() -> broker.convertAndSend(Topics.ROOMS, announced));
		return new RoomView(room.getId(), name, topic, 1, true, 0, null, null);
	}

	public void join(ChatUser user, UUID roomId) {
		find(roomId);
		ensureMember(roomId, UserRef.of(user));
	}

	/**
	 * Fait entrer l'utilisateur s'il n'est pas déjà membre. Le marque-page est posé sur le dernier message :
	 * on n'arrive pas dans un canal avec tout son historique en non-lus.
	 */
	public boolean ensureMember(UUID roomId, UserRef user) {
		if (memberships.existsByRoomIdAndUserId(roomId, user.id())) {
			return false;
		}
		memberships.save(new Membership(roomId, user.id(), messages.findLastId(roomId)));
		AfterCommit.run(() -> broker.convertAndSend(Topics.room(roomId), RoomEvent.member(roomId, user, true)));
		return true;
	}

	public void joinDefaults(UserRef user) {
		rooms.findByName(DEFAULT_ROOM).ifPresent(room -> ensureMember(room.getId(), user));
	}

	public void leave(ChatUser user, UUID roomId) {
		Room room = find(roomId);
		if (DEFAULT_ROOM.equals(room.getName())) {
			throw ApiException.forbidden("#" + DEFAULT_ROOM + " est le canal commun : on ne peut pas le quitter.");
		}
		memberships.findByRoomIdAndUserId(roomId, user.getId()).ifPresent(membership -> {
			memberships.delete(membership);
			UserRef ref = UserRef.of(user);
			AfterCommit.run(() -> broker.convertAndSend(Topics.room(roomId), RoomEvent.member(roomId, ref, false)));
		});
	}

	@Transactional(readOnly = true)
	public List<UserView> members(UUID roomId) {
		find(roomId);
		List<UUID> ids = memberships.findByRoomId(roomId).stream().map(Membership::getUserId).toList();
		return users.findAllById(ids).stream()
				.map(user -> UserView.of(user, presence.isOnline(user.getId())))
				.sorted(UserView.PRESENCE_ORDER)
				.toList();
	}

	/** Avance le marque-page, borné au dernier message réel du canal (un id inventé ne masque rien). */
	public void markRead(ChatUser user, UUID roomId, long messageId) {
		Long lastId = messages.findLastId(roomId);
		if (lastId == null) {
			return;
		}
		memberships.findByRoomIdAndUserId(roomId, user.getId())
				.ifPresent(membership -> membership.markRead(Math.min(messageId, lastId)));
	}

	@Transactional(readOnly = true)
	public Optional<Room> findByName(String name) {
		return rooms.findByName(name);
	}

	@Transactional(readOnly = true)
	public Room find(UUID roomId) {
		return rooms.findById(roomId).orElseThrow(() -> ApiException.notFound("Canal introuvable."));
	}

	private static Map<UUID, Long> byRoom(List<RoomCount> counts) {
		return counts.stream().collect(Collectors.toMap(RoomCount::roomId, RoomCount::count));
	}
}
