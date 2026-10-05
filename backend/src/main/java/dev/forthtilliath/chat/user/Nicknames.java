package dev.forthtilliath.chat.user;

import java.util.Locale;

/** Règles d'un indicatif, partagées par la validation et la détection des mentions. */
public final class Nicknames {

	/** Caractères d'un indicatif, sans bornes : réutilisé par l'expression des mentions. */
	public static final String CHARS = "[A-Za-z0-9_-]";
	public static final String PATTERN = CHARS + "{2,24}";
	public static final String RULE = "2 à 24 caractères : lettres sans accent, chiffres, _ ou -.";

	private Nicknames() {
	}

	public static String key(String nickname) {
		return nickname.toLowerCase(Locale.ROOT);
	}
}
