package dev.forthtilliath.chat.user;

import java.util.UUID;

/** Signature d'un auteur : ce qu'il faut pour afficher un message ou un « … écrit ». */
public record UserRef(UUID id, String nickname, LampColor color, boolean bot) {

	public static UserRef of(ChatUser user) {
		return new UserRef(user.getId(), user.getNickname(), user.getColor(), user.isBot());
	}
}
