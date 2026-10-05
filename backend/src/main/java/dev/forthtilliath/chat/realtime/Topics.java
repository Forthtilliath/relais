package dev.forthtilliath.chat.realtime;

import java.util.UUID;

/** Destinations STOMP diffusées par le serveur (le client s'y abonne, n'y publie jamais). */
public final class Topics {

	/** Canaux créés : tous les clients mettent leur liste à jour. */
	public static final String ROOMS = "/topic/rooms";
	/** Arrivées et départs (connexion / déconnexion du dernier onglet). */
	public static final String PRESENCE = "/topic/presence";
	/** Files personnelles, résolues par Spring en {@code /user/queue/…} pour chaque session de l'utilisateur. */
	public static final String USER_MENTIONS = "/queue/mentions";
	public static final String USER_ERRORS = "/queue/errors";

	private Topics() {
	}

	/** Messages, saisie en cours et mouvements de membres d'un canal. */
	public static String room(UUID roomId) {
		return ROOMS + "/" + roomId;
	}
}
