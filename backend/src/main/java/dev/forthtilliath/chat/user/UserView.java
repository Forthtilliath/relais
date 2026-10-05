package dev.forthtilliath.chat.user;

import java.time.Instant;
import java.util.Comparator;
import java.util.UUID;

/** Utilisateur avec son état de présence (liste des membres, utilisateurs en ligne). */
public record UserView(UUID id, String nickname, LampColor color, boolean bot, boolean online, Instant lastSeenAt) {

	/** En ligne d'abord, puis ordre alphabétique insensible à la casse. */
	public static final Comparator<UserView> PRESENCE_ORDER = Comparator.comparing(UserView::online).reversed()
			.thenComparing(UserView::nickname, String.CASE_INSENSITIVE_ORDER);

	public static UserView of(ChatUser user, boolean online) {
		return new UserView(user.getId(), user.getNickname(), user.getColor(), user.isBot(), online,
				user.getLastSeenAt());
	}

	public static UserView of(UserRef user, boolean online, Instant lastSeenAt) {
		return new UserView(user.id(), user.nickname(), user.color(), user.bot(), online, lastSeenAt);
	}
}
