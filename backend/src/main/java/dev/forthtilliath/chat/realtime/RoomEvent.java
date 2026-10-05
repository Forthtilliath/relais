package dev.forthtilliath.chat.realtime;

import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonInclude;

import dev.forthtilliath.chat.message.MessageView;
import dev.forthtilliath.chat.user.UserRef;

/**
 * Tout ce qui passe sur {@code /topic/rooms/{id}} : un seul abonnement par canal, le client aiguille sur
 * {@code type} ({@code message}, {@code typing} ou {@code member}).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record RoomEvent(String type, UUID roomId, MessageView message, UserRef user, Boolean joined) {

	public static RoomEvent message(MessageView message) {
		return new RoomEvent("message", message.roomId(), message, null, null);
	}

	public static RoomEvent typing(UUID roomId, UserRef user) {
		return new RoomEvent("typing", roomId, null, user, null);
	}

	public static RoomEvent member(UUID roomId, UserRef user, boolean joined) {
		return new RoomEvent("member", roomId, null, user, joined);
	}
}
