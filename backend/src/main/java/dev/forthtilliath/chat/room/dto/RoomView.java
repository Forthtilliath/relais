package dev.forthtilliath.chat.room.dto;

import java.util.UUID;

import dev.forthtilliath.chat.message.MessageView;

/**
 * Un canal vu par un utilisateur : appartenance, non-lus, marque-page (pour placer le repère « nouveaux
 * messages » à l'ouverture) et dernier message pour l'aperçu.
 */
public record RoomView(UUID id, String name, String topic, long memberCount, boolean joined, long unread,
		Long lastReadMessageId, MessageView lastMessage) {
}
