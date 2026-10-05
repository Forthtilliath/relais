package dev.forthtilliath.chat.message;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Limit;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.forthtilliath.chat.common.AfterCommit;
import dev.forthtilliath.chat.common.ApiException;
import dev.forthtilliath.chat.realtime.RoomEvent;
import dev.forthtilliath.chat.realtime.Topics;
import dev.forthtilliath.chat.room.Membership;
import dev.forthtilliath.chat.room.MembershipRepository;
import dev.forthtilliath.chat.room.Room;
import dev.forthtilliath.chat.room.RoomService;
import dev.forthtilliath.chat.user.ChatUser;
import dev.forthtilliath.chat.user.ChatUserRepository;
import dev.forthtilliath.chat.user.UserRef;

@Service
@Transactional
public class MessageService {

	public static final int MAX_LENGTH = 2000;
	public static final int PAGE_SIZE = 50;

	private final MessageRepository messages;
	private final MembershipRepository memberships;
	private final ChatUserRepository users;
	private final RoomService rooms;
	private final FloodGuard floodGuard;
	private final SimpMessageSendingOperations broker;
	private final ApplicationEventPublisher events;

	public MessageService(MessageRepository messages, MembershipRepository memberships, ChatUserRepository users,
			RoomService rooms, FloodGuard floodGuard, SimpMessageSendingOperations broker,
			ApplicationEventPublisher events) {
		this.messages = messages;
		this.memberships = memberships;
		this.users = users;
		this.rooms = rooms;
		this.floodGuard = floodGuard;
		this.broker = broker;
		this.events = events;
	}

	/** Une page d'historique, du plus ancien au plus récent, avant le message {@code before} s'il est donné. */
	@Transactional(readOnly = true)
	public List<MessageView> history(UUID roomId, Long before, int limit) {
		rooms.find(roomId);
		Limit page = Limit.of(Math.clamp(limit, 1, 100));
		List<Message> newestFirst = before == null
				? messages.findByRoomIdOrderByIdDesc(roomId, page)
				: messages.findByRoomIdAndIdLessThanOrderByIdDesc(roomId, before, page);
		return newestFirst.reversed().stream().map(message -> MessageView.of(message, null)).toList();
	}

	/**
	 * Enregistre puis diffuse un message : à tout le canal ({@code /topic/rooms/{id}}) et, en privé, à chaque
	 * utilisateur mentionné ({@code /user/queue/mentions}). Le message compte comme lu pour son auteur.
	 */
	public MessageView post(UUID authorId, UUID roomId, String rawContent, String clientId) {
		Room room = rooms.find(roomId);
		ChatUser author = users.findById(authorId).orElseThrow(() -> ApiException.unauthorized("Session expirée."));
		Membership membership = memberships.findByRoomIdAndUserId(roomId, authorId)
				.orElseThrow(() -> ApiException.forbidden("Rejoignez #" + room.getName() + " pour y émettre."));

		String content = rawContent == null ? "" : rawContent.strip();
		if (content.isEmpty()) {
			throw ApiException.badRequest("Le message est vide.");
		}
		if (content.length() > MAX_LENGTH) {
			throw ApiException.badRequest("Message trop long (" + MAX_LENGTH + " caractères maximum).");
		}
		if (!author.isBot() && !floodGuard.tryAcquire(authorId)) {
			throw ApiException.tooManyRequests("Doucement ! Attendez quelques secondes avant d'émettre à nouveau.");
		}

		Message message = messages.save(new Message(roomId, author, content));
		membership.markRead(message.getId());
		MessageView view = MessageView.of(message, clientId);
		List<ChatUser> mentioned = mentionedUsers(content, authorId);

		AfterCommit.run(() -> {
			broker.convertAndSend(Topics.room(roomId), RoomEvent.message(view));
			MentionNotice notice = new MentionNotice(room.getName(), view);
			mentioned.forEach(user -> broker.convertAndSendToUser(user.getId().toString(), Topics.USER_MENTIONS, notice));
		});
		events.publishEvent(new MessagePostedEvent(view,
				mentioned.stream().map(ChatUser::getId).collect(Collectors.toUnmodifiableSet())));
		return view;
	}

	/** « … écrit » : éphémère, jamais enregistré, réservé aux membres du canal. */
	@Transactional(readOnly = true)
	public void typing(UserRef user, UUID roomId) {
		if (memberships.existsByRoomIdAndUserId(roomId, user.id())) {
			broker.convertAndSend(Topics.room(roomId), RoomEvent.typing(roomId, user));
		}
	}

	private List<ChatUser> mentionedUsers(String content, UUID authorId) {
		Set<String> keys = Mentions.keys(content);
		if (keys.isEmpty()) {
			return List.of();
		}
		return users.findByNicknameKeyIn(keys).stream().filter(user -> !user.getId().equals(authorId)).toList();
	}
}
