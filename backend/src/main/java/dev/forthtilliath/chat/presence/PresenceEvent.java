package dev.forthtilliath.chat.presence;

import dev.forthtilliath.chat.user.UserView;

/** Diffusé sur {@code /topic/presence} : l'utilisateur, déjà marqué en ligne ou hors ligne. */
public record PresenceEvent(UserView user) {
}
