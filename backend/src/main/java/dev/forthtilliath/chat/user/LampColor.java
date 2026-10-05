package dev.forthtilliath.chat.user;

import java.util.Locale;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/** Couleur du voyant d'un utilisateur (avatar, pseudo). Sérialisée en minuscules : {@code "ambre"}. */
public enum LampColor {
	AMBRE, CORAIL, MENTHE, AZUR, LILAS, CITRON;

	@JsonValue
	public String json() {
		return name().toLowerCase(Locale.ROOT);
	}

	@JsonCreator
	public static LampColor fromJson(String value) {
		return valueOf(value.toUpperCase(Locale.ROOT));
	}
}
