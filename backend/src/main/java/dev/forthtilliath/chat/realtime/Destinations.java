package dev.forthtilliath.chat.realtime;

/**
 * Ce qu'un client a le droit de faire. Sans ces règles, le broker simple accepterait un SEND direct sur
 * {@code /topic/rooms/…} : n'importe qui pourrait diffuser un faux message sans passer par le serveur.
 */
public final class Destinations {

	private Destinations() {
	}

	/** Publication : uniquement vers les contrôleurs applicatifs ({@code @MessageMapping}). */
	public static boolean canSend(String destination) {
		return destination != null && destination.startsWith("/app/");
	}

	/** Abonnement : topics publics, files personnelles résolues par Spring, instantané de présence. */
	public static boolean canSubscribe(String destination) {
		return destination != null
				&& (destination.startsWith("/topic/") || destination.startsWith("/user/queue/")
						|| destination.equals("/app/presence"));
	}
}
