package dev.forthtilliath.chat.room;

import java.util.UUID;

/** Projection JPQL « un compteur par canal » (membres, non-lus). */
public record RoomCount(UUID roomId, Long count) {
}
