package dev.forthtilliath.chat.message;

import java.util.Set;
import java.util.UUID;

/** Publié après chaque message accepté, avec les utilisateurs effectivement mentionnés. */
public record MessagePostedEvent(MessageView message, Set<UUID> mentionedIds) {
}
