package dev.forthtilliath.chat.message;

import java.util.LinkedHashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import dev.forthtilliath.chat.user.Nicknames;

/**
 * Repère les {@code @indicatif} d'un message. Le {@code @} ne doit pas suivre une lettre ou un chiffre :
 * {@code ada@example.com} n'est pas une mention. Même règle côté Angular ({@code message-format.ts}).
 */
public final class Mentions {

	private static final Pattern MENTION = Pattern.compile("(?<![\\w@])@(" + Nicknames.PATTERN + ")(?!" + Nicknames.CHARS + ")");

	private Mentions() {
	}

	/** Indicatifs mentionnés, en minuscules (clés de recherche), sans doublon, dans l'ordre d'apparition. */
	public static Set<String> keys(String content) {
		Set<String> keys = new LinkedHashSet<>();
		Matcher matcher = MENTION.matcher(content);
		while (matcher.find()) {
			keys.add(Nicknames.key(matcher.group(1)));
		}
		return keys;
	}
}
