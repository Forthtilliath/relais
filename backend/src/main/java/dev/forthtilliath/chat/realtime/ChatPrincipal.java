package dev.forthtilliath.chat.realtime;

import java.security.Principal;

import dev.forthtilliath.chat.user.UserRef;

/**
 * Utilisateur attaché à une session STOMP. Son nom est l'identifiant : c'est lui que Spring utilise pour
 * router {@code convertAndSendToUser} vers toutes les sessions (onglets) de la personne.
 */
public record ChatPrincipal(UserRef user) implements Principal {

	@Override
	public String getName() {
		return user.id().toString();
	}
}
