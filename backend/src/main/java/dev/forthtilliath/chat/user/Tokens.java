package dev.forthtilliath.chat.user;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

/** Jetons de session : 256 bits aléatoires côté client, empreinte SHA-256 côté base. */
public final class Tokens {

	private static final SecureRandom RANDOM = new SecureRandom();
	private static final String BEARER = "Bearer ";

	private Tokens() {
	}

	public static String generate() {
		byte[] bytes = new byte[32];
		RANDOM.nextBytes(bytes);
		return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
	}

	public static String hash(String token) {
		try {
			byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
			return HexFormat.of().formatHex(digest);
		} catch (NoSuchAlgorithmException ex) {
			throw new IllegalStateException("SHA-256 indisponible", ex);
		}
	}

	/** Extrait le jeton d'un en-tête {@code Authorization: Bearer …}, ou {@code null}. */
	public static String fromBearer(String header) {
		if (header == null || !header.startsWith(BEARER)) {
			return null;
		}
		String token = header.substring(BEARER.length()).strip();
		return token.isEmpty() ? null : token;
	}
}
