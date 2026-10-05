package dev.forthtilliath.chat.demo;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import java.util.regex.Pattern;

/** Répliques des bots de démonstration : une personnalité chacun, plus quelques réactions communes. */
final class BotLines {

	private static final Pattern GREETING = Pattern.compile("\\b(bonjour|salut|hello|coucou|hey|yo)\\b");

	private static final List<String> GREETINGS = List.of(
			"Salut ! Bienvenue sur la fréquence.",
			"Bonjour ! Le relais est bien reçu, cinq sur cinq.",
			"Hello ! Content de te voir à l'antenne.");

	private static final Map<String, List<String>> REPLIES = Map.of(
			"ada", List.of(
					"La machine ne crée rien : elle fait ce qu'on sait lui ordonner. Ici, elle relaie tes messages en STOMP.",
					"Je viens de recevoir ta mention en direct via /user/queue/mentions. Élégant, non ?",
					"Une boucle, une condition, et beaucoup d'imagination : c'est tout ce qu'il faut.",
					"Ton message a fait le trajet Angular → Spring → PostgreSQL → tous les abonnés en quelques millisecondes."),
			"grace", List.of(
					"Si ça marche du premier coup, méfie-toi. Mais là, ça a l'air de marcher.",
					"J'ai trouvé un bug une fois. Un vrai, avec des ailes. Rien de tel ici, promis.",
					"Plus facile de demander pardon que la permission : crée donc ton propre canal avec le bouton +.",
					"Ouvre un deuxième onglet avec un autre indicatif : tu verras la présence et le « … écrit » en direct."),
			"linus", List.of(
					"Parle moins, montre le code.",
					"Reçu. Le WebSocket tient, les battements de cœur aussi.",
					"Ça compile, ça passe les tests, ça se fusionne en rebase. Suivant.",
					"Bonne question. La réponse est dans le README, section Architecture."));

	private static final String FALLBACK = "Message reçu !";

	private BotLines() {
	}

	/** Réponse d'un bot à un message qui le mentionne, adressée à son auteur. */
	static String reply(String botNickname, String authorNickname, String content) {
		List<String> lines = GREETING.matcher(content.toLowerCase(Locale.ROOT)).find()
				? GREETINGS
				: REPLIES.getOrDefault(botNickname.toLowerCase(Locale.ROOT), List.of(FALLBACK));
		return "@" + authorNickname + " " + lines.get(ThreadLocalRandom.current().nextInt(lines.size()));
	}

	static String welcome(String newcomer, List<String> botNicknames) {
		String bots = String.join(", ", botNicknames.stream().map(name -> "@" + name).toList());
		return "Bienvenue sur Relais, @" + newcomer + " ! Mentionnez " + bots
				+ " pour voir les notifications et le « … écrit » en direct. Ouvrez un second onglet avec un autre "
				+ "indicatif pour tester la présence.";
	}
}
