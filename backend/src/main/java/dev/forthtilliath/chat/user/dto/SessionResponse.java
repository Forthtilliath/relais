package dev.forthtilliath.chat.user.dto;

import dev.forthtilliath.chat.user.UserView;

/** Le jeton n'est renvoyé qu'ici : le client le garde et l'envoie en {@code Bearer} (REST et CONNECT STOMP). */
public record SessionResponse(String token, UserView user) {
}
